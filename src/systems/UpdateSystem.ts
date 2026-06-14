const CHECK_INTERVAL_MS = 90_000;
const RELOAD_DELAY_MS = 1_400;

export class UpdateSystem {
  private timer: ReturnType<typeof setInterval> | null = null;
  private checking = false;
  private reloading = false;
  private readonly currentVersion = __APP_VERSION__;
  private readonly versionUrl: string;

  constructor() {
    const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
    this.versionUrl = `${base}version.json`;
  }

  start(): void {
    if (!import.meta.env.PROD) return;

    this.check();
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.check();
    });

    window.addEventListener('focus', () => this.check());
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async check(): Promise<void> {
    if (this.checking || this.reloading) return;
    this.checking = true;

    try {
      const response = await fetch(`${this.versionUrl}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) return;

      const data = (await response.json()) as { version?: string };
      if (!data.version || data.version === this.currentVersion) return;

      this.applyUpdate(data.version);
    } catch {
      /* сеть или офлайн - повторим позже */
    } finally {
      this.checking = false;
    }
  }

  private applyUpdate(nextVersion: string): void {
    if (this.reloading) return;
    this.reloading = true;
    this.stop();

    const overlay = document.createElement('div');
    overlay.className = 'zh-update';
    overlay.innerHTML = `
      <div class="zh-update__inner">
        <span class="zh-update__mark">◈</span>
        <p class="zh-update__title">архив обновлён</p>
        <p class="zh-update__text">подгружаем новую версию...</p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('zh-update--visible'));

    window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('_v', nextVersion);
      window.location.replace(url.toString());
    }, RELOAD_DELAY_MS);
  }
}

export const updates = new UpdateSystem();
