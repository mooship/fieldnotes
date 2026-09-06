export type Grid = boolean[][];

/**
Creates a `rows * cols` grid with every cell dead.
*/
export function createEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
}

/**
Creates a `rows * cols` grid where each cell is alive with roughly
`aliveProbability` chance. `random` is injectable so callers can seed
deterministic tests.
*/
export function randomizeGrid(
  rows: number,
  cols: number,
  aliveProbability = 0.35,
  random: () => number = Math.random
): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => random() < aliveProbability)
  );
}

/**
Flips a single cell without mutating the grid passed in.
*/
export function toggleCell(grid: Grid, row: number, col: number): Grid {
  return grid.map((line, r) =>
    r === row ? line.map((cell, c) => (c === col ? !cell : cell)) : line
  );
}

/**
Sets a single cell to `alive`, returning the same grid reference when it's
already at that value so callers painting a drag stroke across many cells
each frame don't allocate a new grid for a no-op.
*/
export function setCell(
  grid: Grid,
  row: number,
  col: number,
  isAlive: boolean
): Grid {
  if (grid[row]![col] === isAlive) return grid;
  return grid.map((line, r) =>
    r === row ? line.map((cell, c) => (c === col ? isAlive : cell)) : line
  );
}

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/**
Counts live cells in the eight neighbouring positions, wrapping around the
edges of the grid (a torus) so patterns near the border behave the same as
those in the middle.
*/
export function countLiveNeighbors(grid: Grid, row: number, col: number) {
  const rows = grid.length;
  const cols = grid[0]!.length;
  let count = 0;
  for (const [dr, dc] of NEIGHBOR_OFFSETS) {
    const r = (row + dr + rows) % rows;
    const c = (col + dc + cols) % cols;
    const neighborIsAlive = grid[r]![c];
    if (neighborIsAlive) count++;
  }
  return count;
}

/**
Applies Conway's classic rules (B3/S23) to produce the next generation.
*/
export function nextGeneration(grid: Grid): Grid {
  return grid.map((line, row) =>
    line.map((alive, col) => {
      const neighbors = countLiveNeighbors(grid, row, col);
      return alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
    })
  );
}

/**
Counts every alive cell in the grid.
*/
export function countLiveCells(grid: Grid): number {
  return grid.reduce((total, line) => total + line.filter(Boolean).length, 0);
}

/**
True when two grids have identical cell values, used to detect a
simulation that has settled into a fixed point.
*/
export function areGridsEqual(a: Grid, b: Grid): boolean {
  return a.every((line, row) =>
    line.every((cell, col) => cell === b[row]![col])
  );
}
