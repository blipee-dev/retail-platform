#!/usr/bin/env python3
"""
Monitor the complete data pipeline health
Shows real-time status of all data collection and processing stages
"""

import os
import sys
from datetime import datetime, timedelta
from supabase import create_client, Client
from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.panel import Panel
from rich.layout import Layout
from rich.align import Align
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

console = Console()

def get_pipeline_status(supabase: Client):
    """Get current status of all pipeline stages"""
    
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    today = now.date()
    
    status = {
        'timestamp': now.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'stages': {}
    }
    
    # 1. Check raw data collection
    try:
        result = supabase.table('people_counting_raw')\
            .select('*', count='exact')\
            .gte('timestamp', one_hour_ago.isoformat())\
            .execute()
        
        raw_count = result.count if hasattr(result, 'count') else len(result.data)
        status['stages']['raw_collection'] = {
            'status': '✅' if raw_count > 0 else '❌',
            'count': raw_count,
            'last_hour': True
        }
    except Exception as e:
        status['stages']['raw_collection'] = {
            'status': '❌',
            'error': str(e)
        }
    
    # 2. Check processed data
    try:
        result = supabase.table('people_counting_data')\
            .select('*', count='exact')\
            .gte('timestamp', one_hour_ago.isoformat())\
            .execute()
        
        processed_count = result.count if hasattr(result, 'count') else len(result.data)
        status['stages']['processed_data'] = {
            'status': '✅' if processed_count > 0 else '❌',
            'count': processed_count,
            'last_hour': True
        }
    except Exception as e:
        status['stages']['processed_data'] = {
            'status': '❌',
            'error': str(e)
        }
    
    # 3. Check hourly analytics
    try:
        result = supabase.table('hourly_analytics')\
            .select('*', count='exact')\
            .eq('date', today.isoformat())\
            .execute()
        
        hourly_count = result.count if hasattr(result, 'count') else len(result.data)
        current_hour = now.hour
        expected_hours = current_hour + 1  # Hours 0 through current
        
        status['stages']['hourly_analytics'] = {
            'status': '✅' if hourly_count >= expected_hours * 0.8 else '⚠️' if hourly_count > 0 else '❌',
            'count': hourly_count,
            'expected': expected_hours,
            'coverage': f"{(hourly_count / expected_hours * 100):.0f}%" if expected_hours > 0 else "0%"
        }
    except Exception as e:
        status['stages']['hourly_analytics'] = {
            'status': '❌',
            'error': str(e)
        }
    
    # 4. Check daily analytics
    try:
        result = supabase.table('daily_analytics')\
            .select('*', count='exact')\
            .eq('date', today.isoformat())\
            .execute()
        
        daily_count = result.count if hasattr(result, 'count') else len(result.data)
        status['stages']['daily_analytics'] = {
            'status': '✅' if daily_count > 0 else '⚠️',
            'count': daily_count,
            'date': today.isoformat()
        }
    except Exception as e:
        status['stages']['daily_analytics'] = {
            'status': '❌',
            'error': str(e)
        }
    
    # 5. Check regional data
    try:
        result = supabase.table('regional_analytics')\
            .select('*', count='exact')\
            .gte('timestamp', one_hour_ago.isoformat())\
            .execute()
        
        regional_count = result.count if hasattr(result, 'count') else len(result.data)
        status['stages']['regional_data'] = {
            'status': '✅' if regional_count > 0 else '⏳',
            'count': regional_count,
            'note': 'In development' if regional_count == 0 else 'Active'
        }
    except Exception as e:
        status['stages']['regional_data'] = {
            'status': '⏳',
            'note': 'Not yet implemented'
        }
    
    # 6. Check sensor health
    try:
        result = supabase.table('sensor_metadata')\
            .select('id, name, is_active')\
            .eq('is_active', True)\
            .execute()
        
        active_sensors = len(result.data)
        
        # Check which sensors have recent data
        sensors_with_data = set()
        for sensor in result.data:
            sensor_result = supabase.table('people_counting_raw')\
                .select('sensor_id')\
                .eq('sensor_id', sensor['id'])\
                .gte('timestamp', one_hour_ago.isoformat())\
                .limit(1)\
                .execute()
            
            if sensor_result.data:
                sensors_with_data.add(sensor['id'])
        
        status['stages']['sensor_health'] = {
            'status': '✅' if len(sensors_with_data) == active_sensors else '⚠️',
            'active_sensors': active_sensors,
            'reporting': len(sensors_with_data),
            'health': f"{(len(sensors_with_data) / active_sensors * 100):.0f}%" if active_sensors > 0 else "0%"
        }
    except Exception as e:
        status['stages']['sensor_health'] = {
            'status': '❌',
            'error': str(e)
        }
    
    return status

def create_dashboard(status):
    """Create a rich dashboard display"""
    
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main", size=20),
        Layout(name="footer", size=3)
    )
    
    # Header
    header = Panel(
        Align.center(f"[bold blue]Data Pipeline Monitor[/bold blue]\n{status['timestamp']}"),
        style="blue"
    )
    layout["header"].update(header)
    
    # Main content - Pipeline stages
    table = Table(title="Pipeline Stages", expand=True)
    table.add_column("Stage", style="cyan", no_wrap=True)
    table.add_column("Status", justify="center")
    table.add_column("Details", style="white")
    
    # Raw collection
    raw = status['stages'].get('raw_collection', {})
    details = f"{raw.get('count', 0)} records (last hour)" if 'count' in raw else raw.get('error', 'Unknown')
    table.add_row("Raw Data Collection", raw.get('status', '❓'), details)
    
    # Processed data
    processed = status['stages'].get('processed_data', {})
    details = f"{processed.get('count', 0)} records (last hour)" if 'count' in processed else processed.get('error', 'Unknown')
    table.add_row("Data Processing", processed.get('status', '❓'), details)
    
    # Hourly analytics
    hourly = status['stages'].get('hourly_analytics', {})
    details = f"{hourly.get('count', 0)}/{hourly.get('expected', 0)} hours ({hourly.get('coverage', '0%')})" if 'count' in hourly else hourly.get('error', 'Unknown')
    table.add_row("Hourly Analytics", hourly.get('status', '❓'), details)
    
    # Daily analytics
    daily = status['stages'].get('daily_analytics', {})
    details = f"{daily.get('count', 0)} records for {daily.get('date', 'today')}" if 'count' in daily else daily.get('error', 'Unknown')
    table.add_row("Daily Analytics", daily.get('status', '❓'), details)
    
    # Regional data
    regional = status['stages'].get('regional_data', {})
    details = regional.get('note', 'Unknown')
    if 'count' in regional and regional['count'] > 0:
        details = f"{regional['count']} records (last hour)"
    table.add_row("Regional Analytics", regional.get('status', '❓'), details)
    
    # Sensor health
    sensors = status['stages'].get('sensor_health', {})
    details = f"{sensors.get('reporting', 0)}/{sensors.get('active_sensors', 0)} sensors ({sensors.get('health', '0%')})" if 'active_sensors' in sensors else sensors.get('error', 'Unknown')
    table.add_row("Sensor Health", sensors.get('status', '❓'), details)
    
    layout["main"].update(Panel(table, title="Real-time Status", border_style="green"))
    
    # Footer
    footer_text = "[dim]Press Ctrl+C to exit • Updates every 30 seconds[/dim]"
    footer = Panel(Align.center(footer_text), style="dim")
    layout["footer"].update(footer)
    
    return layout

def main():
    """Main monitoring loop"""
    
    # Initialize Supabase client - try different env var names
    url = os.environ.get("SUPABASE_URL") or os.environ.get("BLIPEE_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("BLIPEE_SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        console.print("[red]❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY[/red]")
        sys.exit(1)
    
    supabase: Client = create_client(url, key)
    
    console.print("[bold green]🚀 Starting Data Pipeline Monitor...[/bold green]")
    console.print("[dim]Connecting to Supabase...[/dim]\n")
    
    try:
        with Live(create_dashboard({'timestamp': 'Initializing...', 'stages': {}}), refresh_per_second=1) as live:
            while True:
                try:
                    status = get_pipeline_status(supabase)
                    live.update(create_dashboard(status))
                    time.sleep(30)  # Update every 30 seconds
                except KeyboardInterrupt:
                    raise
                except Exception as e:
                    console.print(f"[red]Error updating status: {e}[/red]")
                    time.sleep(5)
                    
    except KeyboardInterrupt:
        console.print("\n[yellow]Monitor stopped by user[/yellow]")
        sys.exit(0)

if __name__ == "__main__":
    main()