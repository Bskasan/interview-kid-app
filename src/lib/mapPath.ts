/**
 * Pure geometry for the winding lesson map: which column a node sits in and
 * the SVG path segments each row draws for its own connector, so FlatList
 * virtualization never needs cross-row measurement.
 */
import { MAP_COLUMN_X, MAP_NODE_SIZE, MAP_ROW_HEIGHT } from '@/constants/map';

type MapColumn = keyof typeof MAP_COLUMN_X;

// left → center → right → center → left …: consecutive nodes always sit in
// adjacent columns, so no connector ever has to cross the full width.
const COLUMN_CYCLE: readonly MapColumn[] = ['left', 'center', 'right', 'center'];

export function nodeColumn(index: number): MapColumn {
  return COLUMN_CYCLE[index % COLUMN_CYCLE.length] as MapColumn;
}

/** A node's center x for a given content width. */
export function nodeCenterX(index: number, width: number): number {
  return Math.round(width * MAP_COLUMN_X[nodeColumn(index)]);
}

/** Every node's center y inside its own row. */
export const NODE_CENTER_Y = Math.round((MAP_ROW_HEIGHT - MAP_NODE_SIZE) / 2 + MAP_NODE_SIZE / 2);

/**
 * The curve a row draws from its top edge down to its own node. It starts at
 * the PREVIOUS node's column with a vertical tangent, so it joins the previous
 * row's straight exit stub without a kink. Row 0 draws none.
 */
export function entryPath(index: number, width: number): string | null {
  if (index <= 0) {
    return null;
  }
  const fromX = nodeCenterX(index - 1, width);
  const toX = nodeCenterX(index, width);
  const bend = Math.round(NODE_CENTER_Y * 0.9);
  return `M ${fromX} 0 C ${fromX} ${bend}, ${toX} ${NODE_CENTER_Y - bend}, ${toX} ${NODE_CENTER_Y}`;
}

/**
 * Where a node's centre sits in the map viewport, given how far the list has
 * scrolled. Computed rather than measured: rows are fixed-height, so this is
 * exact, and it cannot hand back a stale frame the way an async native
 * measurement can. `padding` is the list's horizontal content padding.
 */
export function nodeAnchor(args: {
  index: number;
  width: number;
  padding: number;
  scrollOffset: number;
}): { x: number; y: number } {
  return {
    x: args.padding + nodeCenterX(args.index, args.width),
    y: args.index * MAP_ROW_HEIGHT + NODE_CENTER_Y - args.scrollOffset,
  };
}

/**
 * The straight stub a row draws from its node down to its bottom edge, where
 * the next row's entry curve picks it up. The last loaded node draws none.
 */
export function exitPath(index: number, width: number, isLast: boolean): string | null {
  if (isLast) {
    return null;
  }
  const x = nodeCenterX(index, width);
  return `M ${x} ${NODE_CENTER_Y} L ${x} ${MAP_ROW_HEIGHT}`;
}
