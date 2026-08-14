export type GameScreen = 'base' | 'mission' | 'result';

export interface GameState {
  screen: GameScreen;
  paused: boolean;
}

export function createGameState(): GameState {
  return { screen: 'base', paused: false };
}
