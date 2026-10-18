import { describe, it, expect } from 'vitest';
import { calculateWallClearances, calculateSpaceUtilization } from '../measurements';

describe('Wall Clearances & Positioning Calculations', () => {
  const room = {
    shape: 'rectangle',
    widthMm: 6000,
    lengthMm: 4000,
  };

  it('calculates accurate distances to North, South, West, and East walls', () => {
    // Room bounds: X in [-3000, 3000], Y in [-2000, 2000]
    // A bed placed at x = -1000, y = -1500 with width = 1600, depth = 2000, rotation = 0
    // Bed bounds: X in [-1000, 600], Y in [-1500, 500]
    const bed = {
      id: 'bed_1',
      name: 'Queen Bed',
      x: -1000,
      y: -1500,
      widthMm: 1600,
      depthMm: 2000,
      rotation: 0,
    };

    const clearances = calculateWallClearances(bed, room, 'm');

    // North wall is at y = -2000. Bed top is at y = -1500.
    // Distance = -1500 - (-2000) = 500 mm = 0.50 m
    expect(clearances.northMm).toBe(500);
    expect(clearances.northStr).toContain('0.50 m');

    // South wall is at y = 2000. Bed bottom is at y = 500.
    // Distance = 2000 - 500 = 1500 mm = 1.50 m
    expect(clearances.southMm).toBe(1500);
    expect(clearances.southStr).toContain('1.50 m');

    // West wall is at x = -3000. Bed left is at x = -1000.
    // Distance = -1000 - (-3000) = 2000 mm = 2.00 m
    expect(clearances.westMm).toBe(2000);
    expect(clearances.westStr).toContain('2.00 m');

    // East wall is at x = 3000. Bed right is at x = 600.
    // Distance = 3000 - 600 = 2400 mm = 2.40 m
    expect(clearances.eastMm).toBe(2400);
    expect(clearances.eastStr).toContain('2.40 m');

    // Component dimensions
    expect(clearances.itemWidthStr).toContain('1.60 m');
    expect(clearances.itemLengthStr).toContain('2.00 m');
  });

  it('calculates wall clearances for a Trapezoid room', () => {
    const trapezoidRoom = {
      shape: 'trapezoid',
      topWidthMm: 4000,
      bottomWidthMm: 6000,
      lengthMm: 4000,
    };

    // Item centered vertically at y = 0
    const desk = {
      id: 'desk_1',
      x: -600,
      y: -400,
      widthMm: 1200,
      depthMm: 800,
      rotation: 0,
    };

    const clearances = calculateWallClearances(desk, trapezoidRoom, 'm');
    // Top wall is at y = -2000, desk top is at y = -400. Distance = 1600mm
    expect(clearances.northMm).toBe(1600);
    // Bottom wall is at y = 2000, desk bottom is at y = 400. Distance = 1600mm
    expect(clearances.southMm).toBe(1600);
    // At y = 0, trapezoid width is (4000 + 6000) / 2 = 5000mm. Half width = 2500mm
    // Desk left is at -600. Left wall is at -2500. Distance = 1900mm
    expect(clearances.westMm).toBe(1900);
    // Desk right is at 600. Right wall is at 2500. Distance = 1900mm
    expect(clearances.eastMm).toBe(1900);
  });
});

describe('Space Utilization & Remaining Empty Space Area', () => {
  const room = {
    shape: 'rectangle',
    widthMm: 6000,
    lengthMm: 4000,
  };
  // Total room area = 6m * 4m = 24 m²

  it('computes 100% free space for an empty room', () => {
    const util = calculateSpaceUtilization(room, [], 'm');
    expect(util.totalRoomAreaSqM).toBe(24);
    expect(util.occupiedAreaSqM).toBe(0);
    expect(util.freeSpaceSqM).toBe(24);
    expect(util.freeSpacePercent).toBe(100);
    expect(util.occupiedPercent).toBe(0);
  });

  it('computes remaining free space after placing furniture', () => {
    const items = [
      // Bed: 2.0m x 1.8m = 3.6 m²
      { widthMm: 2000, depthMm: 1800 },
      // Desk: 1.2m x 0.8m = 0.96 m²
      { widthMm: 1200, depthMm: 800 },
    ];
    // Total occupied = 3.6 + 0.96 = 4.56 m²
    // Free space = 24 - 4.56 = 19.44 m²
    // Free percentage = 19.44 / 24 = 81%

    const util = calculateSpaceUtilization(room, items, 'm');
    expect(util.totalRoomAreaSqM).toBe(24);
    expect(util.occupiedAreaSqM).toBe(4.56);
    expect(util.freeSpaceSqM).toBe(19.44);
    expect(util.freeSpacePercent).toBe(81);
    expect(util.occupiedPercent).toBe(19);
    expect(util.itemsCount).toBe(2);
  });

  it('supports imperial units (sq ft) accurately', () => {
    const items = [{ widthMm: 2000, depthMm: 1800 }]; // 3.6 m²
    const util = calculateSpaceUtilization(room, items, 'ft');
    expect(util.primaryAreaUnit).toBe('sq ft');
    expect(util.freeSpaceSqFt).toBeGreaterThan(200);
    expect(util.occupiedSqFt).toBeCloseTo(38.75, 1);
  });
});
