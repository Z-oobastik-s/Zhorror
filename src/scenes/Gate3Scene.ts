import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { quest } from '@/systems/QuestSystem';

export class Gate3Scene extends Scene {
  readonly id = SCENE_IDS.gate3;
  readonly label = 'Ядро';

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-gate3');
    inner.append(
      this.createEl('span', 'zh-gate3__label', '◈ акт III'),
      this.createEl('h2', 'zh-gate3__title', 'Ядро архива'),
      this.createEl('p', 'zh-gate3__text', 'Два слоя позади. Третий не должен существовать. Но ты здесь.'),
      this.createEl('p', 'zh-gate3__hint', 'дальше - только хуже'),
    );
    const sigil = this.createEl('div', 'zh-gate3__sigil');
    sigil.setAttribute('role', 'button');
    sigil.innerHTML = '<span>войти в ядро</span><span class="zh-gate3__rune">⍟</span>';
    sigil.addEventListener('click', () => {
      quest.enterGate3();
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.catacombs } }));
    });
    inner.appendChild(sigil);
    this.element.appendChild(inner);
  }
}
