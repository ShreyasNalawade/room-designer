import { formatMeasurement } from './units';

export const MIN_ROOM_DIMENSION_MM = 600; // 0.6 m / ~2 ft
export const MAX_ROOM_DIMENSION_MM = 40000; // 40 m / ~131 ft

/**
 * Validates room dimensions and returns errors and ergonomic warnings
 */
export function validateRoomDimensions(widthMm, lengthMm, unitKey = 'm') {
  const errors = [];
  const warnings = [];

  if (typeof widthMm !== 'number' || isNaN(widthMm) || widthMm <= 0) {
    errors.push('Width must be a positive number greater than zero.');
  } else if (widthMm < MIN_ROOM_DIMENSION_MM) {
    errors.push(`Width is too small. Minimum supported dimension is ${formatMeasurement(MIN_ROOM_DIMENSION_MM, unitKey)}.`);
  } else if (widthMm > MAX_ROOM_DIMENSION_MM) {
    errors.push(`Width exceeds maximum allowed boundary of ${formatMeasurement(MAX_ROOM_DIMENSION_MM, unitKey)}.`);
  }

  if (typeof lengthMm !== 'number' || isNaN(lengthMm) || lengthMm <= 0) {
    errors.push('Length must be a positive number greater than zero.');
  } else if (lengthMm < MIN_ROOM_DIMENSION_MM) {
    errors.push(`Length is too small. Minimum supported dimension is ${formatMeasurement(MIN_ROOM_DIMENSION_MM, unitKey)}.`);
  } else if (lengthMm > MAX_ROOM_DIMENSION_MM) {
    errors.push(`Length exceeds maximum allowed boundary of ${formatMeasurement(MAX_ROOM_DIMENSION_MM, unitKey)}.`);
  }

  if (errors.length === 0 && widthMm > 0 && lengthMm > 0) {
    const ratio = Math.max(widthMm / lengthMm, lengthMm / widthMm);
    if (ratio > 4.5) {
      warnings.push(`Extreme aspect ratio (${ratio.toFixed(1)}:1). Consider whether this is a hallway/corridor or a partitioned room.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
