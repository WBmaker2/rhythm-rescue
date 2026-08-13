import Phaser from 'phaser';
import { BootScene } from './scenes/boot-scene';
import './styles.css';
import { BaseScene } from './scenes/base-scene';
import { MissionScene } from './scenes/mission-scene';
import { ResultScene } from './scenes/result-scene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#0b1630',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, BaseScene, MissionScene, ResultScene],
});
