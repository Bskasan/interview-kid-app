export const BUBBLE_MAX_WIDTH = 340;
export const POINTER_SIZE = 16;
/**
 * Worst-case bubble height, used to decide above/below placement and to keep
 * the Start button inside the viewport: 2×16 padding + 52 header (thumbnail /
 * two-line title / stars) + 12 gap + 60 button, plus slack for the capped
 * font growth. Over-estimating only flips the bubble upwards a little sooner;
 * under-estimating puts the primary action off-screen with no way to scroll
 * to it (a scroll closes the bubble).
 */
export const PLACEMENT_ESTIMATE = 240;
