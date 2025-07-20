from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ConnectorConfig:
    """Base configuration for all connectors"""
    name: str
    type: str
    store: str
    connection: Dict[str, Any]
    endpoints: Dict[str, str]
    data_mapping: Dict[str, Any]
    retry_attempts: int = 3
    timeout: int = 30
    polling_interval: int = 60

class BaseConnector(ABC):
    """Abstract base class for all sensor connectors"""
    
    def __init__(self, config: ConnectorConfig):
        self.config = config
        self.logger = logging.getLogger(f"{self.__class__.__name__}.{config.name}")
        self._validate_config()
    
    def _validate_config(self):
        """Validate the configuration has required fields"""
        required_fields = ['name', 'type', 'connection']
        for field in required_fields:
            if not hasattr(self.config, field):
                raise ValueError(f"Missing required configuration field: {field}")
    
    @abstractmethod
    def authenticate(self) -> Any:
        """Handle sensor-specific authentication"""
        pass
    
    @abstractmethod
    def fetch_data(self, start_time: datetime, end_time: datetime, endpoint_type: str = 'default') -> Any:
        """Fetch raw data from sensor"""
        pass
    
    @abstractmethod
    def parse_data(self, raw_data: Any, endpoint_type: str = 'default') -> List[Dict[str, Any]]:
        """Parse sensor-specific data format into standardized structure"""
        pass
    
    @abstractmethod
    def validate_connection(self) -> bool:
        """Test if the connection to the sensor is valid"""
        pass
    
    def collect_data(self, start_time: datetime, end_time: datetime, endpoint_types: Optional[List[str]] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Main method to collect data from all configured endpoints"""
        if endpoint_types is None:
            endpoint_types = list(self.config.endpoints.keys())
        
        results = {}
        
        for endpoint_type in endpoint_types:
            try:
                self.logger.info(f"Collecting {endpoint_type} data from {start_time} to {end_time}")
                
                # Fetch raw data
                raw_data = self.fetch_data(start_time, end_time, endpoint_type)
                
                # Parse data
                parsed_data = self.parse_data(raw_data, endpoint_type)
                
                results[endpoint_type] = parsed_data
                self.logger.info(f"Successfully collected {len(parsed_data)} {endpoint_type} records")
                
            except Exception as e:
                self.logger.error(f"Error collecting {endpoint_type} data: {str(e)}")
                results[endpoint_type] = []
        
        return results
    
    def get_status(self) -> Dict[str, Any]:
        """Get current connector status"""
        return {
            'name': self.config.name,
            'type': self.config.type,
            'store': self.config.store,
            'connection_valid': self.validate_connection(),
            'endpoints': list(self.config.endpoints.keys())
        }