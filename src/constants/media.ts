/**
 * Sample media URLs for the exercise flow (real lesson content is out of scope).
 */

/**
 * Short sample clip (~10 s, H.264 mp4) standing in for real lesson videos.
 * Google's classic gtv-videos-bucket samples (ForBiggerBlazes etc.) started
 * returning 403 in 2026 and even current Expo docs still point at them —
 * test-videos.co.uk exists specifically to host stable test media.
 * If this ever dies, the exercise flow degrades gracefully by design:
 * error message + unlocked quiz CTA.
 */
export const LESSON_VIDEO_URL =
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';
