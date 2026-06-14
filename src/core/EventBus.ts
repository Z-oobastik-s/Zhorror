type Handler<T = unknown> = (payload?: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown): void {
    this.listeners.get(event)?.forEach((h) => h(payload));
  }

  once(event: string, handler: Handler): () => void {
    const wrapper: Handler = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }
}

export const events = new EventBus();

export const EVT = {
  RESIZE: 'resize',
  SCROLL: 'scroll',
  SCENE_CHANGE: 'scene:change',
  ATMOSPHERE: 'atmosphere:level',
  RANDOM_EVENT: 'random:event',
  AUDIO_TOGGLE: 'audio:toggle',
  IDLE: 'user:idle',
  SCARE: 'scare',
  SCARE_REQUEST: 'scare:request',
  INTERACT: 'interact',
  TRANSITION_START: 'transition:start',
  TRANSITION_END: 'transition:end',
  BOOT_COMPLETE: 'boot:complete',
  QUEST_UPDATE: 'quest:update',
  QUEST_CHAPTER: 'quest:chapter',
  QUEST_FRAGMENT: 'quest:fragment',
  QUEST_COMPLETE: 'quest:complete',
} as const;
