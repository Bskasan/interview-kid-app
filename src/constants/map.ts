/**
 * Layout values for the exercises progress map: node size, fixed row height
 * (keeps FlatList getItemLayout measurement-free) and the serpentine column
 * positions as fractions of the row width.
 */
export const MAP_NODE_SIZE = 72;
export const MAP_ROW_HEIGHT = 116;

/** Horizontal node-center positions, as fractions of the map's content width. */
export const MAP_COLUMN_X = { left: 0.22, center: 0.5, right: 0.78 } as const;

/** Stroke width of the path line connecting nodes. */
export const MAP_CONNECTOR_WIDTH = 5;
