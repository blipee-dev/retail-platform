from typing import Type, Dict
from .base_connector import BaseConnector, ConnectorConfig
from .people_counting_connector import PeopleCountingConnector
from .milesight_connector import MilesightConnector

class ConnectorFactory:
    """Factory for creating connector instances based on type"""
    
    # Registry of available connector types
    _connectors: Dict[str, Type[BaseConnector]] = {
        'people_counting_camera': PeopleCountingConnector,
        'people_counting': PeopleCountingConnector,  # Alias
        'milesight': MilesightConnector,
        'milesight_camera': MilesightConnector,  # Alias
    }
    
    @classmethod
    def register_connector(cls, connector_type: str, connector_class: Type[BaseConnector]):
        """Register a new connector type"""
        cls._connectors[connector_type] = connector_class
    
    @classmethod
    def create_connector(cls, config: ConnectorConfig) -> BaseConnector:
        """Create a connector instance based on configuration"""
        connector_type = config.type
        
        if connector_type not in cls._connectors:
            raise ValueError(f"Unknown connector type: {connector_type}. "
                           f"Available types: {list(cls._connectors.keys())}")
        
        connector_class = cls._connectors[connector_type]
        return connector_class(config)
    
    @classmethod
    def get_available_types(cls) -> list:
        """Get list of available connector types"""
        return list(cls._connectors.keys())