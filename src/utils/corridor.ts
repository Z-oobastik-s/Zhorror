export type GridPoint = { x: number; y: number };

/** Все проходимые клетки, достижимые из точки старта */
export function corridorReachable(walls: boolean[][], from: GridPoint): GridPoint[] {
  const h = walls.length;
  const w = walls[0]?.length ?? 0;
  const seen = Array.from({ length: h }, () => Array(w).fill(false));
  const out: GridPoint[] = [];
  const queue: GridPoint[] = [from];
  seen[from.y][from.x] = true;

  while (queue.length > 0) {
    const p = queue.shift()!;
    out.push(p);
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (walls[ny][nx] || seen[ny][nx]) continue;
      seen[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }
  return out;
}

/** Случайная клетка, куда можно дойти из текущей позиции (не на змейке) */
export function pickReachableFood(
  walls: boolean[][],
  snake: GridPoint,
  avoid?: GridPoint,
): GridPoint | null {
  const reachable = corridorReachable(walls, snake).filter(
    (p) => p.x !== snake.x || p.y !== snake.y,
  );
  if (reachable.length === 0) return null;

  if (avoid) {
    const filtered = reachable.filter((p) => p.x !== avoid.x || p.y !== avoid.y);
    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
  }

  return reachable[Math.floor(Math.random() * reachable.length)];
}
