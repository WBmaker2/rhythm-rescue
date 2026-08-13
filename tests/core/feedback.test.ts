import { describe, expect, it } from 'vitest';
import { createFeedbackBus, type FeedbackEvent } from '../../src/core/feedback';

describe('feedback bus', () => {
  it('delivers events to subscribers in order', () => {
    const bus = createFeedbackBus();
    const received: FeedbackEvent[] = [];
    bus.subscribe((event) => received.push(event));

    bus.emit('input-correct');
    bus.emit('point-complete');

    expect(received).toEqual(['input-correct', 'point-complete']);
  });

  it('isolates listener failures and stops delivery after unsubscribe', () => {
    const bus = createFeedbackBus();
    const received: FeedbackEvent[] = [];
    bus.subscribe(() => { throw new Error('listener failure'); });
    const unsubscribe = bus.subscribe((event) => received.push(event));

    expect(() => bus.emit('input-wrong')).not.toThrow();
    unsubscribe();
    unsubscribe();
    bus.emit('recovery-used');

    expect(received).toEqual(['input-wrong']);
  });
});
