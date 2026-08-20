import { MAP_COLUMN_X, MAP_ROW_HEIGHT } from '../../src/constants/map';
import {
  entryPath,
  exitPath,
  NODE_CENTER_Y,
  nodeAnchor,
  nodeCenterX,
  nodeColumn,
} from '../../src/lib/mapPath';

const WIDTH = 300;

describe('nodeColumn — serpentine cycle', () => {
  it('repeats left → center → right → center', () => {
    expect([0, 1, 2, 3, 4, 5].map(nodeColumn)).toEqual([
      'left',
      'center',
      'right',
      'center',
      'left',
      'center',
    ]);
  });

  it('keeps consecutive nodes in adjacent columns (no full-width jumps)', () => {
    for (let i = 0; i < 12; i += 1) {
      const gap = Math.abs(MAP_COLUMN_X[nodeColumn(i + 1)] - MAP_COLUMN_X[nodeColumn(i)]);
      expect(gap).toBeLessThanOrEqual(0.5 - MAP_COLUMN_X.left + 0.001);
    }
  });
});

describe('connector paths — per-row segments', () => {
  it('row 0 has no entry; last node has no exit', () => {
    expect(entryPath(0, WIDTH)).toBeNull();
    expect(exitPath(3, WIDTH, true)).toBeNull();
  });

  it('the entry curve starts at the previous column on the top edge and ends on this node', () => {
    const path = entryPath(1, WIDTH)!;
    expect(path.startsWith(`M ${nodeCenterX(0, WIDTH)} 0 `)).toBe(true);
    expect(path.endsWith(`${nodeCenterX(1, WIDTH)} ${NODE_CENTER_Y}`)).toBe(true);
  });

  it('the exit stub runs straight from the node to the row bottom in its own column', () => {
    const x = nodeCenterX(2, WIDTH);
    expect(exitPath(2, WIDTH, false)).toBe(`M ${x} ${NODE_CENTER_Y} L ${x} ${MAP_ROW_HEIGHT}`);
  });

  it('adjacent rows meet at the same x on the shared edge (no kink in the line)', () => {
    // Row i's exit ends at (x_i, ROW_HEIGHT); row i+1's entry starts at (x_i, 0).
    for (let i = 0; i < 8; i += 1) {
      const exitX = nodeCenterX(i, WIDTH);
      expect(entryPath(i + 1, WIDTH)!.startsWith(`M ${exitX} 0 `)).toBe(true);
    }
  });
});

describe('nodeAnchor — where a node sits in the viewport', () => {
  const PADDING = 16;

  it('offsets the column by the list padding and the row by the scroll position', () => {
    expect(nodeAnchor({ index: 0, width: WIDTH, padding: PADDING, scrollOffset: 0 })).toEqual({
      x: PADDING + nodeCenterX(0, WIDTH),
      y: NODE_CENTER_Y,
    });
    expect(nodeAnchor({ index: 3, width: WIDTH, padding: PADDING, scrollOffset: 0 }).y).toBe(
      3 * MAP_ROW_HEIGHT + NODE_CENTER_Y,
    );
  });

  it('moves a node up by exactly what has been scrolled past', () => {
    const resting = nodeAnchor({ index: 4, width: WIDTH, padding: PADDING, scrollOffset: 0 });
    const scrolled = nodeAnchor({ index: 4, width: WIDTH, padding: PADDING, scrollOffset: 150 });

    expect(scrolled.y).toBe(resting.y - 150);
    expect(scrolled.x).toBe(resting.x); // vertical list: scrolling never moves x
  });

  it('keeps a node scrolled exactly one row up in the previous row slot', () => {
    const first = nodeAnchor({ index: 1, width: WIDTH, padding: PADDING, scrollOffset: 0 });
    const second = nodeAnchor({
      index: 2,
      width: WIDTH,
      padding: PADDING,
      scrollOffset: MAP_ROW_HEIGHT,
    });

    expect(second.y).toBe(first.y);
  });
});
