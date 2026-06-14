/** Глобальный флаг: звук включён и можно играть */
class AudioGateState {
  private open = false;

  isOpen(): boolean {
    return this.open;
  }

  setOpen(value: boolean): void {
    this.open = value;
  }
}

export const audioGate = new AudioGateState();
