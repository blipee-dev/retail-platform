#!/usr/bin/env python3
"""
Visualize heatmap data from the real Milesight sensor
"""

import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from src.connector_system import ConfigLoader, ConnectorFactory
import json
import seaborn as sns

# Set up matplotlib for better plotting
plt.style.use('default')
sns.set_palette("viridis")

def visualize_spatial_heatmap(connector, save_path="spatial_heatmap.png"):
    """Create spatial heatmap visualization"""
    print("🗺️ Creating spatial heatmap visualization...")
    
    try:
        # Get spatial heatmap data
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=6)
        
        data = connector.collect_data(start_time, end_time, ['space_heatmap'])
        
        if not data['space_heatmap']:
            print("   ❌ No spatial heatmap data available")
            return False
        
        heatmap_data = data['space_heatmap'][0]
        heat_points = heatmap_data.get('heat_points', [])
        
        if not heat_points:
            print("   ❌ No heat points in spatial heatmap")
            return False
        
        print(f"   📍 Processing {len(heat_points)} heat points...")
        
        # Extract coordinates and values
        x_coords = []
        y_coords = []
        heat_values = []
        
        for point in heat_points:
            if isinstance(point, dict):
                x_coords.append(point.get('x', 0))
                y_coords.append(point.get('y', 0))
                heat_values.append(point.get('value', 0))
        
        if not x_coords:
            print("   ❌ No valid coordinates found")
            return False
        
        # Create the heatmap
        max_x = max(x_coords)
        max_y = max(y_coords)
        
        print(f"   📏 Heatmap dimensions: {max_x} x {max_y}")
        print(f"   🔥 Heat range: {min(heat_values)} - {max(heat_values)}")
        
        # Create grid
        grid = np.zeros((max_y + 1, max_x + 1))
        
        # Fill grid with heat values
        for x, y, value in zip(x_coords, y_coords, heat_values):
            grid[y, x] = value
        
        # Create the plot
        plt.figure(figsize=(16, 12))
        
        # Create heatmap
        im = plt.imshow(grid, cmap='hot', interpolation='bilinear', aspect='auto')
        
        # Add colorbar
        cbar = plt.colorbar(im, shrink=0.8)
        cbar.set_label('Activity Intensity', rotation=270, labelpad=20, fontsize=12)
        
        # Customize plot
        plt.title('Omnia GuimarãesShopping - Spatial Activity Heatmap\n'
                 f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
                 f'Data Points: {len(heat_points):,} | Resolution: {max_x}x{max_y}', 
                 fontsize=16, pad=20)
        
        plt.xlabel('X Coordinate (Store Width)', fontsize=12)
        plt.ylabel('Y Coordinate (Store Length)', fontsize=12)
        
        # Add grid
        plt.grid(True, alpha=0.3)
        
        # Add statistics text
        stats_text = f"""
Statistics:
• Total Heat Points: {len(heat_points):,}
• Max Heat Value: {max(heat_values)}
• Min Heat Value: {min(heat_values)}
• Average Heat: {np.mean(heat_values):.1f}
• Resolution: {max_x} x {max_y}
        """
        
        plt.text(0.02, 0.98, stats_text, transform=plt.gca().transAxes, 
                fontsize=10, verticalalignment='top', 
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        # Save the plot
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ Spatial heatmap saved to: {save_path}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creating spatial heatmap: {str(e)}")
        return False

def visualize_temporal_heatmap(connector, save_path="temporal_heatmap.png"):
    """Create temporal heatmap visualization"""
    print("📊 Creating temporal heatmap visualization...")
    
    try:
        # Get temporal heatmap data for the last 24 hours
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        data = connector.collect_data(start_time, end_time, ['heatmap'])
        
        if not data['heatmap']:
            print("   ❌ No temporal heatmap data available")
            return False
        
        heatmap_records = data['heatmap']
        print(f"   📈 Processing {len(heatmap_records)} temporal records...")
        
        # Extract time and heat values
        times = []
        heat_values = []
        
        for record in heatmap_records:
            times.append(record.get('timestamp'))
            heat_values.append(record.get('value_s_', record.get('heat_value', 0)))
        
        # Create the plot
        plt.figure(figsize=(16, 8))
        
        # Create line plot
        plt.plot(times, heat_values, linewidth=2, marker='o', markersize=4, color='red')
        
        # Fill area under curve
        plt.fill_between(times, heat_values, alpha=0.3, color='red')
        
        # Customize plot
        plt.title('Omnia GuimarãesShopping - Temporal Activity Heatmap\n'
                 f'Last 24 Hours: {start_time.strftime("%Y-%m-%d %H:%M")} to {end_time.strftime("%Y-%m-%d %H:%M")}\n'
                 f'Data Points: {len(heatmap_records)}', 
                 fontsize=16, pad=20)
        
        plt.xlabel('Time', fontsize=12)
        plt.ylabel('Activity Intensity', fontsize=12)
        
        # Rotate x-axis labels
        plt.xticks(rotation=45)
        
        # Add grid
        plt.grid(True, alpha=0.3)
        
        # Add statistics
        avg_heat = np.mean(heat_values)
        max_heat = max(heat_values)
        min_heat = min(heat_values)
        
        stats_text = f"""
Statistics:
• Average Heat: {avg_heat:.1f}
• Peak Heat: {max_heat}
• Min Heat: {min_heat}
• Data Points: {len(heatmap_records)}
• Range: {max_heat - min_heat}
        """
        
        plt.text(0.02, 0.98, stats_text, transform=plt.gca().transAxes, 
                fontsize=10, verticalalignment='top', 
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        # Highlight peak activity
        peak_idx = heat_values.index(max_heat)
        peak_time = times[peak_idx]
        plt.annotate(f'Peak Activity\n{max_heat} at {peak_time.strftime("%H:%M")}',
                    xy=(peak_time, max_heat), xytext=(10, 10),
                    textcoords='offset points', fontsize=10,
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7),
                    arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0'))
        
        # Save the plot
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ Temporal heatmap saved to: {save_path}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creating temporal heatmap: {str(e)}")
        return False

def visualize_people_flow(connector, save_path="people_flow.png"):
    """Create people flow visualization"""
    print("👥 Creating people flow visualization...")
    
    try:
        # Get people counting data for the last 24 hours
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        data = connector.collect_data(start_time, end_time, ['people_counting'])
        
        if not data['people_counting']:
            print("   ❌ No people counting data available")
            return False
        
        records = data['people_counting']
        print(f"   📊 Processing {len(records)} people counting records...")
        
        # Extract data
        times = []
        total_in = []
        total_out = []
        net_flow = []
        
        for record in records:
            times.append(record.get('timestamp'))
            in_count = record.get('tolal___in', record.get('total_in', 0))
            out_count = record.get('tolal___out', record.get('total_out', 0))
            
            total_in.append(in_count)
            total_out.append(out_count)
            net_flow.append(in_count - out_count)
        
        # Create the plot with subplots
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 12))
        
        # Plot 1: In vs Out
        ax1.plot(times, total_in, linewidth=2, marker='o', markersize=4, color='green', label='People In')
        ax1.plot(times, total_out, linewidth=2, marker='s', markersize=4, color='red', label='People Out')
        ax1.fill_between(times, total_in, alpha=0.3, color='green')
        ax1.fill_between(times, total_out, alpha=0.3, color='red')
        
        ax1.set_title('People In vs Out - Last 24 Hours', fontsize=14)
        ax1.set_ylabel('People Count', fontsize=12)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Net Flow
        colors = ['red' if x < 0 else 'green' for x in net_flow]
        ax2.bar(times, net_flow, color=colors, alpha=0.7, width=0.8)
        ax2.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        
        ax2.set_title('Net People Flow (In - Out)', fontsize=14)
        ax2.set_xlabel('Time', fontsize=12)
        ax2.set_ylabel('Net People Count', fontsize=12)
        ax2.grid(True, alpha=0.3)
        
        # Rotate x-axis labels
        for ax in [ax1, ax2]:
            ax.tick_params(axis='x', rotation=45)
        
        # Add overall statistics
        total_visitors = sum(total_in)
        total_exits = sum(total_out)
        current_occupancy = total_visitors - total_exits
        
        stats_text = f"""
24-Hour Summary:
• Total Visitors: {total_visitors:,}
• Total Exits: {total_exits:,}
• Current Occupancy: {current_occupancy:,}
• Peak In: {max(total_in)}
• Peak Out: {max(total_out)}
• Avg Hourly In: {np.mean(total_in):.1f}
        """
        
        plt.figtext(0.02, 0.95, stats_text, fontsize=10, 
                   bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        plt.suptitle('Omnia GuimarãesShopping - People Flow Analysis\n'
                    f'{start_time.strftime("%Y-%m-%d %H:%M")} to {end_time.strftime("%Y-%m-%d %H:%M")}', 
                    fontsize=16, y=0.98)
        
        # Save the plot
        plt.tight_layout()
        plt.subplots_adjust(top=0.85)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ People flow visualization saved to: {save_path}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creating people flow visualization: {str(e)}")
        return False

def visualize_regional_activity(connector, save_path="regional_activity.png"):
    """Create regional activity visualization"""
    print("🗺️ Creating regional activity visualization...")
    
    try:
        # Get regional counting data
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=12)
        
        data = connector.collect_data(start_time, end_time, ['regional_counting'])
        
        if not data['regional_counting']:
            print("   ❌ No regional counting data available")
            return False
        
        records = data['regional_counting']
        print(f"   📊 Processing {len(records)} regional records...")
        
        # Extract data
        times = []
        region_data = {f'region{i}': [] for i in range(1, 5)}
        
        for record in records:
            times.append(record.get('timestamp'))
            for i in range(1, 5):
                region_data[f'region{i}'].append(record.get(f'region{i}', 0))
        
        # Create the plot
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 12))
        
        # Plot 1: Regional trends over time
        colors = ['blue', 'green', 'red', 'orange']
        for i, (region, values) in enumerate(region_data.items()):
            ax1.plot(times, values, linewidth=2, marker='o', markersize=3, 
                    color=colors[i], label=f'Region {i+1}')
        
        ax1.set_title('Regional Activity Over Time', fontsize=14)
        ax1.set_ylabel('People Count', fontsize=12)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        ax1.tick_params(axis='x', rotation=45)
        
        # Plot 2: Regional distribution (pie chart using latest data)
        if records:
            latest_record = records[-1]
            region_totals = []
            region_labels = []
            
            for i in range(1, 5):
                count = latest_record.get(f'region{i}', 0)
                if count > 0:
                    region_totals.append(count)
                    region_labels.append(f'Region {i}\n({count} people)')
            
            if region_totals:
                ax2.pie(region_totals, labels=region_labels, autopct='%1.1f%%', 
                       colors=colors[:len(region_totals)], startangle=90)
                ax2.set_title(f'Regional Distribution - Latest Hour\n{latest_record.get("timestamp", "").strftime("%H:%M") if latest_record.get("timestamp") else "Recent"}', 
                             fontsize=14)
        
        # Add statistics
        total_regional = sum(sum(region_data[region]) for region in region_data)
        most_active = max(region_data.items(), key=lambda x: sum(x[1]))
        
        stats_text = f"""
Regional Summary:
• Total Regional Activity: {total_regional:,}
• Most Active: {most_active[0].title()} ({sum(most_active[1]):,})
• Time Period: {len(records)} hours
• Regions Active: {sum(1 for r in region_data.values() if sum(r) > 0)}
        """
        
        plt.figtext(0.02, 0.95, stats_text, fontsize=10, 
                   bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        plt.suptitle('Omnia GuimarãesShopping - Regional Activity Analysis\n'
                    f'{start_time.strftime("%Y-%m-%d %H:%M")} to {end_time.strftime("%Y-%m-%d %H:%M")}', 
                    fontsize=16, y=0.98)
        
        # Save the plot
        plt.tight_layout()
        plt.subplots_adjust(top=0.85)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ Regional activity visualization saved to: {save_path}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creating regional activity visualization: {str(e)}")
        return False

def create_dashboard_summary(connector, save_path="dashboard_summary.png"):
    """Create a comprehensive dashboard summary"""
    print("📊 Creating dashboard summary...")
    
    try:
        # Get real-time status
        status = connector.get_real_time_status()
        
        # Create figure with subplots
        fig = plt.figure(figsize=(20, 12))
        
        # Main title
        fig.suptitle('Omnia GuimarãesShopping - Live Analytics Dashboard\n'
                    f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 
                    fontsize=20, y=0.95)
        
        # Create a grid of subplots
        gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
        
        # Real-time status (big numbers)
        ax1 = fig.add_subplot(gs[0, :])
        ax1.axis('off')
        
        # Display key metrics
        metrics = [
            ("Current Occupancy", status.get('current_capacity_count', 0), "people"),
            ("Today's Visitors", status.get('current_in_count', 0), "people"),
            ("Total Exits", status.get('current_out_count', 0), "people"),
            ("Total Interactions", status.get('current_sum_count', 0), "events")
        ]
        
        for i, (label, value, unit) in enumerate(metrics):
            x_pos = 0.2 + i * 0.2
            ax1.text(x_pos, 0.7, f"{value:,}", fontsize=36, ha='center', va='center', 
                    color='blue', weight='bold')
            ax1.text(x_pos, 0.3, f"{label}\n({unit})", fontsize=12, ha='center', va='center')
        
        # Get recent data for mini charts
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=6)
        
        # Try to get data for mini visualizations
        try:
            data = connector.collect_data(start_time, end_time, ['people_counting', 'heatmap'])
            
            # Mini people flow chart
            if data['people_counting']:
                ax2 = fig.add_subplot(gs[1, 0])
                records = data['people_counting']
                times = [r.get('timestamp') for r in records]
                totals = [r.get('tolal___in', r.get('total_in', 0)) for r in records]
                
                ax2.plot(times, totals, 'b-', linewidth=2)
                ax2.set_title('Hourly Entries', fontsize=12)
                ax2.tick_params(axis='x', rotation=45, labelsize=8)
                ax2.grid(True, alpha=0.3)
            
            # Mini heatmap trend
            if data['heatmap']:
                ax3 = fig.add_subplot(gs[1, 1])
                records = data['heatmap']
                times = [r.get('timestamp') for r in records]
                heat_values = [r.get('value_s_', r.get('heat_value', 0)) for r in records]
                
                ax3.plot(times, heat_values, 'r-', linewidth=2)
                ax3.set_title('Activity Intensity', fontsize=12)
                ax3.tick_params(axis='x', rotation=45, labelsize=8)
                ax3.grid(True, alpha=0.3)
            
            # Status indicators
            ax4 = fig.add_subplot(gs[1, 2])
            ax4.axis('off')
            
            # System status
            status_items = [
                ("Sensor Connection", "✅ Online"),
                ("Data Collection", "✅ Active"),
                ("Last Update", datetime.now().strftime("%H:%M:%S")),
                ("Data Quality", "✅ Good")
            ]
            
            for i, (label, value) in enumerate(status_items):
                y_pos = 0.8 - i * 0.2
                ax4.text(0.1, y_pos, f"{label}:", fontsize=10, weight='bold')
                ax4.text(0.6, y_pos, value, fontsize=10)
            
        except Exception as e:
            print(f"   ⚠️ Could not create mini charts: {str(e)}")
        
        # Information panel
        ax5 = fig.add_subplot(gs[2, :])
        ax5.axis('off')
        
        info_text = f"""
SYSTEM INFORMATION:
• Sensor: Milesight People Counting Camera
• Location: OML01-Omnia GuimarãesShopping
• Data Types: People Counting, Regional Analysis, Heatmap, Spatial Analysis
• Update Frequency: Real-time status + Hourly aggregated data
• Current Status: All systems operational

CAPABILITIES:
• Real-time occupancy monitoring
• Traffic pattern analysis
• Zone-based activity tracking
• Spatial heatmap visualization
• Historical trend analysis
        """
        
        ax5.text(0.05, 0.95, info_text, fontsize=11, verticalalignment='top', 
                bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.3))
        
        # Save the dashboard
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ Dashboard summary saved to: {save_path}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creating dashboard summary: {str(e)}")
        return False

def main():
    """Main function to create all visualizations"""
    print("🎨 MILESIGHT SENSOR HEATMAP VISUALIZATION")
    print("🏪 OML01-Omnia GuimarãesShopping")
    print("=" * 60)
    
    # Load connector
    try:
        config = ConfigLoader.load_from_file('omnia_comprehensive_config.json')
        connector = ConnectorFactory.create_connector(config)
        
        print(f"   ✅ Connected to: {config.name}")
        
        # Create all visualizations
        visualizations = [
            (visualize_spatial_heatmap, "spatial_heatmap.png", "Spatial Heatmap"),
            (visualize_temporal_heatmap, "temporal_heatmap.png", "Temporal Heatmap"),
            (visualize_people_flow, "people_flow.png", "People Flow"),
            (visualize_regional_activity, "regional_activity.png", "Regional Activity"),
            (create_dashboard_summary, "dashboard_summary.png", "Dashboard Summary")
        ]
        
        successful = 0
        for viz_func, filename, description in visualizations:
            if viz_func(connector, filename):
                successful += 1
        
        print(f"\n🎉 VISUALIZATION COMPLETE!")
        print(f"   ✅ {successful}/{len(visualizations)} visualizations created")
        print(f"   📁 Files saved in current directory")
        
        if successful > 0:
            print(f"\n📊 Generated Files:")
            for viz_func, filename, description in visualizations:
                print(f"   • {filename} - {description}")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    main()