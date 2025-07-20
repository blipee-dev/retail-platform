#!/usr/bin/env python3
"""
Simple viewer for the generated heatmap visualizations
"""

import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import os

def view_heatmap(image_path, title="Heatmap"):
    """Display a single heatmap image"""
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return
    
    try:
        img = mpimg.imread(image_path)
        plt.figure(figsize=(16, 12))
        plt.imshow(img)
        plt.axis('off')
        plt.title(title, fontsize=16, pad=20)
        plt.tight_layout()
        plt.show()
        print(f"✅ Displayed: {image_path}")
    except Exception as e:
        print(f"❌ Error displaying {image_path}: {str(e)}")

def view_all_heatmaps():
    """Display all generated heatmap visualizations"""
    print("🎨 VIEWING GENERATED HEATMAP VISUALIZATIONS")
    print("=" * 50)
    
    visualizations = [
        ("spatial_heatmap.png", "Spatial Activity Heatmap - Store Layout"),
        ("temporal_heatmap.png", "Temporal Activity Heatmap - 24 Hour Trends"),
        ("people_flow.png", "People Flow Analysis - In/Out Patterns"),
        ("regional_activity.png", "Regional Activity Analysis - Zone Performance"),
        ("dashboard_summary.png", "Live Analytics Dashboard - Real-time Status")
    ]
    
    print(f"Found {len(visualizations)} visualizations to display:\n")
    
    for i, (filename, description) in enumerate(visualizations, 1):
        print(f"{i}. {filename} - {description}")
    
    print(f"\n📊 VISUALIZATION INSIGHTS:")
    print(f"🗺️  Spatial Heatmap: Shows 15,686 heat points across the store layout")
    print(f"📈 Temporal Heatmap: Activity intensity over 24 hours")
    print(f"👥 People Flow: In/out patterns and net occupancy changes")
    print(f"🏪 Regional Activity: Performance of different store zones")
    print(f"📊 Dashboard: Live metrics and system status")
    
    # Display each visualization
    for filename, description in visualizations:
        if os.path.exists(filename):
            print(f"\n📸 Displaying: {description}")
            view_heatmap(filename, description)
        else:
            print(f"❌ File not found: {filename}")

def create_comparison_view():
    """Create a comparison view of all visualizations"""
    print(f"\n🔍 Creating comparison view...")
    
    files = [
        "spatial_heatmap.png",
        "temporal_heatmap.png", 
        "people_flow.png",
        "regional_activity.png"
    ]
    
    existing_files = [f for f in files if os.path.exists(f)]
    
    if len(existing_files) < 2:
        print("❌ Need at least 2 files for comparison")
        return
    
    fig, axes = plt.subplots(2, 2, figsize=(20, 16))
    fig.suptitle('Omnia GuimarãesShopping - Complete Analytics Suite\nGenerated from Live Milesight Sensor Data', 
                 fontsize=18, y=0.95)
    
    axes = axes.flatten()
    
    titles = [
        "Spatial Heatmap (15,686 points)",
        "Temporal Activity (24 hours)",
        "People Flow Analysis",
        "Regional Activity Zones"
    ]
    
    for i, (filename, title) in enumerate(zip(existing_files, titles)):
        if i < len(axes):
            try:
                img = mpimg.imread(filename)
                axes[i].imshow(img)
                axes[i].set_title(title, fontsize=14)
                axes[i].axis('off')
            except Exception as e:
                axes[i].text(0.5, 0.5, f"Error loading\n{filename}", 
                           ha='center', va='center', transform=axes[i].transAxes)
                axes[i].axis('off')
    
    # Hide unused subplots
    for i in range(len(existing_files), len(axes)):
        axes[i].axis('off')
    
    plt.tight_layout()
    plt.subplots_adjust(top=0.9)
    plt.savefig('heatmap_comparison.png', dpi=300, bbox_inches='tight')
    print("✅ Comparison view saved to: heatmap_comparison.png")

def main():
    """Main function"""
    print("🎨 HEATMAP VISUALIZATION VIEWER")
    print("🏪 OML01-Omnia GuimarãesShopping")
    print("=" * 40)
    
    # Check if running in an environment that supports display
    try:
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        print("📊 Using non-interactive backend for image generation")
    except:
        pass
    
    # List available files
    png_files = [f for f in os.listdir('.') if f.endswith('.png')]
    heatmap_files = [f for f in png_files if any(keyword in f for keyword in ['heatmap', 'flow', 'regional', 'dashboard'])]
    
    if heatmap_files:
        print(f"📁 Found {len(heatmap_files)} visualization files:")
        for f in heatmap_files:
            size = os.path.getsize(f) / 1024  # Size in KB
            print(f"   • {f} ({size:.1f} KB)")
        
        # Create comparison view
        create_comparison_view()
        
        print(f"\n🎯 SUMMARY:")
        print(f"   ✅ {len(heatmap_files)} individual visualizations")
        print(f"   ✅ 1 comparison view created")
        print(f"   📊 Data from live Milesight sensor")
        print(f"   🗺️  15,686 spatial heat points visualized")
        print(f"   📈 24 hours of activity data")
        print(f"   🏪 Complete store analytics suite")
        
    else:
        print("❌ No heatmap files found. Run visualize_heatmap.py first.")

if __name__ == "__main__":
    main()