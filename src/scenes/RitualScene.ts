import { Scene } from './Scene';

import { RITUAL_SEQUENCE, SCENE_IDS } from '@/config/constants';

import { events, EVT } from '@/core/EventBus';

import { quest } from '@/systems/QuestSystem';



export class RitualScene extends Scene {

  readonly id = SCENE_IDS.ritual;

  readonly label = 'Ритуал';

  private circleInner!: HTMLElement;

  private sequenceEl!: HTMLElement;

  private hintEl!: HTMLElement;

  private symbols: HTMLElement[] = [];

  private rotation = 0;

  private sequenceShown = false;

  private sequenceTimer = 0;

  private ritualDone = false;



  protected build(): void {

    const inner = this.createEl('div', 'zh-scene__inner zh-ritual');

    const header = this.createEl('div', 'zh-ritual__header');

    header.append(

      this.createEl('span', 'zh-ritual__label', '◈ секция III'),

      this.createEl('h2', 'zh-ritual__title', 'Цифровой ритуал'),

      this.createEl('p', 'zh-ritual__hint', 'запомни последовательность, затем повтори на круге'),

    );



    this.sequenceEl = this.createEl('div', 'zh-ritual__sequence');

    this.hintEl = this.createEl('p', 'zh-ritual__sequence-hint', 'запоминай...');



    const circleWrap = this.createEl('div', 'zh-ritual__circle-wrap');

    this.circleInner = this.createEl('div', 'zh-ritual__circle');



    const circleSymbols = ['ᛟ', 'ᚦ', '◈', '⬡', 'ᚨ', 'ᚱ', 'ᛞ', 'ᛉ'] as const;

    for (let i = 0; i < 8; i++) {

      const sym = document.createElement('button');

      sym.className = 'zh-ritual__symbol';

      sym.type = 'button';

      sym.textContent = circleSymbols[i];

      sym.dataset.rune = circleSymbols[i];

      sym.style.setProperty('--angle', `${(360 / 8) * i}deg`);

      sym.addEventListener('click', () => this.onSymbolClick(sym));

      this.symbols.push(sym);

      this.circleInner.appendChild(sym);

    }



    const center = this.createEl('div', 'zh-ritual__center');

    center.innerHTML = '<span>?</span><small>круг</small>';

    this.circleInner.appendChild(center);

    circleWrap.appendChild(this.circleInner);



    inner.append(

      header,

      this.sequenceEl,

      this.hintEl,

      circleWrap,

      this.createEl('p', 'zh-ritual__desc', 'Каждый символ усиливает связь. Ошибка сбрасывает ритуал.'),

    );

    this.element.appendChild(inner);

    if (quest.getRitualProgress() >= RITUAL_SEQUENCE.length || quest.getDepth() >= 4) {
      this.sequenceShown = true;
      this.ritualDone = true;
      this.hintEl.textContent = 'круг уже разорван.';
    }

  }



  private showSequence(): void {

    this.sequenceEl.innerHTML = RITUAL_SEQUENCE

      .map((r) => `<span class="zh-ritual__seq-rune">${r}</span>`)

      .join('');

    this.sequenceEl.classList.add('zh-ritual__sequence--visible');

    this.hintEl.textContent = 'запоминай...';

  }



  private hideSequence(): void {

    this.sequenceEl.classList.remove('zh-ritual__sequence--visible');

    this.hintEl.textContent = 'повтори последовательность на круге';

  }



  private onSymbolClick(sym: HTMLElement): void {

    if (this.ritualDone || !this.sequenceShown) return;



    const rune = sym.dataset.rune ?? sym.textContent ?? '';

    const result = quest.advanceRitual(rune);



    if (result === 'wrong') {

      sym.classList.add('zh-ritual__symbol--wrong');

      setTimeout(() => sym.classList.remove('zh-ritual__symbol--wrong'), 600);

      events.emit(EVT.SCARE_REQUEST, { type: 'static' });

      this.hintEl.textContent = 'ошибка. сначала.';

      this.symbols.forEach((s) => s.classList.remove('zh-ritual__symbol--lit'));

      return;

    }



    sym.classList.add('zh-ritual__symbol--lit');

    events.emit(EVT.INTERACT, { type: 'rune' });



    if (result === 'done') {

      this.ritualDone = true;

      this.hintEl.textContent = 'круг разорван. пустота ждёт.';

      setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'static' }), 500);

    } else {

      this.hintEl.textContent = `${quest.getRitualProgress()} / ${RITUAL_SEQUENCE.length}`;

    }

  }



  protected onUpdate(dt: number): void {

    if (!this.active) return;



    if (!this.sequenceShown) {

      this.sequenceTimer += dt;

      if (this.sequenceTimer > 0.8) {

        this.showSequence();

      }

      if (this.sequenceTimer > 4.5) {

        this.sequenceShown = true;

        this.hideSequence();

      }

      return;

    }



    this.rotation += dt * (3 + quest.getDepth() * 0.5);

    this.circleInner.style.transform = `rotate(${this.rotation}deg)`;

    this.symbols.forEach((sym, i) => {

      if (!sym.classList.contains('zh-ritual__symbol--lit')) {

        sym.style.opacity = String(0.45 + Math.sin(performance.now() * 0.003 + i) * 0.3);

      }

    });

  }

}


