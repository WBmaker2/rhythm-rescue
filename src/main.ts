import './styles.css';
import { createRhythmRescueGame } from './game/rhythm-rescue-game';

const worldRoot = document.getElementById('game-world');
const uiRoot = document.getElementById('game-ui');

if (!worldRoot || !uiRoot) {
  throw new Error('Rhythm Rescue roots are missing');
}

const game = createRhythmRescueGame(worldRoot, uiRoot);
game.start();
