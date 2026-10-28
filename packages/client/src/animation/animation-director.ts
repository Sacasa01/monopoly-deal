import gsap from 'gsap';

export interface AnimationTask {
  id: string;
  run: () => Promise<void>;
}

export class AnimationDirector {
  private queue: AnimationTask[] = [];
  private isProcessing = false;
  private speedMultiplier = 1.0;

  constructor() {
    // Check if user has requested reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.speedMultiplier = 0.1;
    }
  }

  public enqueue(task: () => Promise<void>, id: string = 'anim-' + Date.now()) {
    this.queue.push({ id, run: task });
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift()!;

    try {
      await task.run();
    } catch (err) {
      console.warn('[AnimationDirector] Error during animation:', err);
    }

    this.processNext();
  }

  /**
   * Animates a card flying from source DOM element to destination DOM element.
   */
  public async animateCardFlight(
    sourceEl: HTMLElement,
    targetEl: HTMLElement,
    durationMs: number = 380
  ): Promise<void> {
    const srcRect = sourceEl.getBoundingClientRect();
    const tgtRect = targetEl.getBoundingClientRect();

    const dx = tgtRect.left - srcRect.left;
    const dy = tgtRect.top - srcRect.top;

    return new Promise((resolve) => {
      gsap.fromTo(
        sourceEl,
        {
          x: 0,
          y: 0,
          scale: 1,
          zIndex: 100
        },
        {
          x: dx,
          y: dy,
          scale: 1.05,
          duration: (durationMs / 1000) * this.speedMultiplier,
          ease: 'power3.out',
          onComplete: () => {
            gsap.set(sourceEl, { x: 0, y: 0, scale: 1, zIndex: 'auto' });
            resolve();
          }
        }
      );
    });
  }

  public clear() {
    this.queue = [];
    this.isProcessing = false;
  }
}

export const animationDirector = new AnimationDirector();
