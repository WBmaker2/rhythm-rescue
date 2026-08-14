import type { MissionConfig } from '../../core/types';

export interface MissionContent extends MissionConfig {
  objective: string;
  timeLimitMs: number;
  previewBeatMs: number;
}

const CONTENT: Readonly<Record<string, MissionContent>> = {
  'short-01': {
    id: 'short-01', length: 'short', repairPoints: 3, patternMin: 3, patternMax: 6, obstacle: 'none',
    objective: '소형 수리 로봇의 전력 회복', timeLimitMs: 60_000, previewBeatMs: 360,
  },
  'medium-01': {
    id: 'medium-01', length: 'medium', repairPoints: 5, patternMin: 5, patternMax: 9, obstacle: 'drone',
    objective: '궤도 드론을 피해 구조선 연결', timeLimitMs: 24_000, previewBeatMs: 320,
  },
  'long-01': {
    id: 'long-01', length: 'long', repairPoints: 7, patternMin: 7, patternMax: 11, obstacle: 'mixed',
    objective: '신호 차단막 너머의 구조선 수리', timeLimitMs: 18_000, previewBeatMs: 300,
  },
};

export function getMissionContent(id: string): MissionContent {
  const content = CONTENT[id];
  if (!content) throw new Error(`Unknown mission content: ${id}`);
  return { ...content };
}
