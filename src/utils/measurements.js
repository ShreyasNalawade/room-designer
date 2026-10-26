import { getItemCorners } from './collision';
import { formatMeasurement, calculateRoomMetrics } from './units';
import { getRoomWallDirections, getRoomHeadingAngle } from './orientation';

/**
 * Calculate accurate distance from an item's outer edges to the room's 4 walls (North, South, West, East)
 * Supports Rectangle, Square, and Trapezoid room shapes.
 *
 * Coordinates reference (room center is at 0, 0):
 * - North Wall: y = -lengthMm / 2
 * - South Wall: y = +lengthMm / 2
 * - West Wall: x = -widthMm / 2
 * - East Wall: x = +widthMm / 2
 */
export function calculateWallClearances(item, room, unitKey = 'm') {
  if (!item || !room) {
    return {
      northMm: 0,
      southMm: 0,
      westMm: 0,
      eastMm: 0,
      northStr: '0',
      southStr: '0',
      westStr: '0',
      eastStr: '0',
      itemWidthStr: '0',
      itemLengthStr: '0',
      boundingBox: { minX: 0, maxX: 0, minY: 0, maxY: 0, centerX: 0, centerY: 0 },
    };
  }

  const corners = getItemCorners(item);
  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));
  const minY = Math.min(...corners.map((c) => c.y));
  const maxY = Math.max(...corners.map((c) => c.y));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const roomLength = room.lengthMm || 4500;
  const halfL = roomLength / 2;
  const northWallY = -halfL;
  const southWallY = halfL;

  // Distance from item edges to the 4 physical room boundaries (top, bottom, left, right)
  const topDist = Math.round(minY - northWallY);
  const bottomDist = Math.round(southWallY - maxY);

  let leftDist;
  let rightDist;

  if (room.shape === 'trapezoid') {
    const topW = room.topWidthMm || 4000;
    const bottomW = room.bottomWidthMm || 6000;
    // Interpolate trapezoid width at item's vertical center
    const clampedY = Math.max(-halfL, Math.min(halfL, centerY));
    const t = (clampedY + halfL) / roomLength;
    const widthAtY = topW + t * (bottomW - topW);
    const leftWallX = -widthAtY / 2;
    const rightWallX = widthAtY / 2;

    leftDist = Math.round(minX - leftWallX);
    rightDist = Math.round(rightWallX - maxX);
  } else {
    const roomWidth = room.widthMm || 6000;
    const halfW = roomWidth / 2;
    leftDist = Math.round(minX - (-halfW));
    rightDist = Math.round(halfW - maxX);
  }

  // Dynamic cardinal mapping according to room's compass orientation
  const wallDirs = getRoomWallDirections(getRoomHeadingAngle(room));
  const distByCode = {
    [wallDirs.top.code]: topDist,
    [wallDirs.bottom.code]: bottomDist,
    [wallDirs.left.code]: leftDist,
    [wallDirs.right.code]: rightDist,
  };

  const northMm = distByCode['N'] ?? distByCode['NE'] ?? distByCode['NW'] ?? topDist;
  const southMm = distByCode['S'] ?? distByCode['SE'] ?? distByCode['SW'] ?? bottomDist;
  const westMm = distByCode['W'] ?? distByCode['NW'] ?? distByCode['SW'] ?? leftDist;
  const eastMm = distByCode['E'] ?? distByCode['NE'] ?? distByCode['SE'] ?? rightDist;

  const itemWidthMm = item.widthMm || 800;
  const itemLengthMm = item.depthMm || item.heightMm || 600;

  return {
    northMm,
    southMm,
    westMm,
    eastMm,
    topDist,
    bottomDist,
    leftDist,
    rightDist,
    wallDirs,
    northStr: formatMeasurement(northMm, unitKey),
    southStr: formatMeasurement(southMm, unitKey),
    westStr: formatMeasurement(westMm, unitKey),
    eastStr: formatMeasurement(eastMm, unitKey),
    topStr: formatMeasurement(topDist, unitKey),
    bottomStr: formatMeasurement(bottomDist, unitKey),
    leftStr: formatMeasurement(leftDist, unitKey),
    rightStr: formatMeasurement(rightDist, unitKey),
    itemWidthStr: formatMeasurement(itemWidthMm, unitKey),
    itemLengthStr: formatMeasurement(itemLengthMm, unitKey),
    boundingBox: { minX, maxX, minY, maxY, centerX, centerY },
  };
}

/**
 * Compute comprehensive room space utilization:
 * - Total Room Area
 * - Total Placed Furniture Area
 * - Remaining Free / Empty Floor Space Area
 * - Percentages of Free vs Occupied floor space
 */
export function calculateSpaceUtilization(room, items = [], unitKey = 'm') {
  const roomMetrics = calculateRoomMetrics(room, unitKey);
  const totalRoomAreaSqM = roomMetrics.sqMeters || 0;
  const totalRoomAreaSqFt = roomMetrics.sqFeet || 0;

  // Sum footprints of all placed items
  const occupiedAreaSqM = items.reduce((acc, item) => {
    const w = item.widthMm || 0;
    const d = item.depthMm || item.heightMm || 0;
    return acc + (w / 1000) * (d / 1000);
  }, 0);

  const roundedOccupiedSqM = Number(occupiedAreaSqM.toFixed(2));
  const roundedOccupiedSqFt = Number((occupiedAreaSqM * 10.7639104).toFixed(2));

  const freeSpaceSqM = Math.max(0, Number((totalRoomAreaSqM - occupiedAreaSqM).toFixed(2)));
  const freeSpaceSqFt = Math.max(0, Number((freeSpaceSqM * 10.7639104).toFixed(2)));

  const freeSpacePercent = totalRoomAreaSqM > 0
    ? Math.max(0, Math.min(100, Number(((freeSpaceSqM / totalRoomAreaSqM) * 100).toFixed(1))))
    : 100;
  const occupiedPercent = Number((100 - freeSpacePercent).toFixed(1));

  // Determine whether to highlight primary area in m² or sq ft based on unit
  const isImperial = unitKey === 'ft' || unitKey === 'in';
  const primaryAreaUnit = isImperial ? 'sq ft' : 'm²';
  const primaryFreeArea = isImperial ? freeSpaceSqFt : freeSpaceSqM;
  const primaryTotalArea = isImperial ? totalRoomAreaSqFt : totalRoomAreaSqM;
  const primaryOccupiedArea = isImperial ? roundedOccupiedSqFt : roundedOccupiedSqM;

  return {
    totalRoomAreaSqM,
    totalRoomAreaSqFt,
    occupiedAreaSqM: roundedOccupiedSqM,
    occupiedAreaSqFt: roundedOccupiedSqFt,
    occupiedSqFt: roundedOccupiedSqFt,
    freeSpaceSqM,
    freeSpaceSqFt,
    freeSpacePercent,
    occupiedPercent,
    primaryAreaUnit,
    primaryFreeArea,
    primaryTotalArea,
    primaryOccupiedArea,
    itemsCount: items.length,
  };
}
