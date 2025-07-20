import json
import yaml
from pathlib import Path
from typing import Dict, Any, Union
from .base_connector import ConnectorConfig

class ConfigLoader:
    """Load and validate connector configurations from files"""
    
    @staticmethod
    def load_from_file(file_path: Union[str, Path]) -> ConnectorConfig:
        """Load configuration from JSON or YAML file"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {file_path}")
        
        # Load based on file extension
        if file_path.suffix in ['.json']:
            with open(file_path, 'r') as f:
                config_dict = json.load(f)
        elif file_path.suffix in ['.yaml', '.yml']:
            with open(file_path, 'r') as f:
                config_dict = yaml.safe_load(f)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        return ConfigLoader.create_from_dict(config_dict)
    
    @staticmethod
    def create_from_dict(config_dict: Dict[str, Any]) -> ConnectorConfig:
        """Create ConnectorConfig from dictionary"""
        # Extract connector section if present
        if 'connector' in config_dict:
            config_dict = config_dict['connector']
        
        # Validate required fields
        required_fields = ['name', 'type', 'connection']
        for field in required_fields:
            if field not in config_dict:
                raise ValueError(f"Missing required field: {field}")
        
        # Create config with defaults
        return ConnectorConfig(
            name=config_dict['name'],
            type=config_dict['type'],
            store=config_dict.get('store', 'default'),
            connection=config_dict['connection'],
            endpoints=config_dict.get('endpoints', {}),
            data_mapping=config_dict.get('data_mapping', {}),
            retry_attempts=config_dict.get('retry_attempts', 3),
            timeout=config_dict.get('timeout', 30),
            polling_interval=config_dict.get('polling_interval', 60)
        )
    
    @staticmethod
    def validate_config(config: ConnectorConfig) -> bool:
        """Validate configuration completeness and correctness"""
        # Check connection details
        if 'host' not in config.connection:
            raise ValueError("Connection must include 'host'")
        
        # Check authentication if present
        if 'auth' in config.connection:
            auth = config.connection['auth']
            if auth.get('type') == 'basic':
                if 'username' not in auth or 'password' not in auth:
                    raise ValueError("Basic auth requires username and password")
        
        return True