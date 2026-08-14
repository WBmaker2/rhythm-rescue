import type { Direction } from '../../core/types';
import { mapKeyboardKey } from './action-map';

export interface InputControllerOptions {
  onDirection(direction: Direction): void;
  onConfirm(): void;
  onPause(): void;
}

export interface InputController {
  dispose(): void;
  setEnabled(enabled: boolean): void;
}

export function createInputController(options: InputControllerOptions): InputController {
  let enabled = true;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!enabled) return;
    const action = mapKeyboardKey(event.key);
    if (!action) return;
    event.preventDefault();
    if (action === 'confirm') options.onConfirm();
    else if (action === 'pause') options.onPause();
    else options.onDirection(action);
  };

  window.addEventListener('keydown', onKeyDown);
  return {
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
    },
    setEnabled(nextEnabled) {
      enabled = nextEnabled;
    },
  };
}
