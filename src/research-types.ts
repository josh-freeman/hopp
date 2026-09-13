export interface ResearchRoute {
  id: string;
  station: string;
  region: string;
  from: string;
  title: string;
  status: 'researched' | 'needs-check' | 'not-useful';
  summary: string;
  access: string;
  platforms: string[];
  distanceM?: number;
  plannerBudgetS?: number;
  sources: { title: string; url: string; checkedAt: string }[];
  findings: string[];
  fieldChecks: string[];
  activeHackId?: string;
}
