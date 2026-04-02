export interface DashboardMetric {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

export interface MentorDashboardModel {
  grammarZoneSummary: DashboardMetric[];
  srsHealth: DashboardMetric[];
  avoidanceAlerts: DashboardMetric[];
  sessionStreak: DashboardMetric[];
  activeLernauftrag: DashboardMetric[];
}
