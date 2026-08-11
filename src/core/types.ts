export type Direction = 'up' | 'right' | 'down' | 'left';

export type MissionLength = 'short' | 'medium' | 'long';

export type ObstacleType = 'none' | 'drone' | 'occluder' | 'mixed';

export interface MissionConfig {
  id: string;
  length: MissionLength;
  repairPoints: number;
  patternMin: number;
  patternMax: number;
  obstacle: ObstacleType;
}
