import requests
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import pandas as pd
from io import StringIO
import json
from .base_connector import BaseConnector, ConnectorConfig

class MilesightConnector(BaseConnector):
    """Enhanced connector for Milesight IP cameras with full API support"""
    
    def __init__(self, config: ConnectorConfig):
        super().__init__(config)
        self.session = requests.Session()
        self._setup_session()
        
        # Milesight specific features
        self.supports_regional_counting = config.data_mapping.get('supports_regional_counting', False)
        self.supports_real_time_status = config.data_mapping.get('supports_real_time_status', True)
        self.line_count = config.data_mapping.get('line_count', 4)
        self.region_count = config.data_mapping.get('region_count', 4)
    
    def _setup_session(self):
        """Setup HTTP session with Milesight authentication"""
        auth = self.config.connection.get('auth', {})
        auth_type = auth.get('type', 'basic')
        
        if auth_type == 'basic':
            username = auth.get('username', 'admin')
            password = auth.get('password', '')
            self.session.auth = (username, password)
        
        # Set common headers
        self.session.headers.update({
            'User-Agent': 'Milesight-Connector/1.0',
            'Accept': 'text/csv,application/json,*/*'
        })
    
    def authenticate(self) -> bool:
        """Validate authentication with Milesight camera"""
        try:
            # Test with a simple VCA status request
            url = self._build_cgi_url('get.vca.alarmstatus')
            response = self.session.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False
    
    def _build_cgi_url(self, action: str) -> str:
        """Build CGI URL for configuration/status requests"""
        host = self.config.connection.get('host')
        port = self.config.connection.get('port', 80)
        
        return f"http://{host}:{port}/cgi-bin/operator/operator.cgi?action={action}"
    
    def _build_dataloader_url(self, endpoint_type: str, start_time: datetime, end_time: datetime, **params) -> str:
        """Build dataloader URL for data retrieval"""
        host = self.config.connection.get('host')
        port = self.config.connection.get('port', 80)
        
        # Base URL
        base_url = f"http://{host}:{port}/dataloader.cgi"
        
        # Endpoint mapping
        endpoint_map = {
            'people_counting': 'vcalogcsv',
            'regional_counting': 'regionalcountlogcsv',
            'heatmap': 'heatmapcsv',
            'space_heatmap': 'spaceheatmap'
        }
        
        dw_param = endpoint_map.get(endpoint_type, 'vcalogcsv')
        
        # Build parameters
        url_params = [f"dw={dw_param}"]
        
        # Add time parameters
        time_format = "%Y-%m-%d-%H:%M:%S"
        url_params.append(f"time_start={start_time.strftime(time_format)}")
        
        if endpoint_type in ['people_counting', 'heatmap']:
            url_params.append(f"time_end={end_time.strftime(time_format)}")
        
        # Add endpoint-specific parameters
        if endpoint_type == 'people_counting':
            # Handle both old and new parameter formats
            if 'type' in params:
                count_type = params.get('type', 0)  # 0=All, 1=In, 2=Out, 3=Capacity, 4=Sum
                url_params.append(f"type={count_type}")
            
            # Handle report_type, linetype, statistics_type format
            if 'report_type' in params:
                url_params.append(f"report_type={params['report_type']}")
            if 'linetype' in params:
                url_params.append(f"linetype={params['linetype']}")
            if 'statistics_type' in params:
                url_params.append(f"statistics_type={params['statistics_type']}")
        
        elif endpoint_type == 'regional_counting':
            report_type = params.get('report_type', 0)  # 0=Daily, 1=Weekly, 2=Monthly
            url_params.append(f"report_type={report_type}")
            
            # Length filtering
            length_type = params.get('lengthtype', 0)
            if length_type > 0:
                url_params.append(f"lengthtype={length_type}")
                url_params.append(f"length={params.get('length', 0)}")
            
            # Region selection
            for i in range(1, 5):
                region_enabled = params.get(f'region{i}', 1)
                url_params.append(f"region{i}={region_enabled}")
        
        elif endpoint_type == 'heatmap':
            sub_type = params.get('sub_type', 0)
            url_params.append(f"sub_type={sub_type}")
        
        return f"{base_url}?{'&'.join(url_params)}"
    
    def fetch_data(self, start_time: datetime, end_time: datetime, endpoint_type: str = 'people_counting') -> str:
        """Fetch data from Milesight camera"""
        # Get additional parameters from config
        endpoint_config = self.config.endpoints.get(endpoint_type, {})
        params = endpoint_config.get('params', {}) if isinstance(endpoint_config, dict) else {}
        
        url = self._build_dataloader_url(endpoint_type, start_time, end_time, **params)
        
        self.logger.debug(f"Fetching data from: {url}")
        
        try:
            response = self.session.get(url, timeout=self.config.timeout)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch data: {str(e)}")
            raise
    
    def get_real_time_status(self) -> Dict[str, Any]:
        """Get real-time people counting status"""
        if not self.supports_real_time_status:
            return {}
        
        try:
            url = self._build_cgi_url('get.vca.alarmstatus')
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Parse Milesight variable format
            data = self._parse_milesight_vars(response.text)
            
            return {
                'current_in_count': int(data.get('current_in_count', 0)),
                'current_out_count': int(data.get('current_out_count', 0)),
                'current_sum_count': int(data.get('current_sum_count', 0)),
                'current_capacity_count': int(data.get('current_capacity_count', 0)),
                'timestamp': datetime.now(),
                'sensor_name': self.config.name,
                'store': self.config.store
            }
        except Exception as e:
            self.logger.error(f"Failed to get real-time status: {str(e)}")
            return {}
    
    def _parse_milesight_vars(self, text: str) -> Dict[str, str]:
        """Parse Milesight variable format (var name='value';)"""
        variables = {}
        
        # Split by semicolon and process each variable
        for line in text.split(';'):
            if '=' in line and 'var ' in line:
                # Extract variable name and value
                var_part = line.split('var ')[1] if 'var ' in line else line
                if '=' in var_part:
                    name, value = var_part.split('=', 1)
                    name = name.strip()
                    value = value.strip().strip("'\"")
                    variables[name] = value
        
        return variables
    
    def parse_data(self, raw_data: str, endpoint_type: str = 'people_counting') -> List[Dict[str, Any]]:
        """Parse Milesight data based on endpoint type"""
        if not raw_data or raw_data.strip() == '':
            return []
        
        try:
            if endpoint_type == 'people_counting':
                return self._parse_people_counting_csv(raw_data)
            elif endpoint_type == 'regional_counting':
                return self._parse_regional_counting_csv(raw_data)
            elif endpoint_type == 'heatmap':
                return self._parse_heatmap_csv(raw_data)
            elif endpoint_type == 'space_heatmap':
                return self._parse_space_heatmap_json(raw_data)
            else:
                self.logger.warning(f"Unknown endpoint type: {endpoint_type}")
                return []
        except Exception as e:
            self.logger.error(f"Failed to parse {endpoint_type} data: {str(e)}")
            return []
    
    def _parse_people_counting_csv(self, csv_data: str) -> List[Dict[str, Any]]:
        """Parse Milesight people counting CSV data"""
        df = pd.read_csv(StringIO(csv_data))
        df.columns = [col.strip() for col in df.columns]
        
        data = []
        timestamp_format = self.config.data_mapping.get('timestamp_format', '%Y/%m/%d %H:%M:%S')
        
        for _, row in df.iterrows():
            record = {
                'sensor_name': self.config.name,
                'store': self.config.store,
                'data_type': 'people_counting',
                'timestamp': datetime.strptime(row.get('StartTime', ''), timestamp_format),
                'end_time': datetime.strptime(row.get('EndTime', ''), timestamp_format),
            }
            
            # Parse line data dynamically
            lines_in = []
            lines_out = []
            
            for i in range(1, self.line_count + 1):
                line_in = row.get(f'Line{i} - In', row.get(f'Line{i}-In', 0))
                line_out = row.get(f'Line{i} - Out', row.get(f'Line{i}-Out', 0))
                
                if pd.notna(line_in):
                    record[f'line{i}_in'] = int(line_in)
                    lines_in.append(int(line_in))
                
                if pd.notna(line_out):
                    record[f'line{i}_out'] = int(line_out)
                    lines_out.append(int(line_out))
            
            # Calculate totals
            record['total_in'] = sum(lines_in)
            record['total_out'] = sum(lines_out)
            record['net_count'] = record['total_in'] - record['total_out']
            
            # Add other fields
            for field in ['Capacity', 'Sum', 'Type']:
                if field in row and pd.notna(row[field]):
                    record[field.lower()] = row[field]
            
            data.append(record)
        
        return data
    
    def _parse_regional_counting_csv(self, csv_data: str) -> List[Dict[str, Any]]:
        """Parse regional people counting CSV data"""
        df = pd.read_csv(StringIO(csv_data))
        df.columns = [col.strip() for col in df.columns]
        
        data = []
        timestamp_format = self.config.data_mapping.get('timestamp_format', '%Y/%m/%d %H:%M:%S')
        
        for _, row in df.iterrows():
            record = {
                'sensor_name': self.config.name,
                'store': self.config.store,
                'data_type': 'regional_counting',
                'timestamp': datetime.strptime(row.get('StartTime', ''), timestamp_format),
                'end_time': datetime.strptime(row.get('EndTime', ''), timestamp_format),
            }
            
            # Parse regional data
            total_count = 0
            for i in range(1, self.region_count + 1):
                region_count = row.get(f'region{i}', row.get(f'Region{i}', 0))
                if pd.notna(region_count):
                    record[f'region{i}_count'] = int(region_count)
                    total_count += int(region_count)
            
            record['total_regional_count'] = total_count
            
            # Add sum if available
            if 'Sum' in row and pd.notna(row['Sum']):
                record['sum_count'] = int(row['Sum'])
            
            data.append(record)
        
        return data
    
    def _parse_heatmap_csv(self, csv_data: str) -> List[Dict[str, Any]]:
        """Parse heatmap CSV data"""
        df = pd.read_csv(StringIO(csv_data))
        df.columns = [col.strip() for col in df.columns]
        
        data = []
        timestamp_format = self.config.data_mapping.get('heatmap_timestamp_format', '%Y-%m-%d %H:%M:%S')
        
        for _, row in df.iterrows():
            record = {
                'sensor_name': self.config.name,
                'store': self.config.store,
                'data_type': 'heatmap',
                'timestamp': datetime.strptime(row.get('StartTime', ''), timestamp_format),
                'end_time': datetime.strptime(row.get('EndTime', ''), timestamp_format),
                'heat_value': int(row.get('Value(s)', row.get('Value', 0)))
            }
            data.append(record)
        
        return data
    
    def _parse_space_heatmap_json(self, json_data: str) -> List[Dict[str, Any]]:
        """Parse space heatmap JSON data"""
        try:
            data_obj = json.loads(json_data)
            
            return [{
                'sensor_name': self.config.name,
                'store': self.config.store,
                'data_type': 'space_heatmap',
                'timestamp': datetime.now(),
                'max_heat': data_obj.get('max', 0),
                'min_heat': data_obj.get('min', 0),
                'heat_points': data_obj.get('data', [])
            }]
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse space heatmap JSON: {str(e)}")
            return []
    
    def validate_connection(self) -> bool:
        """Test connection to Milesight camera"""
        try:
            # Test authentication
            if not self.authenticate():
                return False
            
            # Test data retrieval
            now = datetime.now()
            test_data = self.fetch_data(now - timedelta(minutes=5), now, 'people_counting')
            return len(test_data) >= 0  # Even empty data is valid
        except Exception as e:
            self.logger.error(f"Connection validation failed: {str(e)}")
            return False
    
    def get_camera_config(self) -> Dict[str, Any]:
        """Get current camera VCA configuration"""
        try:
            url = self._build_cgi_url('get.vca.count')
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            return self._parse_milesight_vars(response.text)
        except Exception as e:
            self.logger.error(f"Failed to get camera config: {str(e)}")
            return {}
    
    def set_camera_config(self, config_params: Dict[str, Any]) -> bool:
        """Set camera VCA configuration"""
        try:
            url = self._build_cgi_url('set.vca.count')
            
            # Convert config to URL parameters
            params = '&'.join([f"{k}={v}" for k, v in config_params.items()])
            full_url = f"{url}&{params}"
            
            response = self.session.get(full_url, timeout=10)
            response.raise_for_status()
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to set camera config: {str(e)}")
            return False