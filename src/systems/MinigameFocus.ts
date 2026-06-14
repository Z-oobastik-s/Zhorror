/** Блок случайных скримеров, пока идёт мини-игра (змейка и т.п.) */
let ambientScaresBlocked = false;

export function setAmbientScareBlocked(block: boolean): void {
  ambientScaresBlocked = block;
}

export function isAmbientScareBlocked(): boolean {
  return ambientScaresBlocked;
}
