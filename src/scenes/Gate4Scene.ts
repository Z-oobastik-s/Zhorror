import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { quest } from '@/systems/QuestSystem';

export class Gate4Scene extends Scene {
  readonly id = SCENE_IDS.gate4;
  readonly label = 'Тесак';

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-gate4');
    inner.append(
      this.createEl('span', 'zh-gate4__label', '◈ акт IV'),
      this.createEl('h2', 'zh-gate4__title', 'Зал мясника'),
      this.createEl('p', 'zh-gate4__text', 'Терминус открыл дверь, которой не должно быть. За ней - запах железа и сырого мяса.'),
      this.createEl('p', 'zh-gate4__hint', 'мясник не прощает ошибок'),
    );
    const sigil = this.createEl('div', 'zh-gate4__sigil');
    sigil.setAttribute('role', 'button');
    sigil.innerHTML = '<span>войти в бойню</span><span class="zh-gate4__mark">⚒</span>';
    sigil.addEventListener('click', () => {
      if (!quest.canInteract()) return;
      quest.enterGate4();
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.hooks } }));
    });
    inner.appendChild(sigil);
    this.element.appendChild(inner);
  }
}
