import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { quest } from '@/systems/QuestSystem';

export class Gate5Scene extends Scene {
  readonly id = SCENE_IDS.gate5;
  readonly label = 'Петля';

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-gate5');
    inner.append(
      this.createEl('span', 'zh-gate5__label', '◈ акт V'),
      this.createEl('h2', 'zh-gate5__title', 'Коридор повешенных'),
      this.createEl('p', 'zh-gate5__text', 'Бойня открыла дверь вниз. Там не пол. Там верёвки. И те, кто ещё качается.'),
      this.createEl('p', 'zh-gate5__hint', 'не поднимай глаза. не дыши громко'),
    );
    const sigil = this.createEl('div', 'zh-gate5__sigil');
    sigil.setAttribute('role', 'button');
    sigil.innerHTML = '<span>войти в коридор</span><span class="zh-gate5__mark">⌁</span>';
    sigil.addEventListener('click', () => {
      if (!quest.canInteract()) return;
      quest.enterGate5();
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.gallows } }));
    });
    inner.appendChild(sigil);
    this.element.appendChild(inner);
  }
}
