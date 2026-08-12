import Phaser from 'phaser';
import { createProgressStore } from '../storage/progress-store';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('BaseScene', {
      progress: createProgressStore(window.localStorage).load(),
    });
  }
}
