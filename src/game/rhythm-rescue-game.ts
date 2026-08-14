import * as THREE from 'three';
import { createFeedbackBus, type FeedbackBus } from '../core/feedback';
import { getMissionConfig } from '../core/mission-config';
import { applyMissionReward, type Progress } from '../core/progression';
import { createMissionRun, submitRunDirection, useRunRecovery, type MissionRunState } from '../core/mission-run';
import type { Direction } from '../core/types';
import { createFeedbackEffects, type FeedbackEffects } from '../feedback/feedback-effects';
import { createProgressStore } from '../storage/progress-store';
import { createInputController, type InputController } from './input/input-controller';
import { getMissionContent, type MissionContent } from './content/mission-content';
import { createGameState, type GameState } from './simulation/game-state';
import { createMissionClock, isMissionClockExpired, tickMissionClock, type MissionClockState } from './simulation/mission-clock';
import { createFollowCamera, type FollowCamera } from '../render/app/create-camera';
import { createGameLoop, type GameLoop } from '../render/app/create-game-loop';
import { createRenderer, type RendererHandle } from '../render/app/create-renderer';
import { createGameScene, type GameScene } from '../render/app/create-scene';
import { createEnergyRails, type EnergyRailsView } from '../render/objects/energy-rails';
import { createObstacles, type ObstaclesView } from '../render/objects/obstacles';
import { createRepairTarget, type RepairTargetView } from '../render/objects/repair-target';
import { createRescueAgent, type RescueAgentView } from '../render/objects/rescue-agent';
import { createSpaceBase } from '../render/objects/space-base';
import { createGameUi, type GameUi } from '../ui/game-ui';
import { getPreviewDurationMs, getPreviewIndex } from './simulation/pattern-preview';

const TUTORIAL_PATTERNS: readonly Direction[][] = [['up'], ['up', 'right'], ['left', 'down', 'right']];

export class RhythmRescueGame {
  private readonly rendererHandle: RendererHandle;
  private readonly gameScene: GameScene;
  private readonly camera: FollowCamera;
  private readonly loop: GameLoop;
  private readonly ui: GameUi;
  private readonly input: InputController;
  private readonly progressStore: ReturnType<typeof createProgressStore>;
  private readonly feedbackBus: FeedbackBus;
  private readonly feedbackEffects: FeedbackEffects;
  private readonly playGroup = new THREE.Group();
  private progress: Progress;
  private state: GameState = createGameState();
  private run?: MissionRunState;
  private content?: MissionContent;
  private clock?: MissionClockState;
  private agent?: RescueAgentView;
  private target?: RepairTargetView;
  private rails?: EnergyRailsView;
  private obstacles?: ObstaclesView;
  private previewUntil = 0;
  private previewStartedAt = 0;
  private elapsedMs = 0;
  private hudRefreshMs = 0;
  private disposed = false;

  private readonly onBlur = (): void => { if (this.state.screen === 'mission') this.pause(); };
  private readonly onVisibilityChange = (): void => { if (document.visibilityState === 'hidden') this.onBlur(); };

  constructor(worldRoot: HTMLElement, uiRoot: HTMLElement) {
    this.rendererHandle = createRenderer(worldRoot);
    this.gameScene = createGameScene();
    this.camera = createFollowCamera();
    this.ui = createGameUi(uiRoot);
    this.progressStore = createProgressStore(window.localStorage);
    this.progress = this.progressStore.load();
    this.feedbackBus = createFeedbackBus();
    this.feedbackEffects = createFeedbackEffects(this.feedbackBus, this.progress.settings);
    this.gameScene.world.add(this.playGroup);
    this.loop = createGameLoop(this.rendererHandle.renderer, (deltaMs) => this.update(deltaMs));
    this.input = createInputController({
      onDirection: (direction) => this.submitDirection(direction),
      onConfirm: () => this.startMission('short-01'),
      onPause: () => this.pause(),
    });
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  start(): void {
    if (this.disposed) return;
    this.mountBaseWorld();
    this.state = { screen: 'base', paused: false };
    this.renderBase();
    this.loop.start();
  }

  startMission(id: string): void {
    if (this.disposed) return;
    const config = getMissionConfig(id);
    this.content = getMissionContent(id);
    this.run = createMissionRun(config, { random: Math.random, tutorialPatterns: id === 'short-01' ? TUTORIAL_PATTERNS : undefined });
    this.clock = createMissionClock(this.content.timeLimitMs);
    this.beginPreview();
    this.elapsedMs = 0;
    this.state = { screen: 'mission', paused: false };
    this.input.setEnabled(true);
    this.mountMissionWorld();
    this.renderMission('홀로그램 패턴을 기억하세요.');
  }

  submitDirection(direction: Direction): void {
    if (this.state.screen !== 'mission' || this.state.paused || !this.run || !this.content) return;
    if (performance.now() < this.previewUntil) {
      this.renderMission('잠시만요! 패턴이 사라질 때까지 기억하세요.');
      return;
    }
    const previous = this.run;
    const next = submitRunDirection(previous, direction, { random: Math.random, tutorialPatterns: this.content.id === 'short-01' ? TUTORIAL_PATTERNS : undefined });
    const wrong = next.totalMistakes > previous.totalMistakes;
    this.feedbackBus.emit(wrong ? 'input-wrong' : 'input-correct');
      if (!wrong) {
        this.agent?.moveTo(direction);
        this.rails?.pulse(direction);
        this.obstacles?.reactTo(direction);
      }

    if (next.currentPoint.phase === 'recovery') {
      this.run = useRunRecovery(next);
      this.feedbackBus.emit('recovery-used');
      this.beginPreview();
      this.renderMission('신호가 흔들렸습니다. 패턴을 다시 기억하세요.');
      this.updateRepairFeedback();
      return;
    }
    this.run = next;
    this.updateRepairFeedback();
    if (this.run.completedPoints > previous.completedPoints) {
      this.feedbackBus.emit('point-complete');
      this.beginPreview();
    }
    if (this.run.phase === 'complete') {
      this.feedbackBus.emit('mission-complete');
      this.finishMission();
      return;
    }
    this.renderMission(this.run.completedPoints > previous.completedPoints ? '수리 지점 완료! 다음 신호를 기억하세요.' : undefined);
  }

  pause(): void {
    if (this.state.screen !== 'mission' || this.state.paused) return;
    this.state = { ...this.state, paused: true };
    this.input.setEnabled(false);
    this.ui.showPause(() => this.resume());
  }

  resume(): void {
    if (this.state.screen !== 'mission' || !this.state.paused) return;
    this.state = { ...this.state, paused: false };
    this.input.setEnabled(true);
    this.renderMission('임무를 계속합니다.');
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.stop();
    this.input.dispose();
    this.feedbackEffects.dispose();
    this.rendererHandle.dispose();
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.ui.clear();
  }

  private update(deltaMs: number): void {
    if (this.disposed) return;
    this.elapsedMs += deltaMs;
    this.agent?.update(deltaMs);
    this.target?.update(deltaMs);
    this.obstacles?.update(this.elapsedMs);
    if (this.state.screen === 'mission' && !this.state.paused && this.clock && this.content && this.run) {
      const now = performance.now();
      const previewVisible = now < this.previewUntil;
      if (!previewVisible) {
        this.clock = tickMissionClock(this.clock, deltaMs);
        if (isMissionClockExpired(this.clock)) this.handleClockExpired();
      }
      this.hudRefreshMs += deltaMs;
      if (this.hudRefreshMs >= 120 && this.state.screen === 'mission') {
        this.hudRefreshMs = 0;
        this.ui.updateMissionTimer(this.clock.remainingMs, this.content.timeLimitMs);
        this.ui.updateMissionPattern(
          this.run.currentPoint.pattern,
          this.run.currentPoint.cursor,
          previewVisible,
          previewVisible ? getPreviewIndex(now - this.previewStartedAt, this.run.currentPoint.pattern.length, this.content.previewBeatMs) : -1,
        );
      }
    }
    if (this.agent) this.camera.update(this.agent.root, deltaMs);
    this.rendererHandle.renderer.render(this.gameScene.scene, this.camera.camera);
  }

  private handleClockExpired(): void {
    if (!this.run || !this.content) return;
    if (this.run.currentPoint.recoveriesLeft > 0) {
      this.run = useRunRecovery({ ...this.run, totalMistakes: this.run.totalMistakes + 1 });
      this.beginPreview();
      this.renderMission('시간이 다 됐습니다. 구조대 복구 신호를 사용합니다.');
      return;
    }
    this.run = { ...this.run, phase: 'complete', rewardTier: 1 };
    this.finishMission();
  }

  private finishMission(): void {
    if (!this.run) return;
    this.progress = applyMissionReward(this.progress, this.run.rewardTier);
    this.progressStore.save(this.progress);
    this.state = { screen: 'result', paused: false };
    this.input.setEnabled(false);
    this.renderResult();
  }

  private renderBase(): void {
    this.ui.showBase({
      parts: this.progress.parts,
      baseLevel: this.progress.baseLevel,
      onStart: () => this.startMission('short-01'),
      onStartMedium: () => this.startMission('medium-01'),
      onStartLong: () => this.startMission('long-01'),
      onSettings: () => document.documentElement.classList.toggle('reduced-motion'),
    });
  }

  private renderMission(status?: string): void {
    if (!this.run || !this.content || !this.clock) return;
    const previewVisible = performance.now() < this.previewUntil;
    this.ui.showMission({
      objective: this.content.objective,
      repairPoint: this.run.completedPoints + 1,
      repairPoints: this.run.repairPoints,
      pattern: this.run.currentPoint.pattern,
      cursor: this.run.currentPoint.cursor,
      previewVisible,
      previewIndex: previewVisible
        ? getPreviewIndex(performance.now() - this.previewStartedAt, this.run.currentPoint.pattern.length, this.content.previewBeatMs)
        : -1,
      combo: this.run.combo,
      bestCombo: this.run.bestCombo,
      parts: this.progress.parts,
      timeRemainingMs: this.clock.remainingMs,
      timeLimitMs: this.content.timeLimitMs,
      status,
      onDirection: (direction) => this.submitDirection(direction),
      onPause: () => this.pause(),
    });
    if (this.state.paused) this.ui.showPause(() => this.resume());
  }

  private renderResult(): void {
    if (!this.run) return;
    this.ui.showResult({
      rewardTier: this.run.rewardTier, parts: this.progress.parts, baseLevel: this.progress.baseLevel,
      mistakes: this.run.totalMistakes, bestCombo: this.run.bestCombo,
      onReturnToBase: () => { this.state = { screen: 'base', paused: false }; this.mountBaseWorld(); this.renderBase(); },
      onNextMission: () => this.startMission('medium-01'),
    });
  }

  private mountBaseWorld(): void {
    this.playGroup.clear();
    this.playGroup.add(createSpaceBase());
    this.agent = createRescueAgent();
    this.playGroup.add(this.agent.root);
    this.target = undefined;
    this.rails = undefined;
    this.obstacles = undefined;
  }

  private beginPreview(): void {
    if (!this.run || !this.content) return;
    this.previewStartedAt = performance.now();
    const durationMs = getPreviewDurationMs(this.run.currentPoint.pattern.length, this.content.previewBeatMs);
    this.previewUntil = this.previewStartedAt + durationMs;
  }

  private mountMissionWorld(): void {
    this.playGroup.clear();
    this.playGroup.add(createSpaceBase());
    this.rails = createEnergyRails();
    this.playGroup.add(this.rails.root);
    this.agent = createRescueAgent();
    this.playGroup.add(this.agent.root);
    this.target = createRepairTarget();
    this.playGroup.add(this.target.root);
    this.updateRepairFeedback();
    this.obstacles = createObstacles(this.content?.obstacle ?? 'none');
    this.playGroup.add(this.obstacles.root);
  }

  private updateRepairFeedback(): void {
    if (!this.run || !this.target) return;
    const missionProgress = this.run.completedPoints / this.run.repairPoints;
    const pointProgress = this.run.currentPoint.cursor / this.run.currentPoint.pattern.length / this.run.repairPoints;
    this.target.setRepairPower(Math.min(1, Math.max(0.25, missionProgress + pointProgress)));
  }
}

export function createRhythmRescueGame(worldRoot: HTMLElement, uiRoot: HTMLElement): RhythmRescueGame {
  return new RhythmRescueGame(worldRoot, uiRoot);
}
