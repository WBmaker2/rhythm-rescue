import type { MissionConfig } from './types';

const MISSION_CONFIGS: Record<string, MissionConfig> = {
  'short-01': {
    id: 'short-01',
    length: 'short',
    repairPoints: 3,
    patternMin: 3,
    patternMax: 6,
    obstacle: 'none',
  },
  'medium-01': {
    id: 'medium-01',
    length: 'medium',
    repairPoints: 5,
    patternMin: 5,
    patternMax: 9,
    obstacle: 'drone',
  },
  'long-01': {
    id: 'long-01',
    length: 'long',
    repairPoints: 7,
    patternMin: 7,
    patternMax: 11,
    obstacle: 'mixed',
  },
};

export function getMissionConfig(id: string): MissionConfig {
  const config = MISSION_CONFIGS[id];
  if (!config) {
    throw new Error(`Unknown mission config: ${id}`);
  }
  return { ...config };
}
