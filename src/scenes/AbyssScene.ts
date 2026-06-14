import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { quest } from '@/systems/QuestSystem';

export class AbyssScene extends Scene {
  readonly id = SCENE_IDS.abyss;
  readonly label = 'Бездна';

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-abyss');
    const header = this.createEl('div', 'zh-abyss__header');
    header.append(
      this.createEl('span', 'zh-abyss__label', '◈ акт II'),
      this.createEl('h2', 'zh-abyss__title', 'Нижний слой'),
      this.createEl('p', 'zh-abyss__hint', 'первый акт завершён. архив не закончен.'),
    );

    const text = this.createEl('p', 'zh-abyss__text',
      'Печать снята, но за ней - ещё один уровень. Шёпот громче. Воздух тяжелее. Ты уже не гость.');

    const sigil = this.createEl('div', 'zh-abyss__sigil');
    sigil.setAttribute('role', 'button');
    sigil.setAttribute('tabindex', '0');
    sigil.innerHTML = '<span class="zh-abyss__sigil-inner"><span>спуститься</span><span class="zh-abyss__sigil-rune">☍</span></span>';
    sigil.addEventListener('click', () => {
      if (!quest.canInteract()) return;
      quest.enterAbyss();
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.echo } }));
    });

    inner.append(header, text, sigil);
    this.element.appendChild(inner);
  }

  protected onUpdate(_dt: number): void {
    this.applyReveal(this.element.querySelector('.zh-abyss__text') as HTMLElement, 0.05);
  }
}
