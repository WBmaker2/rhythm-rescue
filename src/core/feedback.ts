export type FeedbackEvent =
  | 'input-correct'
  | 'input-wrong'
  | 'recovery-used'
  | 'point-complete'
  | 'mission-complete';

export interface FeedbackBus {
  emit(event: FeedbackEvent): void;
  subscribe(listener: (event: FeedbackEvent) => void): () => void;
}

export function createFeedbackBus(): FeedbackBus {
  const listeners = new Set<(event: FeedbackEvent) => void>();

  return {
    emit(event) {
      for (const listener of [...listeners]) {
        try {
          listener(event);
        } catch {
          // Listener failures must not interrupt event delivery.
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      let subscribed = true;
      return () => {
        if (subscribed) {
          subscribed = false;
          listeners.delete(listener);
        }
      };
    },
  };
}
