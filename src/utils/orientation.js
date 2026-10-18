/**
 * Utility functions for architectural room orientation and compass directions.
 */

export const CARDINAL_DIRECTIONS = [
  { code: 'N', label: 'North', angle: 0 },
  { code: 'NE', label: 'North-East', angle: 45 },
  { code: 'E', label: 'East', angle: 90 },
  { code: 'SE', label: 'South-East', angle: 135 },
  { code: 'S', label: 'South', angle: 180 },
  { code: 'SW', label: 'South-West', angle: 225 },
  { code: 'W', label: 'West', angle: 270 },
  { code: 'NW', label: 'North-West', angle: 315 },
];

/**
 * Get cardinal direction metadata for a given angle in degrees (0..360)
 */
export function getHeadingDirection(degrees = 0) {
  const norm = ((degrees % 360) + 360) % 360;

  if (norm >= 337.5 || norm < 22.5) return { code: 'N', label: 'North', angle: norm };
  if (norm >= 22.5 && norm < 67.5) return { code: 'NE', label: 'North-East', angle: norm };
  if (norm >= 67.5 && norm < 112.5) return { code: 'E', label: 'East', angle: norm };
  if (norm >= 112.5 && norm < 157.5) return { code: 'SE', label: 'South-East', angle: norm };
  if (norm >= 157.5 && norm < 202.5) return { code: 'S', label: 'South', angle: norm };
  if (norm >= 202.5 && norm < 247.5) return { code: 'SW', label: 'South-West', angle: norm };
  if (norm >= 247.5 && norm < 292.5) return { code: 'W', label: 'West', angle: norm };
  return { code: 'NW', label: 'North-West', angle: norm };
}

/**
 * Rotate the room by a delta in degrees (e.g. +90, -90, +180)
 */
export function rotateRoom(room, deltaDeg = 90) {
  if (!room) return room;
  const currentRot = room.rotation || 0;
  const nextRot = (((currentRot + deltaDeg) % 360) + 360) % 360;
  return {
    ...room,
    rotation: nextRot,
  };
}

/**
 * Set room to an exact rotation angle
 */
export function setRoomRotation(room, targetDeg = 0) {
  if (!room) return room;
  const norm = (((targetDeg % 360) + 360) % 360);
  return {
    ...room,
    rotation: norm,
  };
}
