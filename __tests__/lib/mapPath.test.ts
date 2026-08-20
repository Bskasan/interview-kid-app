import { MAP_COLUMN_X, MAP_ROW_HEIGHT } from '../../src/constants/map';
import { entryPath, exitPath, NODE_CENTER_Y, nodeCenterX, nodeColumn } from '../../src/lib/mapPath';

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
