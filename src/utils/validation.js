import { formatMeasurement } from './units';

export const MIN_ROOM_DIMENSION_MM = 600; // 0.6 m / ~2 ft
export const MAX_ROOM_DIMENSION_MM = 40000; // 40 m / ~131 ft

/**
 * Validates room dimensions and returns errors and ergonomic warnings
 * Supports Rectangle, Square, and Trapezoid room shapes.
 */
export function validateRoomDimensions(roomOrWidth, lengthMmOrUnit, optionalUnit) {
  const errors = [];
  const warnings = [];

  const isRoomObj = typeof roomOrWidth === 'object' && roomOrWidth !== null;
  const room = isRoomObj
    ? roomOrWidth
    : {
        shape: 'rectangle',
        widthMm: roomOrWidth,
        lengthMm: lengthMmOrUnit,
      };
  const unitKey = isRoomObj ? lengthMmOrUnit || 'm' : optionalUnit || 'm';

  const checkDim = (val, name) => {
    if (typeof val !== 'number' || isNaN(val) || val <= 0) {
      errors.push(`${name} must be a positive number greater than zero.`);
    } else if (val < MIN_ROOM_DIMENSION_MM) {
      errors.push(`${name} is too small. Minimum supported dimension is ${formatMeasurement(MIN_ROOM_DIMENSION_MM, unitKey)}.`);
    } else if (val > MAX_ROOM_DIMENSION_MM) {
      errors.push(`${name} exceeds maximum allowed boundary of ${formatMeasurement(MAX_ROOM_DIMENSION_MM, unitKey)}.`);
    }
  };

  if (room.shape === 'trapezoid') {
    checkDim(room.topWidthMm || 0, 'Top Width');
    checkDim(room.bottomWidthMm || 0, 'Bottom Width');
    checkDim(room.lengthMm || 0, 'Room Length (Height)');

    if (errors.length === 0) {
      const avgW = ((room.topWidthMm || 0) + (room.bottomWidthMm || 0)) / 2;
      const ratio = Math.max(avgW / room.lengthMm, room.lengthMm / avgW);
      if (ratio > 4.5) {
        warnings.push(`Extreme aspect ratio (${ratio.toFixed(1)}:1). Consider checking wall proportions.`);
      }
    }
  } else {
    checkDim(room.widthMm || 0, 'Width');
    checkDim(room.lengthMm || 0, 'Length');

    if (errors.length === 0 && room.widthMm > 0 && room.lengthMm > 0) {
      const ratio = Math.max(room.widthMm / room.lengthMm, room.lengthMm / room.widthMm);
      if (ratio > 4.5) {
        warnings.push(`Extreme aspect ratio (${ratio.toFixed(1)}:1). Consider whether this is a hallway/corridor or a partitioned room.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
