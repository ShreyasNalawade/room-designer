import { UNITS } from '../constants/units';
import { getRoomWallDirections, getRoomHeadingAngle } from './orientation';

/**
 * Convert canonical millimeters (mm) into user-facing display units
 */
export function fromMm(mm, unitKey = 'm') {
  if (typeof mm !== 'number' || isNaN(mm)) return 0;
  const unit = UNITS[unitKey] || UNITS.m;
  const val = mm / unit.mmFactor;
  return Number(val.toFixed(unit.decimals));
}

/**
 * Convert user-entered display units into canonical millimeters (mm)
 */
export function toMm(val, unitKey = 'm') {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  const unit = UNITS[unitKey] || UNITS.m;
  return Math.round(val * unit.mmFactor);
}

/**
 * Format measurement with its unit symbol
 */
export function formatMeasurement(mm, unitKey = 'm') {
  const unit = UNITS[unitKey] || UNITS.m;
  const val = fromMm(mm, unitKey);
  return `${val.toLocaleString(undefined, { minimumFractionDigits: unit.decimals, maximumFractionDigits: unit.decimals })} ${unit.symbol}`;
}

/**
 * Compute real-world area in square meters and square feet
 */
export function calculateArea(widthMm, lengthMm) {
  if (!widthMm || !lengthMm || widthMm <= 0 || lengthMm <= 0) {
    return { sqMeters: 0, sqFeet: 0 };
  }
  const sqMeters = (widthMm / 1000) * (lengthMm / 1000);
  const sqFeet = sqMeters * 10.7639104;
  return {
    sqMeters: Number(sqMeters.toFixed(2)),
    sqFeet: Number(sqFeet.toFixed(2)),
  };
}

/**
 * Compute real-world perimeter
 */
export function calculatePerimeter(widthMm, lengthMm, unitKey = 'm') {
  if (!widthMm || !lengthMm || widthMm <= 0 || lengthMm <= 0) return 0;
  const perimeterMm = 2 * (widthMm + lengthMm);
  return fromMm(perimeterMm, unitKey);
}

/**
 * Compute comprehensive real-world area, perimeter, and wall segment metrics
 * supporting Rectangle, Square, and Trapezoid room shapes.
 */
export function calculateRoomMetrics(room, unitKey = 'm') {
  if (!room) {
    return {
      sqMeters: 0,
      sqFeet: 0,
      perimeterMm: 0,
      perimeterStr: '0 ' + (UNITS[unitKey]?.symbol || 'm'),
      walls: [],
    };
  }

  if (room.shape === 'trapezoid') {
    const topW = room.topWidthMm || 4000;
    const bottomW = room.bottomWidthMm || 6000;
    const length = room.lengthMm || 4500;

    const avgWidthMm = (topW + bottomW) / 2;
    const sqMeters = (avgWidthMm / 1000) * (length / 1000);
    const sqFeet = sqMeters * 10.7639104;

    const dx = Math.abs(bottomW - topW) / 2;
    const slantLen = Math.sqrt(length * length + dx * dx);
    const perimeterMm = topW + bottomW + 2 * slantLen;

    const wallDirs = getRoomWallDirections(getRoomHeadingAngle(room));

    return {
      sqMeters: Number(sqMeters.toFixed(2)),
      sqFeet: Number(sqFeet.toFixed(2)),
      perimeterMm,
      perimeterStr: formatMeasurement(perimeterMm, unitKey),
      walls: [
        { dir: `Top Wall (${wallDirs.top.label})`, len: topW, orient: 'Parallel', code: wallDirs.top.code },
        { dir: `Bottom Wall (${wallDirs.bottom.label})`, len: bottomW, orient: 'Parallel', code: wallDirs.bottom.code },
        { dir: `Left Wall (${wallDirs.left.label})`, len: Math.round(slantLen), orient: 'Slanted', code: wallDirs.left.code },
        { dir: `Right Wall (${wallDirs.right.label})`, len: Math.round(slantLen), orient: 'Slanted', code: wallDirs.right.code },
      ],
    };
  }

  // Rectangle or Square
  const widthMm = room.widthMm || 0;
  const lengthMm = room.lengthMm || 0;
  const sqMeters = (widthMm / 1000) * (lengthMm / 1000);
  const sqFeet = sqMeters * 10.7639104;
  const perimeterMm = 2 * (widthMm + lengthMm);
  const wallDirs = getRoomWallDirections(getRoomHeadingAngle(room));

  return {
    sqMeters: Number(sqMeters.toFixed(2)),
    sqFeet: Number(sqFeet.toFixed(2)),
    perimeterMm,
    perimeterStr: formatMeasurement(perimeterMm, unitKey),
    walls: [
      { dir: `Top Wall (${wallDirs.top.label})`, len: widthMm, orient: 'Horizontal', code: wallDirs.top.code },
      { dir: `Bottom Wall (${wallDirs.bottom.label})`, len: widthMm, orient: 'Horizontal', code: wallDirs.bottom.code },
      { dir: `Right Wall (${wallDirs.right.label})`, len: lengthMm, orient: 'Vertical', code: wallDirs.right.code },
      { dir: `Left Wall (${wallDirs.left.label})`, len: lengthMm, orient: 'Vertical', code: wallDirs.left.code },
    ],
  };
}
