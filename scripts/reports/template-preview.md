# Daily Report Email Template Preview

## Layout Structure

```
┌─────────────────────────────────────────┐
│         DAILY TRAFFIC REPORT            │
│        Thursday, July 25, 2024          │
└─────────────────────────────────────────┘

## Executive Summary

┌─────────────────┐  ┌─────────────────┐
│ Total Visitors  │  │   Peak Hour     │
│    1,245        │  │   3:00 PM       │
│  ▲ 12.3%        │  │  156 visitors   │
└─────────────────┘  └─────────────────┘

  Capture Rate      Avg Hourly      Busiest Period
     68.5%             78             2-5 PM
─────────────────────────────────────────────────

## Hourly Traffic Pattern

[Bar Chart showing 24 hours]
█████████████████████████████████████████
█                                       █
█         ████                          █
█       ████████                        █
█     ██████████████                    █
█   ████████████████████                █
█ ██████████████████████████            █
█████████████████████████████████████████
 0h    6h    12h    18h    24h

Key Insights:
• Morning traffic (312 visitors) - 15% above average
• Afternoon traffic (623 visitors) - 8% above average  
• Evening traffic (310 visitors) - 5% below average

─────────────────────────────────────────────────
      Generated for OML01 - Omnia Guimarães
           [View Full Dashboard]
```

## Design Features

1. **Header Section**
   - Dark blue background (#2c3e50)
   - White text for contrast
   - Date prominently displayed

2. **Executive Summary**
   - Two main metric cards side-by-side
   - Large numbers for easy reading
   - Color-coded change indicators (green for up, red for down)
   - Three secondary metrics below

3. **Traffic Analysis**
   - Simplified bar chart using HTML divs
   - Color-coded bars (blue/orange/red for different traffic levels)
   - Hour labels every 3 hours
   - Bullet point insights with comparisons

4. **Footer**
   - Light gray background
   - Store name and dashboard link

## Color Scheme
- Primary: #2c3e50 (dark blue)
- Success: #27ae60 (green)
- Warning: #f39c12 (orange)
- Danger: #e74c3c (red)
- Info: #3498db (light blue)
- Background: #f8f9fa (light gray)
- Text: #2c3e50 (dark) / #7f8c8d (muted)