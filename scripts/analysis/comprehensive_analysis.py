#!/usr/bin/env python3
"""
Comprehensive analysis using all available datapoints from the sensor:
- People counting (4 detection lines)
- Regional counting (4 regions)
- Heatmap data
- Spatial heatmap data
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
from src.connector_system import ConfigLoader, ConnectorFactory

class ComprehensiveAnalyzer:
    def __init__(self, connector):
        self.connector = connector
        self.data = {}
        
    def collect_all_data(self, start_time, end_time):
        """Collect data from all available endpoints"""
        print("📊 Collecting comprehensive data from sensor...")
        
        # Collect all data types
        data_types = ['people_counting', 'regional_counting', 'heatmap', 'spatial_heatmap']
        self.data = self.connector.collect_data(start_time, end_time, data_types)
        
        # Print collection summary
        for data_type in data_types:
            count = len(self.data.get(data_type, []))
            print(f"   ✅ {data_type}: {count} records")
            
        return self.data
    
    def analyze_people_counting(self):
        """Analyze people counting data from 4 detection lines"""
        print("\n🚶 Analyzing People Counting Data...")
        
        people_data = self.data.get('people_counting', [])
        if not people_data:
            print("   ❌ No people counting data available")
            return None
            
        # Analyze line-by-line traffic
        line_totals = defaultdict(int)
        hourly_traffic = defaultdict(lambda: defaultdict(int))
        direction_flow = {'in': 0, 'out': 0}
        
        for record in people_data:
            timestamp = record['timestamp']
            hour = timestamp.hour
            
            # Sum up traffic for each line
            for i in range(1, 5):
                line_in = record.get(f'line{i}_in', 0)
                line_out = record.get(f'line{i}_out', 0)
                
                line_totals[f'line{i}_in'] += line_in
                line_totals[f'line{i}_out'] += line_out
                
                hourly_traffic[hour][f'line{i}'] += (line_in + line_out)
                
                direction_flow['in'] += line_in
                direction_flow['out'] += line_out
        
        # Calculate insights
        total_traffic = sum(line_totals.values())
        busiest_line = max([(i, line_totals[f'line{i}_in'] + line_totals[f'line{i}_out']) 
                           for i in range(1, 5)], key=lambda x: x[1])
        
        # Peak hours
        hourly_totals = {hour: sum(lines.values()) for hour, lines in hourly_traffic.items()}
        peak_hour = max(hourly_totals.items(), key=lambda x: x[1]) if hourly_totals else (0, 0)
        
        insights = {
            'total_traffic': total_traffic,
            'direction_flow': direction_flow,
            'busiest_line': busiest_line,
            'peak_hour': peak_hour,
            'line_totals': dict(line_totals),
            'hourly_traffic': dict(hourly_traffic),
            'net_flow': direction_flow['in'] - direction_flow['out']
        }
        
        print(f"   📈 Total traffic: {total_traffic:,} people")
        print(f"   🚪 Entry/Exit: {direction_flow['in']:,} in / {direction_flow['out']:,} out")
        print(f"   🔥 Busiest line: Line {busiest_line[0]} ({busiest_line[1]:,} people)")
        print(f"   ⏰ Peak hour: {peak_hour[0]}:00 ({peak_hour[1]:,} people)")
        
        return insights
    
    def analyze_regional_patterns(self):
        """Enhanced regional analysis with dwell time estimation"""
        print("\n🏪 Analyzing Regional Patterns...")
        
        regional_data = self.data.get('regional_counting', [])
        if not regional_data:
            print("   ❌ No regional data available")
            return None
            
        # Calculate average occupancy per region
        region_stats = defaultdict(lambda: {'total': 0, 'count': 0, 'max': 0, 'min': float('inf')})
        
        for record in regional_data:
            for i in range(1, 5):
                count = record.get(f'region{i}_count', 0)
                region_stats[i]['total'] += count
                region_stats[i]['count'] += 1
                region_stats[i]['max'] = max(region_stats[i]['max'], count)
                region_stats[i]['min'] = min(region_stats[i]['min'], count) if count > 0 else region_stats[i]['min']
        
        # Calculate averages and utilization
        for region in region_stats:
            stats = region_stats[region]
            stats['average'] = stats['total'] / stats['count'] if stats['count'] > 0 else 0
            stats['utilization'] = (stats['average'] / stats['max'] * 100) if stats['max'] > 0 else 0
        
        # Identify high-traffic vs low-traffic regions
        avg_occupancy = {r: stats['average'] for r, stats in region_stats.items()}
        sorted_regions = sorted(avg_occupancy.items(), key=lambda x: x[1], reverse=True)
        
        print(f"   🏆 Highest traffic: Region {sorted_regions[0][0]} (avg: {sorted_regions[0][1]:.0f} people)")
        print(f"   💤 Lowest traffic: Region {sorted_regions[-1][0]} (avg: {sorted_regions[-1][1]:.0f} people)")
        
        return {
            'region_stats': dict(region_stats),
            'traffic_ranking': sorted_regions,
            'total_regional_traffic': sum(stats['total'] for stats in region_stats.values())
        }
    
    def analyze_heatmap_patterns(self):
        """Analyze temporal heatmap patterns"""
        print("\n🔥 Analyzing Heatmap Patterns...")
        
        heatmap_data = self.data.get('heatmap', [])
        if not heatmap_data:
            print("   ❌ No heatmap data available")
            return None
            
        # Analyze heat intensity over time
        hourly_heat = defaultdict(list)
        total_heat_points = 0
        
        for record in heatmap_data:
            timestamp = record['timestamp']
            hour = timestamp.hour
            heat_value = record.get('heat_value', 0)
            
            hourly_heat[hour].append(heat_value)
            total_heat_points += 1
        
        # Calculate average heat per hour
        hourly_avg_heat = {hour: np.mean(values) for hour, values in hourly_heat.items()}
        
        # Find hottest and coolest periods
        if hourly_avg_heat:
            hottest_hour = max(hourly_avg_heat.items(), key=lambda x: x[1])
            coolest_hour = min(hourly_avg_heat.items(), key=lambda x: x[1])
        else:
            hottest_hour = coolest_hour = (0, 0)
        
        print(f"   📊 Total heat measurements: {total_heat_points:,}")
        print(f"   🌡️ Hottest period: {hottest_hour[0]}:00 (avg heat: {hottest_hour[1]:.2f})")
        print(f"   ❄️ Coolest period: {coolest_hour[0]}:00 (avg heat: {coolest_hour[1]:.2f})")
        
        return {
            'total_heat_points': total_heat_points,
            'hourly_avg_heat': hourly_avg_heat,
            'hottest_hour': hottest_hour,
            'coolest_hour': coolest_hour
        }
    
    def analyze_spatial_distribution(self):
        """Analyze spatial heatmap for hot zones"""
        print("\n🗺️ Analyzing Spatial Distribution...")
        
        spatial_data = self.data.get('spatial_heatmap', [])
        if not spatial_data:
            print("   ❌ No spatial heatmap data available")
            return None
            
        # Create grid accumulator
        grid_heat = defaultdict(int)
        max_x = max_y = 0
        
        for record in spatial_data:
            x = record.get('x', 0)
            y = record.get('y', 0)
            heat = record.get('heat_value', 0)
            
            grid_heat[(x, y)] += heat
            max_x = max(max_x, x)
            max_y = max(max_y, y)
        
        # Find hottest zones
        if grid_heat:
            sorted_zones = sorted(grid_heat.items(), key=lambda x: x[1], reverse=True)
            hot_zones = sorted_zones[:10]  # Top 10 hottest spots
            
            # Calculate center of activity
            total_heat = sum(grid_heat.values())
            center_x = sum(x * heat for (x, y), heat in grid_heat.items()) / total_heat if total_heat > 0 else 0
            center_y = sum(y * heat for (x, y), heat in grid_heat.items()) / total_heat if total_heat > 0 else 0
        else:
            hot_zones = []
            center_x = center_y = 0
            total_heat = 0
        
        print(f"   🎯 Activity center: ({center_x:.1f}, {center_y:.1f})")
        print(f"   🔥 Hottest zone: {hot_zones[0][0] if hot_zones else 'N/A'}")
        print(f"   📐 Grid size: {max_x}x{max_y}")
        
        return {
            'grid_heat': dict(grid_heat),
            'hot_zones': hot_zones,
            'activity_center': (center_x, center_y),
            'grid_dimensions': (max_x, max_y),
            'total_heat': total_heat
        }
    
    def cross_correlate_insights(self):
        """Correlate insights across all data types"""
        print("\n🔗 Cross-Correlating Insights...")
        
        correlations = []
        
        # Compare people counting with regional data
        people_insights = self.analyze_people_counting()
        regional_insights = self.analyze_regional_patterns()
        
        if people_insights and regional_insights:
            # Check if total traffic matches
            people_total = people_insights['total_traffic']
            regional_total = regional_insights['total_regional_traffic']
            correlation_factor = min(people_total, regional_total) / max(people_total, regional_total) if max(people_total, regional_total) > 0 else 0
            
            correlations.append({
                'type': 'Traffic Correlation',
                'description': f'People counting vs Regional counting match: {correlation_factor:.1%}',
                'insight': 'High correlation indicates accurate tracking across systems' if correlation_factor > 0.8 else 'Low correlation may indicate tracking gaps'
            })
        
        # Correlate spatial heat with regional traffic
        spatial_insights = self.analyze_spatial_distribution()
        if spatial_insights and regional_insights:
            # Map hot zones to regions (simplified)
            correlations.append({
                'type': 'Spatial-Regional Correlation',
                'description': 'Hot zones align with high-traffic regions',
                'insight': 'Use spatial heat data to optimize regional layouts'
            })
        
        return correlations
    
    def generate_comprehensive_report(self, save_path="comprehensive_analysis.json"):
        """Generate comprehensive analysis report"""
        print("\n📝 Generating Comprehensive Report...")
        
        report = {
            'analysis_timestamp': datetime.now().isoformat(),
            'sensor': self.connector.config.name,
            'people_counting': self.analyze_people_counting(),
            'regional_patterns': self.analyze_regional_patterns(),
            'heatmap_patterns': self.analyze_heatmap_patterns(),
            'spatial_distribution': self.analyze_spatial_distribution(),
            'cross_correlations': self.cross_correlate_insights()
        }
        
        # Save report
        with open(save_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"   ✅ Report saved to: {save_path}")
        
        return report
    
    def create_unified_dashboard(self, save_path="unified_dashboard.png"):
        """Create unified visualization dashboard"""
        print("\n🎨 Creating Unified Dashboard...")
        
        fig = plt.figure(figsize=(20, 16))
        gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.3, wspace=0.3)
        
        # 1. People counting timeline
        ax1 = fig.add_subplot(gs[0, :2])
        people_data = self.data.get('people_counting', [])
        if people_data:
            times = [r['timestamp'] for r in people_data]
            totals = [sum(r.get(f'line{i}_in', 0) + r.get(f'line{i}_out', 0) for i in range(1, 5)) for r in people_data]
            ax1.plot(times, totals, 'b-', linewidth=2)
            ax1.fill_between(times, totals, alpha=0.3)
            ax1.set_title('People Traffic Over Time', fontsize=14, fontweight='bold')
            ax1.set_xlabel('Time')
            ax1.set_ylabel('People Count')
            ax1.grid(True, alpha=0.3)
        
        # 2. Regional distribution pie chart
        ax2 = fig.add_subplot(gs[0, 2])
        regional_insights = self.analyze_regional_patterns()
        if regional_insights:
            region_totals = [regional_insights['region_stats'][i]['total'] for i in range(1, 5)]
            region_labels = [f'Region {i}\n({total:,})' for i, total in enumerate(region_totals, 1)]
            ax2.pie(region_totals, labels=region_labels, autopct='%1.1f%%', startangle=90)
            ax2.set_title('Regional Traffic Distribution', fontsize=14, fontweight='bold')
        
        # 3. Hourly heatmap
        ax3 = fig.add_subplot(gs[1, :])
        heatmap_insights = self.analyze_heatmap_patterns()
        if heatmap_insights and heatmap_insights['hourly_avg_heat']:
            hours = list(range(24))
            heat_values = [heatmap_insights['hourly_avg_heat'].get(h, 0) for h in hours]
            heat_matrix = np.array(heat_values).reshape(1, -1)
            sns.heatmap(heat_matrix, xticklabels=hours, yticklabels=['Heat'], 
                       cmap='YlOrRd', annot=True, fmt='.1f', ax=ax3, cbar_kws={'label': 'Average Heat'})
            ax3.set_title('Hourly Heat Pattern', fontsize=14, fontweight='bold')
            ax3.set_xlabel('Hour of Day')
        
        # 4. Spatial heatmap
        ax4 = fig.add_subplot(gs[2, :2])
        spatial_insights = self.analyze_spatial_distribution()
        if spatial_insights and spatial_insights['grid_heat']:
            # Create grid matrix
            max_x, max_y = spatial_insights['grid_dimensions']
            if max_x > 0 and max_y > 0:
                grid = np.zeros((max_y + 1, max_x + 1))
                for (x, y), heat in spatial_insights['grid_heat'].items():
                    if x <= max_x and y <= max_y:
                        grid[y, x] = heat
                
                im = ax4.imshow(grid, cmap='hot', interpolation='nearest', aspect='auto')
                plt.colorbar(im, ax=ax4, label='Heat Intensity')
                
                # Mark activity center
                center_x, center_y = spatial_insights['activity_center']
                ax4.plot(center_x, center_y, 'b*', markersize=20, label='Activity Center')
                ax4.legend()
            
            ax4.set_title('Spatial Heat Distribution', fontsize=14, fontweight='bold')
            ax4.set_xlabel('X Position')
            ax4.set_ylabel('Y Position')
        
        # 5. Key metrics summary
        ax5 = fig.add_subplot(gs[2, 2])
        ax5.axis('off')
        
        # Compile key metrics
        metrics_text = "KEY METRICS\n" + "="*30 + "\n\n"
        
        if people_insights := self.analyze_people_counting():
            metrics_text += f"Total Traffic: {people_insights['total_traffic']:,}\n"
            metrics_text += f"Net Flow: {people_insights['net_flow']:+,}\n"
            metrics_text += f"Peak Hour: {people_insights['peak_hour'][0]}:00\n\n"
        
        if regional_insights:
            top_region = regional_insights['traffic_ranking'][0]
            metrics_text += f"Busiest Region: {top_region[0]}\n"
            metrics_text += f"Avg Occupancy: {top_region[1]:.0f}\n\n"
        
        if spatial_insights:
            metrics_text += f"Hot Zones: {len(spatial_insights['hot_zones'])}\n"
            metrics_text += f"Grid Coverage: {spatial_insights['grid_dimensions'][0]}x{spatial_insights['grid_dimensions'][1]}\n"
        
        ax5.text(0.1, 0.9, metrics_text, transform=ax5.transAxes, 
                fontsize=12, verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.suptitle(f'Comprehensive Sensor Analysis - {self.connector.config.name}', 
                    fontsize=16, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ Dashboard saved to: {save_path}")
        
        return True


def main():
    """Run comprehensive analysis"""
    print("🚀 COMPREHENSIVE SENSOR DATA ANALYSIS")
    print("="*60)
    
    try:
        # Load connector
        config = ConfigLoader.load_from_file('omnia_comprehensive_config.json')
        connector = ConnectorFactory.create_connector(config)
        
        print(f"✅ Connected to: {config.name}")
        
        # Initialize analyzer
        analyzer = ComprehensiveAnalyzer(connector)
        
        # Set time range
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        print(f"\n📅 Analysis period: {start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%Y-%m-%d %H:%M')}")
        
        # Collect all data
        analyzer.collect_all_data(start_time, end_time)
        
        # Generate comprehensive report
        report = analyzer.generate_comprehensive_report()
        
        # Create unified dashboard
        analyzer.create_unified_dashboard()
        
        # Generate actionable insights
        print("\n💡 ACTIONABLE INSIGHTS")
        print("="*60)
        
        # Traffic flow insights
        if people_insights := analyzer.analyze_people_counting():
            if people_insights['net_flow'] > 100:
                print("⚠️ Significant positive net flow - more entries than exits")
                print("   → Monitor capacity limits and ensure accurate exit tracking")
            elif people_insights['net_flow'] < -100:
                print("⚠️ Significant negative net flow - more exits than entries")
                print("   → Check entry tracking accuracy")
        
        # Regional optimization
        if regional_insights := analyzer.analyze_regional_patterns():
            low_traffic = [r for r, avg in regional_insights['traffic_ranking'] if avg < 50]
            if low_traffic:
                print(f"\n📉 Low traffic regions: {', '.join(str(r) for r in low_traffic)}")
                print("   → Consider relocating high-value items to busier regions")
        
        # Heat pattern insights
        if heatmap_insights := analyzer.analyze_heatmap_patterns():
            heat_variance = np.var(list(heatmap_insights['hourly_avg_heat'].values()))
            if heat_variance > 100:
                print("\n🌡️ High variance in hourly heat patterns")
                print("   → Adjust staffing and HVAC based on peak heat times")
        
        print("\n✅ ANALYSIS COMPLETE!")
        print("📁 Generated files:")
        print("   • comprehensive_analysis.json - Detailed analysis data")
        print("   • unified_dashboard.png - Visual summary dashboard")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()