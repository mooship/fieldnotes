import { describe, expect, it } from "vitest";
import {
  areRectsOverlapping,
  type Ball,
  type Brick,
  BRICK_SCORE_VALUE,
  clampPaddleX,
  createBrickGrid,
  hasBallFallen,
  isBoardCleared,
  reflectOffPaddle,
  reflectOffWalls,
  resolveBrickCollisions,
} from "./breakout";

describe("areRectsOverlapping", () => {
  it("is true for overlapping rectangles", () => {
    expect(
      areRectsOverlapping(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 10, height: 10 }
      )
    ).toBe(true);
  });

  it("is false for separated rectangles", () => {
    expect(
      areRectsOverlapping(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 20, width: 10, height: 10 }
      )
    ).toBe(false);
  });

  it("is false for rectangles that only touch at an edge", () => {
    expect(
      areRectsOverlapping(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 }
      )
    ).toBe(false);
  });
});

describe("createBrickGrid", () => {
  it("creates rows * cols alive bricks", () => {
    const bricks = createBrickGrid({
      rows: 3,
      cols: 4,
      canvasWidth: 480,
      offsetTop: 40,
      brickHeight: 16,
      padding: 8,
    });
    expect(bricks).toHaveLength(12);
    expect(bricks.every((brick) => brick.alive)).toBe(true);
  });

  it("positions the first brick at the top-left padding offset", () => {
    const [first] = createBrickGrid({
      rows: 1,
      cols: 2,
      canvasWidth: 200,
      offsetTop: 40,
      brickHeight: 16,
      padding: 8,
    });
    expect(first).toMatchObject({ x: 8, y: 40 });
  });

  it("fits the last column within the canvas width", () => {
    const canvasWidth = 200;
    const padding = 8;
    const bricks = createBrickGrid({
      rows: 1,
      cols: 3,
      canvasWidth,
      offsetTop: 40,
      brickHeight: 16,
      padding,
    });
    const last = bricks.at(-1)!;
    expect(last.x + last.width).toBeCloseTo(canvasWidth - padding, 5);
  });
});

describe("clampPaddleX", () => {
  it("clamps below zero to zero", () => {
    expect(clampPaddleX(-20, 60, 480)).toBe(0);
  });

  it("clamps beyond the right edge", () => {
    expect(clampPaddleX(500, 60, 480)).toBe(420);
  });

  it("leaves an in-range value unchanged", () => {
    expect(clampPaddleX(200, 60, 480)).toBe(200);
  });
});

describe("reflectOffWalls", () => {
  const canvasWidth = 480;

  it("bounces off the left wall", () => {
    const ball: Ball = { x: -2, y: 100, width: 10, height: 10, vx: -5, vy: 3 };
    const result = reflectOffWalls(ball, canvasWidth);
    expect(result.x).toBe(0);
    expect(result.vx).toBe(5);
  });

  it("bounces off the right wall", () => {
    const ball: Ball = {
      x: 475,
      y: 100,
      width: 10,
      height: 10,
      vx: 5,
      vy: 3,
    };
    const result = reflectOffWalls(ball, canvasWidth);
    expect(result.x).toBe(canvasWidth - 10);
    expect(result.vx).toBe(-5);
  });

  it("bounces off the top wall", () => {
    const ball: Ball = { x: 100, y: -1, width: 10, height: 10, vx: 5, vy: -3 };
    const result = reflectOffWalls(ball, canvasWidth);
    expect(result.y).toBe(0);
    expect(result.vy).toBe(3);
  });

  it("leaves a ball mid-court unchanged", () => {
    const ball: Ball = { x: 100, y: 100, width: 10, height: 10, vx: 5, vy: 3 };
    expect(reflectOffWalls(ball, canvasWidth)).toEqual(ball);
  });
});

describe("hasBallFallen", () => {
  it("is false while the ball is within the canvas", () => {
    const ball: Ball = { x: 0, y: 350, width: 10, height: 10, vx: 0, vy: 5 };
    expect(hasBallFallen(ball, 360)).toBe(false);
  });

  it("is true once the ball passes the bottom edge", () => {
    const ball: Ball = { x: 0, y: 361, width: 10, height: 10, vx: 0, vy: 5 };
    expect(hasBallFallen(ball, 360)).toBe(true);
  });
});

describe("reflectOffPaddle", () => {
  const paddle = { x: 200, y: 340, width: 80, height: 10 };

  it("bounces upward off the paddle centre with no horizontal deflection", () => {
    const ball: Ball = {
      x: 235,
      y: 335,
      width: 10,
      height: 10,
      vx: 0,
      vy: 200,
    };
    const result = reflectOffPaddle(ball, paddle);
    expect(result.vy).toBeLessThan(0);
    expect(result.vx).toBeCloseTo(0, 5);
  });

  it("deflects to the right when hit near the paddle's right edge", () => {
    const ball: Ball = {
      x: 270,
      y: 335,
      width: 10,
      height: 10,
      vx: 0,
      vy: 200,
    };
    const result = reflectOffPaddle(ball, paddle);
    expect(result.vx).toBeGreaterThan(0);
  });

  it("does nothing when the ball isn't overlapping the paddle", () => {
    const ball: Ball = { x: 0, y: 0, width: 10, height: 10, vx: 0, vy: 200 };
    expect(reflectOffPaddle(ball, paddle)).toEqual(ball);
  });

  it("does nothing when the ball is already moving upward", () => {
    const ball: Ball = {
      x: 235,
      y: 335,
      width: 10,
      height: 10,
      vx: 0,
      vy: -200,
    };
    expect(reflectOffPaddle(ball, paddle)).toEqual(ball);
  });
});

function makeBricks(): Brick[] {
  return [
    { x: 0, y: 0, width: 20, height: 10, alive: true },
    { x: 20, y: 0, width: 20, height: 10, alive: true },
  ];
}

describe("resolveBrickCollisions", () => {
  it("kills the first brick the ball overlaps and flips its vertical velocity", () => {
    const ball: Ball = { x: 5, y: 5, width: 8, height: 8, vx: 3, vy: -5 };
    const result = resolveBrickCollisions(ball, makeBricks());
    expect(result.hit).toBe(true);
    expect(result.scoreDelta).toBe(BRICK_SCORE_VALUE);
    expect(result.bricks[0]!.alive).toBe(false);
    expect(result.bricks[1]!.alive).toBe(true);
    expect(result.ball.vy).toBe(5);
  });

  it("leaves everything untouched when the ball hits nothing", () => {
    const ball: Ball = { x: 500, y: 500, width: 8, height: 8, vx: 3, vy: -5 };
    const bricks = makeBricks();
    const result = resolveBrickCollisions(ball, bricks);
    expect(result.hit).toBe(false);
    expect(result.scoreDelta).toBe(0);
    expect(result.ball).toEqual(ball);
    expect(result.bricks).toEqual(bricks);
  });

  it("ignores bricks already destroyed", () => {
    const bricks = makeBricks();
    bricks[0]!.alive = false;
    const ball: Ball = { x: 25, y: 5, width: 8, height: 8, vx: 3, vy: -5 };
    const result = resolveBrickCollisions(ball, bricks);
    expect(result.hit).toBe(true);
    expect(result.bricks[1]!.alive).toBe(false);
  });
});

describe("isBoardCleared", () => {
  it("is false when any brick is alive", () => {
    expect(
      isBoardCleared([{ x: 0, y: 0, width: 1, height: 1, alive: true }])
    ).toBe(false);
  });

  it("is true once every brick is destroyed", () => {
    expect(
      isBoardCleared([
        { x: 0, y: 0, width: 1, height: 1, alive: false },
        { x: 1, y: 0, width: 1, height: 1, alive: false },
      ])
    ).toBe(true);
  });
});
