import { describe, expect, it } from "vitest";
import {
  areGridsEqual,
  classifySettlement,
  countLiveCells,
  countLiveNeighbors,
  createEmptyGrid,
  getPatternSize,
  nextGeneration,
  PATTERNS,
  randomizeGrid,
  RULESETS,
  setCell,
  stampPattern,
  toggleCell,
  type Grid,
} from "./game-of-life";

describe("createEmptyGrid", () => {
  it("creates the requested dimensions, all dead", () => {
    const grid = createEmptyGrid(3, 4);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(4);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(true);
  });
});

describe("randomizeGrid", () => {
  it("fills every cell when the injected random always beats the threshold", () => {
    const grid = randomizeGrid(2, 2, 0.35, () => 0);
    expect(grid.every((row) => row.every((cell) => cell === true))).toBe(true);
  });

  it("leaves every cell dead when the injected random never beats the threshold", () => {
    const grid = randomizeGrid(2, 2, 0.35, () => 0.99);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(true);
  });
});

describe("toggleCell", () => {
  it("flips only the target cell", () => {
    const grid = createEmptyGrid(2, 2);
    const result = toggleCell(grid, 0, 1);
    expect(result[0]![1]).toBe(true);
    expect(result[0]![0]).toBe(false);
    expect(result[1]![0]).toBe(false);
    expect(result[1]![1]).toBe(false);
  });

  it("doesn't mutate the original grid", () => {
    const grid = createEmptyGrid(2, 2);
    toggleCell(grid, 0, 0);
    expect(grid[0]![0]).toBe(false);
  });
});

describe("setCell", () => {
  it("sets a cell to the given value", () => {
    const grid = createEmptyGrid(2, 2);
    const result = setCell(grid, 1, 1, true);
    expect(result[1]![1]).toBe(true);
    expect(result[0]![0]).toBe(false);
  });

  it("returns the same grid reference when the value doesn't change", () => {
    const grid = createEmptyGrid(2, 2);
    expect(setCell(grid, 0, 0, false)).toBe(grid);
  });
});

describe("countLiveNeighbors", () => {
  it("counts the eight surrounding cells", () => {
    const grid: Grid = [
      [true, true, true],
      [false, false, false],
      [false, false, false],
    ];
    expect(countLiveNeighbors(grid, 1, 1)).toBe(3);
  });

  it("wraps around the edges of the grid", () => {
    const grid: Grid = [
      [true, false, true],
      [false, false, false],
      [false, false, false],
    ];
    expect(countLiveNeighbors(grid, 0, 0)).toBe(1);
  });
});

describe("nextGeneration", () => {
  it("kills a live cell with fewer than two neighbours", () => {
    const grid = createEmptyGrid(5, 5);
    grid[2]![2] = true;
    grid[0]![0] = true;
    expect(nextGeneration(grid)[2]![2]).toBe(false);
  });

  it("keeps a live cell with two or three neighbours alive", () => {
    const grid: Grid = [
      [false, true, false],
      [false, true, false],
      [false, true, false],
    ];
    expect(nextGeneration(grid)[1]![1]).toBe(true);
  });

  it("kills a live cell with more than three neighbours", () => {
    const grid: Grid = [
      [true, true, true],
      [true, true, false],
      [false, false, false],
    ];
    expect(nextGeneration(grid)[1]![1]).toBe(false);
  });

  it("brings a dead cell with exactly three neighbours to life", () => {
    const grid: Grid = [
      [true, true, true],
      [false, false, false],
      [false, false, false],
    ];
    expect(nextGeneration(grid)[1]![1]).toBe(true);
  });

  it("turns a horizontal blinker into a vertical one", () => {
    const grid = createEmptyGrid(7, 7);
    grid[3]![2] = true;
    grid[3]![3] = true;
    grid[3]![4] = true;
    const next = nextGeneration(grid);
    expect(next[2]![3]).toBe(true);
    expect(next[3]![3]).toBe(true);
    expect(next[4]![3]).toBe(true);
    expect(next[3]![2]).toBe(false);
    expect(next[3]![4]).toBe(false);
  });

  it("defaults to Conway's rule (B3/S23)", () => {
    const grid = createEmptyGrid(3, 3);
    grid[0]![0] = true;
    grid[0]![1] = true;
    grid[1]![0] = true;
    expect(nextGeneration(grid, RULESETS.conway)).toEqual(nextGeneration(grid));
  });

  it("HighLife births a dead cell with six neighbours, unlike Conway's rule", () => {
    const fiveNeighbors: Grid = [
      [true, true, true],
      [true, false, false],
      [true, false, false],
    ];
    expect(countLiveNeighbors(fiveNeighbors, 1, 1)).toBe(5);
    expect(nextGeneration(fiveNeighbors, RULESETS.highlife)[1]![1]).toBe(false);

    const sixNeighbors: Grid = [
      [false, true, true],
      [true, false, true],
      [true, true, false],
    ];
    expect(countLiveNeighbors(sixNeighbors, 1, 1)).toBe(6);
    expect(nextGeneration(sixNeighbors, RULESETS.conway)[1]![1]).toBe(false);
    expect(nextGeneration(sixNeighbors, RULESETS.highlife)[1]![1]).toBe(true);
  });

  it("Seeds never lets a live cell survive", () => {
    const grid: Grid = [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ];
    expect(nextGeneration(grid, RULESETS.seeds)[1]![1]).toBe(false);
  });
});

describe("countLiveCells", () => {
  it("sums every alive cell", () => {
    const grid: Grid = [
      [true, false],
      [true, true],
    ];
    expect(countLiveCells(grid)).toBe(3);
  });
});

describe("areGridsEqual", () => {
  it("is true for grids with identical cell values", () => {
    const a = createEmptyGrid(2, 2);
    const b = toggleCell(createEmptyGrid(2, 2), 0, 0);
    const c = toggleCell(createEmptyGrid(2, 2), 0, 0);
    expect(areGridsEqual(a, b)).toBe(false);
    expect(areGridsEqual(b, c)).toBe(true);
  });
});

describe("getPatternSize", () => {
  it("measures the bounding box of a pattern's live-cell offsets", () => {
    expect(getPatternSize(PATTERNS.glider)).toEqual({ rows: 3, cols: 3 });
  });
});

describe("stampPattern", () => {
  it("places a pattern's live cells at the given origin", () => {
    const grid = stampPattern(createEmptyGrid(5, 5), PATTERNS.glider, 1, 1);
    expect(countLiveCells(grid)).toBe(PATTERNS.glider.length);
    for (const [row, col] of PATTERNS.glider) {
      expect(grid[1 + row]![1 + col]).toBe(true);
    }
  });

  it("wraps a pattern around the edges of the grid", () => {
    const grid = stampPattern(createEmptyGrid(3, 3), PATTERNS.glider, 2, 2);
    expect(countLiveCells(grid)).toBe(PATTERNS.glider.length);
  });

  it("doesn't mutate the grid passed in", () => {
    const grid = createEmptyGrid(5, 5);
    stampPattern(grid, PATTERNS.glider, 0, 0);
    expect(countLiveCells(grid)).toBe(0);
  });

  it("keeps cells already alive outside the pattern", () => {
    const grid = setCell(createEmptyGrid(5, 5), 4, 4, true);
    const result = stampPattern(grid, PATTERNS.glider, 0, 0);
    expect(result[4]![4]).toBe(true);
  });
});

describe("PATTERNS", () => {
  it("the pulsar is a stable period-3 oscillator", () => {
    const grid = stampPattern(createEmptyGrid(20, 20), PATTERNS.pulsar, 3, 3);
    const first = nextGeneration(grid);
    const second = nextGeneration(first);
    const third = nextGeneration(second);
    expect(areGridsEqual(grid, third)).toBe(true);
    expect(areGridsEqual(grid, first)).toBe(false);
  });

  it("the Gosper glider gun emits a glider every 30 generations", () => {
    let grid = stampPattern(
      createEmptyGrid(45, 60),
      PATTERNS.gosperGliderGun,
      0,
      0
    );
    const gunCellCount = PATTERNS.gosperGliderGun.length;
    for (let generation = 1; generation <= 30; generation++) {
      grid = nextGeneration(grid);
    }
    expect(countLiveCells(grid)).toBe(gunCellCount + 5);
  });
});

describe("classifySettlement", () => {
  it("is extinct once every cell has died", () => {
    const previous = toggleCell(createEmptyGrid(3, 3), 1, 1);
    const next = createEmptyGrid(3, 3);
    expect(classifySettlement(previous, next)).toBe("extinct");
  });

  it("is stable once the grid stops changing", () => {
    const previous: Grid = [
      [true, true],
      [true, true],
    ];
    const next: Grid = [
      [true, true],
      [true, true],
    ];
    expect(classifySettlement(previous, next)).toBe("stable");
  });

  it("is running when the grid is still alive and changing", () => {
    const previous = createEmptyGrid(7, 7);
    previous[3]![2] = true;
    previous[3]![3] = true;
    previous[3]![4] = true;
    const next = nextGeneration(previous);
    expect(classifySettlement(previous, next)).toBe("running");
  });
});
