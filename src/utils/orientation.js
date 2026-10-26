/**
 * Utility functions for architectural room orientation, compass directions,
 * wall cardinal alignments, and full layout transformations.
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
  const norm = (((degrees % 360) + 360) % 360);

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
 * Calculate the cardinal directions for each of the 4 room walls (top, right, bottom, left)
 * based on the room's orientation angle (rotation in degrees).
 *
 * At rotation = 0° (Standard North Up):
 * - Top Wall: North (0°)
 * - Right Wall: East (90°)
 * - Bottom Wall: South (180°)
 * - Left Wall: West (270°)
 *
 * When rotation changes by angle θ:
 * - Top Wall: (0 + θ)°
 * - Right Wall: (90 + θ)°
 * - Bottom Wall: (180 + θ)°
 * - Left Wall: (270 + θ)°
 */
export function getRoomWallDirections(headingAngle = 0) {
  const norm = (((headingAngle % 360) + 360) % 360);
  return {
    top: getHeadingDirection((0 + norm) % 360),
    right: getHeadingDirection((90 + norm) % 360),
    bottom: getHeadingDirection((180 + norm) % 360),
    left: getHeadingDirection((270 + norm) % 360),
  };
}

/**
 * Calculate the required room rotation angle so that a specific wall
 * (e.g. 'bottom', 'top', 'left', 'right') faces a desired target direction
 * (e.g. 'W', 'N', 'E', 'S' or degrees).
 *
 * Example: To make the Bottom wall face West (270°):
 * baseAngle of bottom is 180°.
 * (270 - 180) = 90°.
 * Setting rotation to 90° aligns Bottom Wall to West!
 */
export function getRotationForWallDirection(wall = 'bottom', targetDirection = 'W') {
  const targetAngle = typeof targetDirection === 'number'
    ? targetDirection
    : (CARDINAL_DIRECTIONS.find(
        (d) => d.code === targetDirection || d.label.toLowerCase() === String(targetDirection).toLowerCase()
      )?.angle ?? 0);

  const baseWallAngles = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
  };

  const baseAngle = baseWallAngles[wall] ?? 180;
  const neededRotation = (((targetAngle - baseAngle) % 360) + 360) % 360;
  return neededRotation;
}

/**
 * Extract active compass heading angle from room (supports compassHeading or rotation)
 */
export function getRoomHeadingAngle(room) {
  if (!room) return 0;
  if (typeof room.compassHeading === 'number') return room.compassHeading;
  return room.rotation || 0;
}

/**
 * Set room cardinal compass direction angle (e.g. to set Kitchen/Bottom Wall to West)
 */
export function setCompassHeading(room, targetDeg = 0) {
  if (!room) return room;
  const norm = (((targetDeg % 360) + 360) % 360);
  return {
    ...room,
    compassHeading: norm,
  };
}

/**
 * Rotate the room orientation by a delta in degrees (e.g. +90, -90, +180)
 */
export function rotateRoom(room, deltaDeg = 90) {
  if (!room) return room;
  const currentRot = room.rotation || 0;
  const nextRot = (((currentRot + deltaDeg) % 360) + 360) % 360;
  const curHeading = getRoomHeadingAngle(room);
  const nextHeading = (((curHeading + deltaDeg) % 360) + 360) % 360;
  return {
    ...room,
    rotation: nextRot,
    compassHeading: nextHeading,
  };
}

/**
 * Set room to an exact orientation rotation angle
 */
export function setRoomRotation(room, targetDeg = 0) {
  if (!room) return room;
  const norm = (((targetDeg % 360) + 360) % 360);
  return {
    ...room,
    rotation: norm,
    compassHeading: norm,
  };
}

/**
 * Physically rotate the entire floor plan layout (room dimensions + all placed items).
 * Used when the user wants to physically rotate the drawing on the canvas by 90° or 180°.
 */
export function rotatePhysicalLayout(room, items = [], deltaDeg = 90) {
  if (!room) return { room, items };

  const normDelta = (((deltaDeg % 360) + 360) % 360);
  if (normDelta === 0) return { room, items };

  const rad = (normDelta * Math.PI) / 180;
  const isQuarterTurn = normDelta === 90 || normDelta === 270;

  // 1. Transform room geometry
  let updatedRoom = { ...room };
  if (isQuarterTurn && room.shape !== 'trapezoid') {
    updatedRoom.widthMm = room.lengthMm || 4500;
    updatedRoom.lengthMm = room.widthMm || 6000;
  } else if (normDelta === 180 && room.shape === 'trapezoid') {
    // Upside down trapezoid: swap top and bottom widths
    updatedRoom.topWidthMm = room.bottomWidthMm || 6000;
    updatedRoom.bottomWidthMm = room.topWidthMm || 4000;
  }

  // 2. Rotate each placed item around origin (0, 0)
  const updatedItems = items.map((it) => {
    const rx = Math.round(it.x * Math.cos(rad) - it.y * Math.sin(rad));
    const ry = Math.round(it.x * Math.sin(rad) + it.y * Math.cos(rad));
    const rRot = (((it.rotation || 0) + normDelta) % 360 + 360) % 360;
    return {
      ...it,
      x: rx,
      y: ry,
      rotation: rRot,
    };
  });

  return {
    room: updatedRoom,
    items: updatedItems,
  };
}

/**
 * Physically mirror / flip the floor plan layout across X or Y axis.
 */
export function flipPhysicalLayout(room, items = [], axis = 'horizontal') {
  if (!room) return { room, items };

  let updatedRoom = { ...room };

  if (axis === 'vertical' && room.shape === 'trapezoid') {
    // Invert trapezoid top and bottom
    updatedRoom.topWidthMm = room.bottomWidthMm || 6000;
    updatedRoom.bottomWidthMm = room.topWidthMm || 4000;
  }

  const updatedItems = items.map((it) => {
    let nx = it.x;
    let ny = it.y;
    let nRot = it.rotation || 0;

    if (axis === 'horizontal') {
      // Mirror X -> -X
      nx = -it.x;
      nRot = (((360 - nRot) % 360) + 360) % 360;
    } else {
      // Mirror Y -> -Y
      ny = -it.y;
      nRot = (((180 - nRot) % 360) + 360) % 360;
    }

    return {
      ...it,
      x: nx,
      y: ny,
      rotation: nRot,
    };
  });

  return {
    room: updatedRoom,
    items: updatedItems,
  };
}
