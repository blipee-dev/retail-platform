#!/usr/bin/env python3
"""
Analyze customer pathways and movement patterns between regions
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import networkx as nx
from src.connector_system import ConfigLoader, ConnectorFactory
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Circle
import matplotlib.lines as mlines

def analyze_regional_transitions(regional_data):
    """Analyze transitions between regions based on temporal data"""
    print("🔍 Analyzing regional transitions...")
    
    if not regional_data:
        return None
    
    # Sort by timestamp
    sorted_data = sorted(regional_data, key=lambda x: x['timestamp'])
    
    # Track transitions
    transitions = defaultdict(int)
    region_sequences = []
    
    # Analyze hour-by-hour changes
    for i in range(1, len(sorted_data)):
        prev_record = sorted_data[i-1]
        curr_record = sorted_data[i]
        
        # Get region counts for each timestamp
        prev_regions = {}
        curr_regions = {}
        
        for region_num in range(1, 5):
            prev_regions[f'region{region_num}'] = prev_record.get(f'region{region_num}_count', 0)
            curr_regions[f'region{region_num}'] = curr_record.get(f'region{region_num}_count', 0)
        
        # Detect movements (simplified - based on count changes)
        for from_region in range(1, 5):
            for to_region in range(1, 5):
                if from_region != to_region:
                    from_key = f'region{from_region}'
                    to_key = f'region{to_region}'
                    
                    # If count decreased in from_region and increased in to_region
                    decrease = max(0, prev_regions[from_key] - curr_regions[from_key])
                    increase = max(0, curr_regions[to_key] - prev_regions[to_key])
                    
                    # Estimate transitions (simplified)
                    estimated_transitions = min(decrease, increase)
                    if estimated_transitions > 0:
                        transition_key = f"Region {from_region} → Region {to_region}"
                        transitions[transition_key] += estimated_transitions
        
        # Track region popularity over time
        region_sequences.append({
            'timestamp': curr_record['timestamp'],
            'region_counts': curr_regions,
            'total_activity': sum(curr_regions.values())
        })
    
    return transitions, region_sequences

def calculate_pathway_metrics(transitions):
    """Calculate metrics for pathways"""
    print("📊 Calculating pathway metrics...")
    
    # Most popular pathways
    sorted_pathways = sorted(transitions.items(), key=lambda x: x[1], reverse=True)
    
    # Calculate flow matrix
    flow_matrix = np.zeros((4, 4))
    for pathway, count in transitions.items():
        # Parse "Region X → Region Y"
        parts = pathway.split(' → ')
        if len(parts) == 2:
            from_region = int(parts[0].split()[-1]) - 1
            to_region = int(parts[1].split()[-1]) - 1
            flow_matrix[from_region, to_region] = count
    
    # Calculate metrics
    metrics = {
        'most_popular_pathways': sorted_pathways[:10],
        'flow_matrix': flow_matrix,
        'total_transitions': sum(transitions.values()),
        'unique_pathways': len(transitions)
    }
    
    # Region connectivity
    region_metrics = {}
    for region in range(1, 5):
        outgoing = sum(flow_matrix[region-1, :])
        incoming = sum(flow_matrix[:, region-1])
        region_metrics[f'Region {region}'] = {
            'outgoing_flow': outgoing,
            'incoming_flow': incoming,
            'net_flow': incoming - outgoing,
            'total_flow': incoming + outgoing
        }
    
    metrics['region_metrics'] = region_metrics
    
    return metrics

def visualize_customer_pathways(transitions, save_path="customer_pathways.png"):
    """Create visualization of customer pathways between regions"""
    print("🎨 Creating pathway visualization...")
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(20, 10))
    
    # Left plot: Store layout with regions and flow arrows
    ax1.set_xlim(0, 10)
    ax1.set_ylim(0, 10)
    ax1.set_aspect('equal')
    
    # Define region positions (example layout)
    region_positions = {
        1: (2, 8),   # Top-left (Entrance)
        2: (8, 8),   # Top-right (Premium section)
        3: (2, 2),   # Bottom-left (Checkout area)
        4: (8, 2)    # Bottom-right (Promotions)
    }
    
    region_labels = {
        1: "Entrance\n& Reception",
        2: "Premium\nProducts",
        3: "Checkout\n& Services",
        4: "Promotions\n& Deals"
    }
    
    # Draw regions
    for region, (x, y) in region_positions.items():
        # Create fancy box for region
        box = FancyBboxPatch((x-1.5, y-1.5), 3, 3,
                           boxstyle="round,pad=0.1",
                           facecolor=f'C{region-1}',
                           edgecolor='black',
                           linewidth=2,
                           alpha=0.7)
        ax1.add_patch(box)
        
        # Add region label
        ax1.text(x, y, region_labels[region], 
                ha='center', va='center', fontsize=12, 
                weight='bold', color='white',
                bbox=dict(boxstyle='round', facecolor='black', alpha=0.5))
    
    # Draw pathways with arrows
    max_transitions = max(transitions.values()) if transitions else 1
    
    for pathway, count in transitions.items():
        if count > 0:
            # Parse pathway
            parts = pathway.split(' → ')
            if len(parts) == 2:
                from_region = int(parts[0].split()[-1])
                to_region = int(parts[1].split()[-1])
                
                # Get positions
                x1, y1 = region_positions[from_region]
                x2, y2 = region_positions[to_region]
                
                # Calculate arrow properties
                width = (count / max_transitions) * 10  # Scale width by traffic
                alpha = 0.3 + (count / max_transitions) * 0.6
                
                # Draw curved arrow
                arrow = mpatches.FancyArrowPatch((x1, y1), (x2, y2),
                                               connectionstyle=f"arc3,rad=0.3",
                                               arrowstyle='-|>',
                                               mutation_scale=20,
                                               linewidth=width,
                                               alpha=alpha,
                                               color='darkblue')
                ax1.add_patch(arrow)
                
                # Add count label at midpoint
                mid_x = (x1 + x2) / 2
                mid_y = (y1 + y2) / 2
                ax1.text(mid_x, mid_y, str(count), 
                        ha='center', va='center',
                        bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.7),
                        fontsize=10)
    
    ax1.set_title('Customer Movement Pathways\n(Arrow width indicates traffic volume)', 
                 fontsize=16, pad=20)
    ax1.axis('off')
    
    # Add legend
    legend_elements = []
    for region in range(1, 5):
        legend_elements.append(mpatches.Rectangle((0, 0), 1, 1, 
                                                 fc=f'C{region-1}', 
                                                 alpha=0.7,
                                                 label=region_labels[region].replace('\n', ' ')))
    ax1.legend(handles=legend_elements, loc='upper center', 
              bbox_to_anchor=(0.5, -0.05), ncol=2)
    
    # Right plot: Pathway frequency chart
    if transitions:
        sorted_pathways = sorted(transitions.items(), key=lambda x: x[1], reverse=True)[:10]
        pathways = [p[0] for p in sorted_pathways]
        counts = [p[1] for p in sorted_pathways]
        
        # Create horizontal bar chart
        y_pos = np.arange(len(pathways))
        ax2.barh(y_pos, counts, alpha=0.8, color='steelblue')
        ax2.set_yticks(y_pos)
        ax2.set_yticklabels(pathways)
        ax2.invert_yaxis()
        ax2.set_xlabel('Number of Transitions', fontsize=12)
        ax2.set_title('Top 10 Customer Pathways', fontsize=16, pad=20)
        ax2.grid(True, alpha=0.3)
        
        # Add value labels
        for i, (pathway, count) in enumerate(sorted_pathways):
            ax2.text(count + max(counts)*0.01, i, f'{count:,}', 
                    va='center', fontsize=10)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"   ✅ Pathway visualization saved to: {save_path}")
    
    return True

def create_flow_matrix_heatmap(flow_matrix, save_path="flow_matrix_heatmap.png"):
    """Create heatmap of flow matrix between regions"""
    print("🔥 Creating flow matrix heatmap...")
    
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Create heatmap
    region_names = ['Region 1\n(Entrance)', 'Region 2\n(Premium)', 
                   'Region 3\n(Checkout)', 'Region 4\n(Promotions)']
    
    # Create dataframe for better visualization
    df_flow = pd.DataFrame(flow_matrix, 
                          index=region_names,
                          columns=region_names)
    
    # Plot heatmap
    sns.heatmap(df_flow, annot=True, fmt='.0f', cmap='YlOrRd', 
                square=True, linewidths=0.5, cbar_kws={"shrink": 0.8})
    
    plt.title('Customer Flow Matrix Between Regions\n(From → To)', fontsize=16, pad=20)
    plt.xlabel('To Region', fontsize=12)
    plt.ylabel('From Region', fontsize=12)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"   ✅ Flow matrix heatmap saved to: {save_path}")
    
    return True

def analyze_time_based_pathways(region_sequences):
    """Analyze how pathways change over time"""
    print("⏰ Analyzing time-based pathway patterns...")
    
    # Group by hour
    hourly_patterns = defaultdict(lambda: defaultdict(int))
    
    for sequence in region_sequences:
        hour = sequence['timestamp'].hour
        
        # Find most active region at this time
        region_counts = sequence['region_counts']
        if region_counts:
            most_active = max(region_counts.items(), key=lambda x: x[1])
            hourly_patterns[hour][most_active[0]] += 1
    
    return hourly_patterns

def generate_pathway_insights(metrics, hourly_patterns):
    """Generate actionable insights from pathway analysis"""
    print("\n💡 PATHWAY INSIGHTS AND RECOMMENDATIONS")
    print("=" * 50)
    
    # Most popular pathways
    print("\n🔸 Top Customer Pathways:")
    for i, (pathway, count) in enumerate(metrics['most_popular_pathways'][:5], 1):
        print(f"   {i}. {pathway}: {count:,} transitions")
    
    # Region performance
    print("\n🔸 Region Traffic Analysis:")
    region_metrics = metrics['region_metrics']
    for region, data in region_metrics.items():
        print(f"\n   {region}:")
        print(f"      Incoming: {data['incoming_flow']:,.0f}")
        print(f"      Outgoing: {data['outgoing_flow']:,.0f}")
        print(f"      Net Flow: {data['net_flow']:+,.0f}")
        
        # Interpret the data
        if data['net_flow'] > 0:
            print(f"      → Accumulation point (people tend to stay)")
        elif data['net_flow'] < 0:
            print(f"      → Transit point (people pass through)")
        else:
            print(f"      → Balanced flow")
    
    # Time-based insights
    print("\n🔸 Peak Activity by Hour:")
    peak_hours = defaultdict(list)
    for hour, regions in hourly_patterns.items():
        if regions:
            most_active = max(regions.items(), key=lambda x: x[1])
            peak_hours[most_active[0]].append(hour)
    
    for region, hours in peak_hours.items():
        if hours:
            print(f"   {region}: Peak at {', '.join(f'{h}:00' for h in sorted(hours))}")
    
    # Business recommendations
    print("\n📈 BUSINESS RECOMMENDATIONS:")
    
    recommendations = []
    
    # Check for bottlenecks
    for pathway, count in metrics['most_popular_pathways'][:3]:
        if 'Region 3' in pathway and 'Region' in pathway:  # Checkout area
            recommendations.append(f"• High traffic to checkout ({count:,} transitions) - Consider adding express lanes")
    
    # Check for underutilized regions
    total_flow = sum(data['total_flow'] for data in region_metrics.values())
    for region, data in region_metrics.items():
        flow_percentage = (data['total_flow'] / total_flow * 100) if total_flow > 0 else 0
        if flow_percentage < 15:
            recommendations.append(f"• {region} has low traffic ({flow_percentage:.1f}%) - Consider repositioning key products")
    
    # Check for one-way flows
    flow_matrix = metrics['flow_matrix']
    for i in range(4):
        for j in range(4):
            if i != j and flow_matrix[i, j] > 0 and flow_matrix[j, i] == 0:
                recommendations.append(f"• One-way flow from Region {i+1} to {j+1} - Review signage and navigation")
    
    for rec in recommendations[:5]:  # Top 5 recommendations
        print(rec)
    
    return recommendations

def create_journey_map(transitions, save_path="customer_journey_map.png"):
    """Create a customer journey map visualization"""
    print("🗺️ Creating customer journey map...")
    
    # Create network graph
    G = nx.DiGraph()
    
    # Add nodes
    for i in range(1, 5):
        G.add_node(f"Region {i}")
    
    # Add edges with weights
    for pathway, count in transitions.items():
        parts = pathway.split(' → ')
        if len(parts) == 2 and count > 0:
            G.add_edge(parts[0], parts[1], weight=count)
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Define positions in a square layout
    pos = {
        "Region 1": (0, 1),
        "Region 2": (1, 1),
        "Region 3": (0, 0),
        "Region 4": (1, 0)
    }
    
    # Draw network
    nx.draw_networkx_nodes(G, pos, node_size=3000, node_color='lightblue', alpha=0.8)
    nx.draw_networkx_labels(G, pos, font_size=12, font_weight='bold')
    
    # Draw edges with varying thickness based on weight
    edges = G.edges()
    weights = [G[u][v]['weight'] for u, v in edges]
    max_weight = max(weights) if weights else 1
    
    for (u, v), weight in zip(edges, weights):
        width = (weight / max_weight) * 10
        nx.draw_networkx_edges(G, pos, [(u, v)], width=width, 
                              edge_color='darkblue', alpha=0.6,
                              connectionstyle="arc3,rad=0.1",
                              arrows=True, arrowsize=20)
    
    # Add edge labels
    edge_labels = nx.get_edge_attributes(G, 'weight')
    nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=10)
    
    plt.title('Customer Journey Network\n(Numbers indicate transition frequency)', 
             fontsize=16, pad=20)
    plt.axis('off')
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"   ✅ Journey map saved to: {save_path}")
    
    return True

def main():
    """Main analysis function"""
    print("🚀 CUSTOMER PATHWAY ANALYSIS")
    print("🏪 OML01-Omnia GuimarãesShopping")
    print("=" * 60)
    
    try:
        # Load connector
        config = ConfigLoader.load_from_file('omnia_comprehensive_config.json')
        connector = ConnectorFactory.create_connector(config)
        
        print(f"   ✅ Connected to: {config.name}")
        
        # Get regional counting data
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)  # Last 24 hours
        
        print(f"\n📊 Collecting regional data from {start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%Y-%m-%d %H:%M')}...")
        
        data = connector.collect_data(start_time, end_time, ['regional_counting'])
        
        if data['regional_counting']:
            regional_data = data['regional_counting']
            print(f"   ✅ Collected {len(regional_data)} regional records")
            
            # Analyze transitions
            transitions, region_sequences = analyze_regional_transitions(regional_data)
            
            if transitions:
                print(f"   ✅ Detected {len(transitions)} unique pathways")
                print(f"   ✅ Total transitions: {sum(transitions.values()):,}")
                
                # Calculate metrics
                metrics = calculate_pathway_metrics(transitions)
                
                # Analyze time-based patterns
                hourly_patterns = analyze_time_based_pathways(region_sequences)
                
                # Create visualizations
                visualize_customer_pathways(transitions)
                create_flow_matrix_heatmap(metrics['flow_matrix'])
                create_journey_map(transitions)
                
                # Generate insights
                insights = generate_pathway_insights(metrics, hourly_patterns)
                
                print(f"\n✅ ANALYSIS COMPLETE!")
                print(f"   📁 Generated files:")
                print(f"      • customer_pathways.png - Visual pathway map")
                print(f"      • flow_matrix_heatmap.png - Region-to-region flow matrix")
                print(f"      • customer_journey_map.png - Network journey visualization")
                
                # Save insights to file
                with open("pathway_insights.txt", "w") as f:
                    f.write("CUSTOMER PATHWAY ANALYSIS REPORT\n")
                    f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write("="*50 + "\n\n")
                    
                    f.write("TOP PATHWAYS:\n")
                    for pathway, count in metrics['most_popular_pathways'][:10]:
                        f.write(f"  {pathway}: {count:,}\n")
                    
                    f.write("\n\nREGION METRICS:\n")
                    for region, data in metrics['region_metrics'].items():
                        f.write(f"\n{region}:\n")
                        for key, value in data.items():
                            f.write(f"  {key}: {value:,.0f}\n")
                    
                    f.write("\n\nRECOMMENDATIONS:\n")
                    for rec in insights:
                        f.write(f"{rec}\n")
                
                print(f"      • pathway_insights.txt - Detailed analysis report")
                
            else:
                print("   ⚠️ No transitions detected in the data")
        else:
            print("   ❌ No regional data available")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    main()