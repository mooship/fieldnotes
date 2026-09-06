export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball extends Rect {
  vx: number;
  vy: number;
}

export interface Brick extends Rect {
  alive: boolean;
}

export interface BrickGridOptions {
  rows: number;
  cols: number;
  canvasWidth: number;
  offsetTop: number;
  brickHeight: number;
  padding: number;
}

export interface BrickCollisionResult {
  ball: Ball;
  bricks: Brick[];
  hit: boolean;
  scoreDelta: number;
}

export const BRICK_SCORE_VALUE = 10;

/**
Standard axis-aligned bounding box overlap test. Rectangles that only touch
at an edge, with zero overlapping area, don't count as intersecting.
*/
export function areRectsOverlapping(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
Lays out an alive `rows * cols` grid of bricks, flush with `padding` on all
sides and between bricks, starting at `offsetTop`.
*/
export function createBrickGrid({
  rows,
  cols,
  canvasWidth,
  offsetTop,
  brickHeight,
  padding,
}: BrickGridOptions): Brick[] {
  const brickWidth = (canvasWidth - padding * (cols + 1)) / cols;
  const bricks: Brick[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      bricks.push({
        x: padding + col * (brickWidth + padding),
        y: offsetTop + row * (brickHeight + padding),
        width: brickWidth,
        height: brickHeight,
        alive: true,
      });
    }
  }
  return bricks;
}

/**
Keeps the paddle's left edge within the canvas.
*/
export function clampPaddleX(
  x: number,
  paddleWidth: number,
  canvasWidth: number
): number {
  return Math.min(Math.max(x, 0), canvasWidth - paddleWidth);
}

/**
Bounces the ball off the left, right, and top edges of the canvas, leaving
it unchanged when it isn't touching any of them. The bottom edge isn't a
wall — falling past it is a lost life, checked separately by
`hasBallFallen`.
*/
export function reflectOffWalls(ball: Ball, canvasWidth: number): Ball {
  let { x, y, vx, vy } = ball;

  if (x <= 0) {
    x = 0;
    vx = Math.abs(vx);
  } else if (x + ball.width >= canvasWidth) {
    x = canvasWidth - ball.width;
    vx = -Math.abs(vx);
  }

  if (y <= 0) {
    y = 0;
    vy = Math.abs(vy);
  }

  if (x === ball.x && y === ball.y && vx === ball.vx && vy === ball.vy) {
    return ball;
  }
  return { ...ball, x, y, vx, vy };
}

/**
True once the ball has fully passed the bottom edge of the canvas.
*/
export function hasBallFallen(ball: Ball, canvasHeight: number): boolean {
  return ball.y > canvasHeight;
}

/**
Bounces the ball off the paddle, deflecting it left or right depending on
where along the paddle it landed (centre = straight back up, edges = an
angled return) so the player can aim. Only triggers while the ball is
travelling downward into the paddle, so an already-resolved bounce doesn't
get flipped again on the next frame while the two rects still overlap.
*/
export function reflectOffPaddle(ball: Ball, paddle: Rect): Ball {
  if (ball.vy <= 0 || !areRectsOverlapping(ball, paddle)) {
    return ball;
  }

  const ballCenter = ball.x + ball.width / 2;
  const paddleCenter = paddle.x + paddle.width / 2;
  const hitOffset = (ballCenter - paddleCenter) / (paddle.width / 2);

  return {
    ...ball,
    vy: -Math.abs(ball.vy),
    vx: hitOffset * Math.abs(ball.vy),
  };
}

/**
Finds the first alive brick the ball overlaps, destroys it, and bounces the
ball off whichever axis had the smaller overlap. Resolves at most one brick
per call, which is fine at normal ball speeds where two bricks are never
overlapped in the same frame.
*/
export function resolveBrickCollisions(
  ball: Ball,
  bricks: Brick[]
): BrickCollisionResult {
  const hitIndex = bricks.findIndex(
    (brick) => brick.alive && areRectsOverlapping(ball, brick)
  );
  if (hitIndex === -1) {
    return { ball, bricks, hit: false, scoreDelta: 0 };
  }

  const brick = bricks[hitIndex]!;
  const overlapX =
    Math.min(ball.x + ball.width, brick.x + brick.width) -
    Math.max(ball.x, brick.x);
  const overlapY =
    Math.min(ball.y + ball.height, brick.y + brick.height) -
    Math.max(ball.y, brick.y);

  const bouncedBall =
    overlapX < overlapY ? { ...ball, vx: -ball.vx } : { ...ball, vy: -ball.vy };

  const updatedBricks = bricks.map((current, index) =>
    index === hitIndex ? { ...current, alive: false } : current
  );

  return {
    ball: bouncedBall,
    bricks: updatedBricks,
    hit: true,
    scoreDelta: BRICK_SCORE_VALUE,
  };
}

/**
True once every brick in the grid has been destroyed.
*/
export function isBoardCleared(bricks: Brick[]): boolean {
  return bricks.every((brick) => !brick.alive);
}
