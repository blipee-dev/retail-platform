import requests
from datetime import datetime, timedelta
from typing import Any, Dict, List
import pandas as pd
from io import StringIO
import base64
from .base_connector import BaseConnector, ConnectorConfig

class PeopleCountingConnector(BaseConnector):
    """Connector for people counting cameras with video analytics"""
    
    def __init__(self, config: ConnectorConfig):
        super().__init__(config)
        self.session = requests.Session()
        self._setup_session()
    
    def _setup_session(self):
        """Setup HTTP session with authentication"""
        auth = self.config.connection.get('auth', {})
        auth_type = auth.get('type', 'none')
        
        if auth_type == 'basic':
            username = auth.get('username', '')
            password = auth.get('password', '')
            self.session.auth = (username, password)
        elif auth_type == 'token':
            token = auth.get('token', '')
            self.session.headers['Authorization'] = f'Bearer {token}'
    
    def authenticate(self) -> bool:
        """Validate authentication by making a test request"""
        try:
            url = self._build_url('people_counting', datetime.now(), datetime.now())
            response = self.session.get(url, timeout=5)
            return response.status_code != 401
        except Exception as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False
    
    def _build_url(self, endpoint_type: str, start_time: datetime, end_time: datetime) -> str:
        """Build URL for specific endpoint and time range"""
        host = self.config.connection.get('host')
        port = self.config.connection.get('port')
        endpoint = self.config.endpoints.get(endpoint_type, '')
        
        # Format base URL
        base_url = f"http://{host}:{port}{endpoint}"
        
        # Add time parameters
        if '?' in base_url:
            base_url += '&'
        else:
            base_url += '?'
        
        base_url += f"time_start={start_time.strftime('%Y-%m-%d-%H:%M:%S')}"
        base_url += f"&time_end={end_time.strftime('%Y-%m-%d-%H:%M:%S')}"
        
        return base_url
    
    def fetch_data(self, start_time: datetime, end_time: datetime, endpoint_type: str = 'people_counting') -> str:
        """Fetch CSV data from the camera"""
        url = self._build_url(endpoint_type, start_time, end_time)
        
        self.logger.debug(f"Fetching data from: {url}")
        
        try:
            response = self.session.get(url, timeout=self.config.timeout)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch data: {str(e)}")
            raise
    
    def parse_data(self, raw_data: str, endpoint_type: str = 'people_counting') -> List[Dict[str, Any]]:
        """Parse CSV data based on endpoint type"""
        if not raw_data or raw_data.strip() == '':
            return []
        
        try:
            df = pd.read_csv(StringIO(raw_data))
            df.columns = [col.strip() for col in df.columns]
            
            if endpoint_type == 'people_counting':
                return self._parse_people_counting(df)
            elif endpoint_type == 'heatmap':
                return self._parse_heatmap(df)
            elif endpoint_type == 'regional':
                return self._parse_regional_counting(df)
            else:
                self.logger.warning(f"Unknown endpoint type: {endpoint_type}")
                return []
                
        except Exception as e:
            self.logger.error(f"Failed to parse data: {str(e)}")
            return []
    
    def _parse_people_counting(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse people counting specific data"""
        data = []
        mapping = self.config.data_mapping.get('fields', {})
        timestamp_format = self.config.data_mapping.get('timestamp_format', '%Y/%m/%d %H:%M:%S')
        
        for _, row in df.iterrows():
            record = {
                'sensor_name': self.config.name,
                'store': self.config.store,
                'timestamp': datetime.strptime(row.get('StartTime', ''), timestamp_format),
                'data_type': 'people_counting'
            }
            
            # Apply field mappings
            for field_map in mapping:
                source = field_map.get('source')
                target = field_map.get('target')
                data_type = field_map.get('type', 'string')
                
                if source in row:
                    value = row[source]
                    if data_type == 'integer':
                        value = int(value) if pd.notna(value) else 0
                    elif data_type == 'float':
                        value = float(value) if pd.notna(value) else 0.0
                    record[target] = value
            
            # Calculate total if line data exists
            if all(key in record for key in ['line1_in', 'line2_in', 'line3_in']):
                record['total_in'] = record['line1_in'] + record['line2_in'] + record['line3_in']
            
            data.append(record)
        
        return data
    
    def _parse_heatmap(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse heatmap data"""
        data = []
        timestamp_format = self.config.data_mapping.get('timestamp_format', '%Y-%m-%d %H:%M:%S')
        
        for _, row in df.iterrows():
            record = {
                'sensor_name': self.config.name,
                'store': self.config.store,
                'timestamp': datetime.strptime(row.get('StartTime', ''), timestamp_format),
                'data_type': 'heatmap',
                'value': int(row.get('Value(s)', 0))
            }
            data.append(record)
        
        return data
    
    def _parse_regional_counting(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse regional counting data"""
        data = []
        timestamp_format = self.config.data_mapping.get('timestamp_format', '%Y/%m/%d %H:%M:%S')
        
        for _, row in df.iterrows():
            record = {
                'sensor_name': self.config.name,
                'store': self.config.store,
                'timestamp': datetime.strptime(row.get('StartTime', ''), timestamp_format),
                'data_type': 'regional_counting',
                'region1': int(row.get('region1', 0)),
                'region2': int(row.get('region2', 0)),
                'region3': int(row.get('region3', 0)),
                'region4': int(row.get('region4', 0)),
                'total': int(row.get('Sum', 0))
            }
            data.append(record)
        
        return data
    
    def validate_connection(self) -> bool:
        """Test connection to the camera"""
        try:
            # Try to fetch a small amount of data
            now = datetime.now()
            test_data = self.fetch_data(now - timedelta(minutes=5), now, 'people_counting')
            return len(test_data) > 0
        except Exception as e:
            self.logger.error(f"Connection validation failed: {str(e)}")
            return False