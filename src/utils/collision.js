/**
 * Compute the 4 rotated corner points of an item in room coordinates (mm)
 */
export function getItemCorners(item) {
  const w = item.widthMm || 500;
  const d = item.depthMm || item.heightMm || 500;
  const rad = ((item.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const cx = (item.x || 0) + w / 2;
  const cy = (item.y || 0) + d / 2;

  const halfW = w / 2;
  const halfD = d / 2;

  const localCorners = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
  ];

  return localCorners.map(([dx, dy]) => ({
    x: cx + (dx * cos - dy * sin),
    y: cy + (dx * sin + dy * cos),
  }));
}

/**
 * Separating Axis Theorem (SAT) to detect if two rotated convex polygons overlap
 */
export function doPolygonsIntersect(polyA, polyB) {
  const polygons = [polyA, polyB];

  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      // Perpendicular normal axis
      const normal = { x: -(p2.y - p1.y), y: p2.x - p1.x };

      // Project polyA
      let minA = Infinity;
      let maxA = -Infinity;
      for (const p of polyA) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minA) minA = projected;
        if (projected > maxA) maxA = projected;
      }

      // Project polyB
      let minB = Infinity;
      let maxB = -Infinity;
      for (const p of polyB) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minB) minB = projected;
        if (projected > maxB) maxB = projected;
      }

      // If there is an axis with a gap, they do not intersect
      if (maxA < minB || maxB < minA) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if a single point (x, y) is inside the room boundary
 */
export function isPointInsideRoom(px, py, room) {
  const shape = room.shape || 'rectangle';

  if (shape === 'trapezoid') {
    const topW = room.topWidthMm || 4000;
    const bottomW = room.bottomWidthMm || 6000;
    const length = room.lengthMm || 4500;
    const halfL = length / 2;

    if (py < -halfL || py > halfL) return false;

    // Linear interpolation of width based on Y position (-halfL to +halfL)
    const t = (py + halfL) / length;
    const allowedHalfW = (topW / 2) * (1 - t) + (bottomW / 2) * t;

    return Math.abs(px) <= allowedHalfW;
  }

  // Rectangle / Square
  const halfW = (room.widthMm || 6000) / 2;
  const halfL = (room.lengthMm || 4500) / 2;
  return px >= -halfW && px <= halfW && py >= -halfL && py <= halfL;
}

/**
 * Check if an item extends outside the room boundary
 */
export function isItemOutsideRoom(item, room) {
  const corners = getItemCorners(item);
  return corners.some((c) => !isPointInsideRoom(c.x, c.y, room));
}

/**
 * Check collisions and boundaries for all placed items
 * Returns: { outsideIds: Set, overlappingIds: Set }
 */
export function analyzeItemCollisions(items, room) {
  const outsideIds = new Set();
  const overlappingIds = new Set();

  if (!items || items.length === 0) {
    return { outsideIds, overlappingIds };
  }

  // 1. Check room boundaries
  for (const item of items) {
    if (isItemOutsideRoom(item, room)) {
      outsideIds.add(item.id);
    }
  }

  // 2. Check pairwise overlaps using SAT
  const cornersCache = items.map((item) => ({
    id: item.id,
    corners: getItemCorners(item),
  }));

  for (let i = 0; i < cornersCache.length; i++) {
    for (let j = i + 1; j < cornersCache.length; j++) {
      const a = cornersCache[i];
      const b = cornersCache[j];
      if (doPolygonsIntersect(a.corners, b.corners)) {
        overlappingIds.add(a.id);
        overlappingIds.add(b.id);
      }
    }
  }

  return { outsideIds, overlappingIds };
}
