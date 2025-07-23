/**
 * Dynamic Insight Generator for Daily Reports
 * Generates contextual insights based on store performance data
 */

interface DailyData {
  date: Date;
  totalVisitors: number;
  captureRate: number;
  passingTraffic: number;
  peakHour: number; // 0-23
  peakHourVisitors: number;
  hourlyVisitors: number[]; // 24 hours
  morningVisitors: number; // 9AM-12PM
  afternoonVisitors: number; // 12PM-6PM
  eveningVisitors: number; // 6PM-9PM
}

interface ComparisonData {
  lastMonthSameDay: DailyData;
  yesterdayLastWeek: DailyData;
  monthlyAverage: {
    visitors: number;
    captureRate: number;
    peakHour: number;
  };
}

interface Insight {
  type: 'opportunity' | 'success' | 'warning' | 'trend';
  title: string;
  description: string;
  priority: number; // 1-10, higher is more important
}

export class InsightGenerator {
  /**
   * Generate the most relevant insight for the daily report
   */
  static generatePrimaryInsight(data: DailyData, comparison: ComparisonData): Insight {
    const insights = this.generateAllInsights(data, comparison);
    
    // Sort by priority and return the most important one
    return insights.sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * Generate all possible insights and rank them
   */
  static generateAllInsights(data: DailyData, comparison: ComparisonData): Insight[] {
    const insights: Insight[] = [];

    // 1. Capture Rate Insights
    insights.push(...this.generateCaptureRateInsights(data, comparison));

    // 2. Traffic Pattern Insights
    insights.push(...this.generateTrafficPatternInsights(data, comparison));

    // 3. Performance Insights
    insights.push(...this.generatePerformanceInsights(data, comparison));

    // 4. Hourly Distribution Insights
    insights.push(...this.generateHourlyInsights(data, comparison));

    // 5. Day-specific Insights
    insights.push(...this.generateDaySpecificInsights(data, comparison));

    return insights;
  }

  /**
   * Capture Rate Related Insights
   */
  private static generateCaptureRateInsights(data: DailyData, comparison: ComparisonData): Insight[] {
    const insights: Insight[] = [];
    const captureRateChange = data.captureRate - comparison.lastMonthSameDay.captureRate;
    const avgCaptureRate = comparison.monthlyAverage.captureRate;

    // Morning vs Afternoon capture rate
    const morningCaptureRate = (data.morningVisitors / (data.passingTraffic * 0.3)) * 100;
    const afternoonCaptureRate = (data.afternoonVisitors / (data.passingTraffic * 0.5)) * 100;
    
    if (morningCaptureRate < afternoonCaptureRate * 0.6) {
      insights.push({
        type: 'opportunity',
        title: 'Morning capture opportunity',
        description: `Morning capture rate was only ${morningCaptureRate.toFixed(1)}% vs ${afternoonCaptureRate.toFixed(1)}% in the afternoon. Enhancing morning window displays and entrance visibility could capture ${Math.round((afternoonCaptureRate - morningCaptureRate) * data.passingTraffic * 0.3 / 100)} additional morning visitors.`,
        priority: 8
      });
    }

    // Exceptional capture rate performance
    if (data.captureRate > avgCaptureRate * 1.2) {
      insights.push({
        type: 'success',
        title: 'Excellent storefront performance',
        description: `Your ${data.captureRate.toFixed(1)}% capture rate is ${((data.captureRate / avgCaptureRate - 1) * 100).toFixed(0)}% above your monthly average. Yesterday's window displays or promotions were highly effective - document what worked for future use.`,
        priority: 7
      });
    }

    // Low capture rate warning
    if (data.captureRate < 15) {
      insights.push({
        type: 'warning',
        title: 'Below-average capture rate',
        description: `With only ${data.captureRate.toFixed(1)}% capture rate, you missed ${Math.round(data.passingTraffic * 0.85)} potential customers. Review storefront visibility, ensure entrance is clearly marked, and consider A-frame signage to attract passing traffic.`,
        priority: 9
      });
    }

    // Capture rate improvement
    if (captureRateChange > 3) {
      insights.push({
        type: 'success',
        title: 'Capture rate improvement',
        description: `Your capture rate improved by ${captureRateChange.toFixed(1)} percentage points compared to last month. This improvement brought in ${Math.round(captureRateChange * data.passingTraffic / 100)} additional visitors yesterday.`,
        priority: 6
      });
    }

    return insights;
  }

  /**
   * Traffic Pattern Insights
   */
  private static generateTrafficPatternInsights(data: DailyData, comparison: ComparisonData): Insight[] {
    const insights: Insight[] = [];

    // Peak hour shift
    if (Math.abs(data.peakHour - comparison.monthlyAverage.peakHour) >= 2) {
      const peakShift = data.peakHour - comparison.monthlyAverage.peakHour;
      const direction = peakShift > 0 ? 'later' : 'earlier';
      
      insights.push({
        type: 'trend',
        title: 'Peak hour shift detected',
        description: `Peak traffic moved ${Math.abs(peakShift)} hours ${direction} to ${this.formatHour(data.peakHour)}. Consider adjusting staff schedules and promotional timing to match this new pattern.`,
        priority: 7
      });
    }

    // Evening opportunity
    const eveningPotential = data.eveningVisitors < data.afternoonVisitors * 0.3;
    if (eveningPotential && data.passingTraffic > 1000) {
      insights.push({
        type: 'opportunity',
        title: 'Untapped evening potential',
        description: `Evening traffic (6-9 PM) was only ${data.eveningVisitors} visitors despite continued foot traffic. Consider evening promotions, better lighting, or happy hour offers to capture after-work shoppers.`,
        priority: 5
      });
    }

    return insights;
  }

  /**
   * Performance Insights
   */
  private static generatePerformanceInsights(data: DailyData, comparison: ComparisonData): Insight[] {
    const insights: Insight[] = [];
    const performanceVsAvg = (data.totalVisitors / comparison.monthlyAverage.visitors - 1) * 100;

    // Exceptional day
    if (performanceVsAvg > 20) {
      insights.push({
        type: 'success',
        title: 'Outstanding performance',
        description: `Yesterday's ${data.totalVisitors.toLocaleString()} visitors exceeded your monthly average by ${performanceVsAvg.toFixed(0)}%. Analyze and document what drove this success - was it a promotion, event, or external factor?`,
        priority: 8
      });
    }

    // Consistent growth
    const weekOverWeek = (data.totalVisitors / comparison.yesterdayLastWeek.totalVisitors - 1) * 100;
    if (weekOverWeek > 10 && performanceVsAvg > 10) {
      insights.push({
        type: 'success',
        title: 'Sustained growth momentum',
        description: `Traffic is up ${weekOverWeek.toFixed(0)}% vs last week and ${performanceVsAvg.toFixed(0)}% above monthly average. Your recent initiatives are working - maintain this momentum.`,
        priority: 6
      });
    }

    // Recovery from low performance
    if (comparison.yesterdayLastWeek.totalVisitors < comparison.monthlyAverage.visitors * 0.8 && 
        data.totalVisitors > comparison.monthlyAverage.visitors) {
      insights.push({
        type: 'success',
        title: 'Strong recovery',
        description: `Excellent bounce-back from last week's lower traffic. Yesterday's ${data.totalVisitors.toLocaleString()} visitors shows your corrective actions are working.`,
        priority: 5
      });
    }

    return insights;
  }

  /**
   * Hourly Distribution Insights
   */
  private static generateHourlyInsights(data: DailyData, comparison: ComparisonData): Insight[] {
    const insights: Insight[] = [];
    
    // Find gaps in hourly performance
    const hourlyAverage = data.totalVisitors / 12; // Business hours only
    const underperformingHours: number[] = [];
    
    for (let hour = 9; hour < 21; hour++) {
      if (data.hourlyVisitors[hour] < hourlyAverage * 0.5) {
        underperformingHours.push(hour);
      }
    }

    if (underperformingHours.length >= 3) {
      const hoursStr = underperformingHours.map(h => this.formatHour(h)).join(', ');
      insights.push({
        type: 'opportunity',
        title: 'Inconsistent daily traffic',
        description: `Traffic dropped significantly during ${hoursStr}. These quiet periods represent ${underperformingHours.length * Math.round(hourlyAverage * 0.5)} missed visitors. Consider targeted promotions or activities during these hours.`,
        priority: 6
      });
    }

    // Lunch hour performance
    const lunchTraffic = data.hourlyVisitors[12] + data.hourlyVisitors[13];
    const morningAvg = (data.hourlyVisitors[10] + data.hourlyVisitors[11]) / 2;
    
    if (lunchTraffic > morningAvg * 2.5) {
      insights.push({
        type: 'success',
        title: 'Strong lunch hour performance',
        description: `Lunch hours (12-2 PM) captured ${lunchTraffic} visitors. Ensure adequate staffing and consider lunch specials to maximize this natural peak.`,
        priority: 4
      });
    }

    return insights;
  }

  /**
   * Day-Specific Insights
   */
  private static generateDaySpecificInsights(data: DailyData, comparison: ComparisonData): Insight[] {
    const insights: Insight[] = [];
    const dayOfWeek = data.date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Weekend insights
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (data.morningVisitors > data.afternoonVisitors) {
        insights.push({
          type: 'trend',
          title: 'Weekend morning success',
          description: `${dayNames[dayOfWeek]} mornings are proving popular with ${data.morningVisitors} visitors before noon. Consider extending morning promotions or adding brunch offerings.`,
          priority: 5
        });
      }
    }

    // Monday specific
    if (dayOfWeek === 1 && data.totalVisitors > comparison.monthlyAverage.visitors * 1.1) {
      insights.push({
        type: 'success',
        title: 'Strong week start',
        description: `Excellent Monday performance with ${data.totalVisitors.toLocaleString()} visitors. Your weekend marketing efforts are successfully driving Monday traffic.`,
        priority: 4
      });
    }

    // Friday evening
    if (dayOfWeek === 5 && data.eveningVisitors > data.morningVisitors) {
      insights.push({
        type: 'trend',
        title: 'Friday evening popularity',
        description: `Friday evenings are busy with ${data.eveningVisitors} visitors after 6 PM. Consider extending hours or special Friday evening events.`,
        priority: 5
      });
    }

    return insights;
  }

  /**
   * Helper function to format hour
   */
  private static formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  }

  /**
   * Generate actionable recommendations based on insights
   */
  static generateRecommendations(insights: Insight[]): string[] {
    const recommendations: string[] = [];
    const topInsight = insights[0];

    switch (topInsight.type) {
      case 'opportunity':
        recommendations.push('Immediate action required to capture missed potential');
        break;
      case 'success':
        recommendations.push('Document and replicate successful strategies');
        break;
      case 'warning':
        recommendations.push('Address issues before they impact monthly performance');
        break;
      case 'trend':
        recommendations.push('Adapt operations to match changing patterns');
        break;
    }

    return recommendations;
  }
}

// Example usage for generating dynamic report content
export function generateDailyInsight(
  yesterdayData: DailyData,
  comparisonData: ComparisonData
): { title: string; content: string; type: string } {
  const insight = InsightGenerator.generatePrimaryInsight(yesterdayData, comparisonData);
  
  return {
    title: insight.title,
    content: insight.description,
    type: insight.type
  };
}