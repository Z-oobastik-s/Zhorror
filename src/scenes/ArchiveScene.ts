import { Scene } from './Scene';
import { ARCHIVE_RECORD_META, SCENE_IDS, RUNES } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';
import { randInt } from '@/utils/math';

export class ArchiveScene extends Scene {
  readonly id = SCENE_IDS.archive;
  readonly label = 'Архив';
  private cards: HTMLElement[] = [];

  protected build(): void {
    const run = quest.getRun();
    const inner = this.createEl('div', 'zh-scene__inner zh-archive');
    const header = this.createEl('div', 'zh-archive__header');
    header.append(
      this.createEl('span', 'zh-archive__label', '◈ секция I'),
      this.createEl('h2', 'zh-archive__title', 'Проклятый архив'),
      this.createEl('p', 'zh-archive__hint', 'открой записи - в некоторых спрятаны метки. не все настоящие'),
    );

    const grid = this.createEl('div', 'zh-archive__grid');
    const metaById = new Map<string, typeof ARCHIVE_RECORD_META[number]>(
      ARCHIVE_RECORD_META.map((r) => [r.id, r]),
    );
    const ordered = run.archiveOrder
      .map((id) => metaById.get(id))
      .filter((r): r is typeof ARCHIVE_RECORD_META[number] => !!r);

    for (const record of ordered) {
      const card = this.createEl('article', 'zh-archive__card');
      const hasMark = quest.hasArchiveMark(record.id);
      const isReal = record.id in run.archiveMap;
      const isDecoy = quest.isDecoyRecord(record.id);

      if (record.id === run.voidRecordId) card.classList.add('zh-archive__card--cursed');
      if (hasMark) card.classList.add('zh-archive__card--marked');

      const markRune = isReal
        ? quest.getArchiveRune(record.id)
        : isDecoy
          ? RUNES[randInt(0, RUNES.length - 1)]
          : '';

      card.innerHTML = `
        <div class="zh-archive__card-id">${record.id}</div>
        <div class="zh-archive__card-rune">${RUNES[randInt(0, RUNES.length - 1)]}</div>
        ${hasMark ? `<div class="zh-archive__card-mark">${markRune}</div>` : ''}
        <h3 class="zh-archive__card-title">${record.title}</h3>
        <p class="zh-archive__card-text">${record.text}</p>
        <p class="zh-archive__card-secret">${quest.getArchiveSecret(record.id, record.secret)}</p>
        <div class="zh-archive__card-corruption"></div>
      `;

      card.addEventListener('click', () => {
        if (!quest.canInteract()) return;
        const opening = !card.classList.contains('zh-archive__card--open');
        card.classList.toggle('zh-archive__card--open');

        if (opening && isDecoy) {
          events.emit(EVT.SCARE_REQUEST, { type: 'static' });
          return;
        }

        if (opening && isReal) {
          const added = quest.collectFragment(record.id);
          if (added) {
            card.classList.add('zh-archive__card--found');
            events.emit(EVT.INTERACT, { type: 'rune' });
          }
        }

        if (record.id === run.voidRecordId && card.classList.contains('zh-archive__card--open')) {
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
