import { describe, expect, it } from "vitest";
import {
  countLiveCells,
  countLiveNeighbors,
  createEmptyGrid,
  type Grid,
  areGridsEqual,
  nextGeneration,
  randomizeGrid,
  setCell,
  toggleCell,
} from "./game-of-life";

describe("createEmptyGrid", () => {
  it("creates the requested dimensions, all dead", () => {
    const grid = createEmptyGrid(3, 4);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(4);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(
      true
    );
  });
});

describe("randomizeGrid", () => {
  it("fills every cell when the injected random always beats the threshold", () => {
    const grid = randomizeGrid(2, 2, 0.35, () => 0);
    expect(grid.every((row) => row.every((cell) => cell === true))).toBe(
      true
    );
  });

  it("leaves every cell dead when the injected random never beats the threshold", () => {
    const grid = randomizeGrid(2, 2, 0.35, () => 0.99);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(
      true
    );
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
