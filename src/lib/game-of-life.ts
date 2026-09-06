export type Grid = boolean[][];

export type Settlement = "extinct" | "stable" | "running";

/**
Which neighbour counts bring a dead cell to life (`born`) or keep a live
one alive (`survive`) — the "Bn/Sn" notation used across Life-like
cellular automata.
*/
export interface Rule {
  readonly born: readonly number[];
  readonly survive: readonly number[];
}

/**
A handful of well-known Life-like rules, all played on the same B/S
mechanism as Conway's original. HighLife's extra birth count (B36 instead
of B3) is famous for supporting a self-replicating pattern; Seeds is
explosive and chaotic since nothing ever survives; Day and Night is
symmetric under cell inversion (swap alive/dead and the rule looks the
same).
*/
export const RULESETS = {
  conway: { born: [3], survive: [2, 3] },
  highlife: { born: [3, 6], survive: [2, 3] },
  seeds: { born: [2], survive: [] },
  dayAndNight: { born: [3, 6, 7, 8], survive: [3, 4, 6, 7, 8] },
} as const satisfies Record<string, Rule>;

export type RuleName = keyof typeof RULESETS;

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
Sets a single cell to `isAlive`, returning the same grid reference when
it's already at that value so callers painting a drag stroke across many
cells each frame don't allocate a new grid for a no-op.
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

/**
Flips a single cell without mutating the grid passed in.
*/
export function toggleCell(grid: Grid, row: number, col: number): Grid {
  const wasAlive = grid[row]![col];
  return setCell(grid, row, col, !wasAlive);
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
Applies a Life-like rule (Conway's B3/S23 by default) to produce the next
generation.
*/
export function nextGeneration(grid: Grid, rule: Rule = RULESETS.conway): Grid {
  return grid.map((line, row) =>
    line.map((alive, col) => {
      const neighbors = countLiveNeighbors(grid, row, col);
      return alive
        ? rule.survive.includes(neighbors)
        : rule.born.includes(neighbors);
    })
  );
}

/**
Counts every alive cell in the grid.
*/
export function countLiveCells(grid: Grid): number {
  let count = 0;
  for (const line of grid) {
    for (const cell of line) {
      if (cell) count++;
    }
  }
  return count;
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

/**
Classifies a generation transition: "extinct" once every cell has died,
"stable" once the grid stops changing between generations (a fixed
point), or "running" otherwise.
*/
export function classifySettlement(previous: Grid, next: Grid): Settlement {
  if (countLiveCells(next) === 0) return "extinct";
  if (areGridsEqual(previous, next)) return "stable";
  return "running";
}

/**
A live cell's position relative to a pattern's top-left corner.
*/
export type Coordinate = readonly [row: number, col: number];

export type Pattern = readonly Coordinate[];

// The pulsar's 13x13 body is symmetric: one set of coordinates forms rows
// of three short dashes, the same set forms columns of three short dashes.
const PULSAR_DASH_ENDS = [0, 5, 7, 12];
const PULSAR_DASH_MIDDLES = [2, 3, 4, 8, 9, 10];

/**
A handful of well-known still lifes, oscillators, and spaceship-emitting
guns to drop onto the grid instead of starting from random soup.
*/
export const PATTERNS = {
  glider: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  pulsar: [
    ...PULSAR_DASH_ENDS.flatMap((row) =>
      PULSAR_DASH_MIDDLES.map((col): Coordinate => [row, col])
    ),
    ...PULSAR_DASH_MIDDLES.flatMap((row) =>
      PULSAR_DASH_ENDS.map((col): Coordinate => [row, col])
    ),
  ],
  gosperGliderGun: [
    [0, 24],
    [1, 22],
    [1, 24],
    [2, 12],
    [2, 13],
    [2, 20],
    [2, 21],
    [2, 34],
    [2, 35],
    [3, 11],
    [3, 15],
    [3, 20],
    [3, 21],
    [3, 34],
    [3, 35],
    [4, 0],
    [4, 1],
    [4, 10],
    [4, 16],
    [4, 20],
    [4, 21],
    [5, 0],
    [5, 1],
    [5, 10],
    [5, 14],
    [5, 16],
    [5, 17],
    [5, 22],
    [5, 24],
    [6, 10],
    [6, 16],
    [6, 24],
    [7, 11],
    [7, 15],
    [8, 12],
    [8, 13],
  ],
} as const satisfies Record<string, Pattern>;

export type PatternName = keyof typeof PATTERNS;

/**
The bounding box of a pattern's live-cell offsets, used to centre it on
the grid before stamping it down.
*/
export function getPatternSize(pattern: Pattern): {
  rows: number;
  cols: number;
} {
  let maxRow = 0;
  let maxCol = 0;
  for (const [row, col] of pattern) {
    maxRow = Math.max(maxRow, row);
    maxCol = Math.max(maxCol, col);
  }
  return { rows: maxRow + 1, cols: maxCol + 1 };
}

/**
Turns on every live cell of `pattern` at `originRow`/`originCol`, wrapping
around the edges of the grid, without disturbing cells already alive
outside the pattern.
*/
export function stampPattern(
  grid: Grid,
  pattern: Pattern,
  originRow: number,
  originCol: number
): Grid {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const next = grid.map((line) => [...line]);
  for (const [row, col] of pattern) {
    const r = (originRow + row + rows) % rows;
    const c = (originCol + col + cols) % cols;
    next[r]![c] = true;
  }
  return next;
}
