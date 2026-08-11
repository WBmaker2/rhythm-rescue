import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.add
      .text(640, 360, '리듬 구조대', {
        color: '#ffffff',
        fontSize: '48px',
      })
      .setOrigin(0.5);
  }
}
