import { Scene } from './Scene';
import { SCENE_IDS, RUNES } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { randInt } from '@/utils/math';

const RECORDS = [
  { id: 'ZH-001', title: 'Первая запись', text: 'Архив был открыт по ошибке. Никто не должен был найти эти файлы.', secret: 'Запись помечена: наблюдение активно.' },
  { id: 'ZH-047', title: 'След наблюдателя', text: 'Каждый, кто читает это, уже отмечен.', secret: 'IP не существует. Существуете вы.' },
  { id: 'ZH-112', title: 'Цифровой культ', text: 'Zhorror не проект. Это ритуал.', secret: 'Zoobastiks не создал архив. Архив создал Zoobastiks.' },
  { id: 'ZH-666', title: 'Запретный фрагмент', text: 'Текст поврежден. Символы: ᛟ ᚦ ◈ ⬡ ☍', secret: 'НЕ ОТКРЫВАЙ. ...слишком поздно.' },
  { id: 'ZH-???', title: 'Пустая запись', text: '...', secret: 'ты здесь один? проверь за спиной.' },
];

export class ArchiveScene extends Scene {
  readonly id = SCENE_IDS.archive;
  readonly label = 'Архив';
  private cards: HTMLElement[] = [];

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-archive');
    const header = this.createEl('div', 'zh-archive__header');
    header.append(
      this.createEl('span', 'zh-archive__label', '◈ секция I'),
      this.createEl('h2', 'zh-archive__title', 'Проклятый архив'),
      this.createEl('p', 'zh-archive__hint', 'кликни на запись - открой скрытый текст'),
    );

    const grid = this.createEl('div', 'zh-archive__grid');
    for (const record of RECORDS) {
      const card = this.createEl('article', 'zh-archive__card');
      if (record.id === 'ZH-666') card.classList.add('zh-archive__card--cursed');
      card.innerHTML = `
        <div class="zh-archive__card-id">${record.id}</div>
        <div class="zh-archive__card-rune">${RUNES[randInt(0, RUNES.length - 1)]}</div>
        <h3 class="zh-archive__card-title">${record.title}</h3>
        <p class="zh-archive__card-text">${record.text}</p>
        <p class="zh-archive__card-secret">${record.secret}</p>
        <div class="zh-archive__card-corruption"></div>
      `;
      card.addEventListener('click', () => {
        card.classList.toggle('zh-archive__card--open');
        if (record.id === 'ZH-666' && card.classList.contains('zh-archive__card--open')) {
          events.emit(EVT.SCARE_REQUEST, { type: 'face' });
        }
      });
      this.cards.push(card);
      grid.appendChild(card);
    }

    inner.append(header, grid);
    this.element.appendChild(inner);
  }

  protected onUpdate(_dt: number): void {
    this.cards.forEach((card, i) => {
      const v = this.reveal(i * 0.05);
      card.style.opacity = String(v);
      card.style.transform = v >= 1 ? 'none' : `translateY(${(1 - v) * 20}px)`;
    });
  }
}
