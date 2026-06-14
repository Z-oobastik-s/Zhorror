import { Scene } from './Scene';
import { SCENE_IDS, RUNES } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { randInt } from '@/utils/math';

const RECORDS = [
  { id: 'ZH-001', title: 'Первая запись', text: 'Архив был открыт по ошибке. Никто не должен был найти эти файлы.' },
  { id: 'ZH-047', title: 'След наблюдателя', text: 'Каждый, кто читает это, уже отмечен. Система фиксирует ваш взгляд.' },
  { id: 'ZH-112', title: 'Цифровой культ', text: 'Zhorror не проект. Это ритуал. Zoobastiks лишь открыл дверь.' },
  { id: 'ZH-666', title: 'Запретный фрагмент', text: 'Текст поврежден. Остались только символы: ᛟ ᚦ ◈ ⬡ ☍' },
  { id: 'ZH-???', title: 'Пустая запись', text: '...' },
];

export class ArchiveScene extends Scene {
  readonly id = SCENE_IDS.archive;
  readonly label = 'Архив';
  private cards: HTMLElement[] = [];

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-archive');

    const header = this.createEl('div', 'zh-archive__header');
    header.appendChild(this.createEl('span', 'zh-archive__label', '◈ секция I'));
    header.appendChild(this.createEl('h2', 'zh-archive__title', 'Проклятый архив'));

    const grid = this.createEl('div', 'zh-archive__grid');

    for (const record of RECORDS) {
      const card = this.createEl('article', 'zh-archive__card');
      if (record.id === 'ZH-666') card.classList.add('zh-archive__card--cursed');
      card.innerHTML = `
        <div class="zh-archive__card-id">${record.id}</div>
        <div class="zh-archive__card-rune">${RUNES[randInt(0, RUNES.length - 1)]}</div>
        <h3 class="zh-archive__card-title">${record.title}</h3>
        <p class="zh-archive__card-text">${record.text}</p>
        <div class="zh-archive__card-corruption"></div>
      `;
      card.addEventListener('mouseenter', () => card.classList.add('zh-archive__card--hover'));
      card.addEventListener('mouseleave', () => card.classList.remove('zh-archive__card--hover'));

      if (record.id === 'ZH-666') {
        card.addEventListener('click', () => {
          events.emit(EVT.SCARE_REQUEST, { type: 'face' });
        });
      }

      this.cards.push(card);
      grid.appendChild(card);
    }

    inner.append(header, grid);
    this.element.appendChild(inner);
  }

  protected onUpdate(_dt: number): void {
    this.cards.forEach((card, i) => {
      const threshold = 0.1 + i * 0.08;
      const opacity = Math.max(0, Math.min(1, (this.progress - threshold) / 0.3));
      card.style.opacity = String(opacity);
      card.style.transform = `translateY(${(1 - opacity) * 30}px)`;

      if (this.active && Math.random() < 0.0003) {
        card.classList.add('zh-archive__card--glitch');
        setTimeout(() => card.classList.remove('zh-archive__card--glitch'), 120);
      }
    });
  }
}
