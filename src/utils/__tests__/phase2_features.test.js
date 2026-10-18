import { describe, it, expect, beforeEach } from 'vitest';
import { FURNITURE_CATALOG } from '../../constants/catalog';
import { calculateRoomMetrics } from '../units';
import { validateRoomDimensions } from '../validation';
import {
  getItemCorners,
  isItemOutsideRoom,
  analyzeItemCollisions,
} from '../collision';
import { saveDesign, loadDesign, clearSavedDesign } from '../storage';

describe('Furniture Catalog Definitions', () => {
  it('contains items for all required categories', () => {
    const requiredCats = ['bedroom', 'living', 'dining', 'office', 'kitchen', 'bathroom', 'storage', 'openings'];
    const catalogCats = new Set(FURNITURE_CATALOG.map((i) => i.category));

    requiredCats.forEach((cat) => {
      expect(catalogCats.has(cat)).toBe(true);
    });
  });

  it('all catalog items have positive architectural dimensions and stable IDs', () => {
    FURNITURE_CATALOG.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.widthMm).toBeGreaterThan(0);
      expect(item.depthMm).toBeGreaterThan(0);
      expect(item.symbol).toBeDefined();
    });
  });
});

describe('Trapezoid Room Geometry & Calculations', () => {
  it('correctly calculates area for an isosceles trapezoid', () => {
    // Top width 4m, Bottom width 6m, Length 4.5m
    // Average width = 5m, Area = 5m * 4.5m = 22.5 m²
    const room = {
      shape: 'trapezoid',
      topWidthMm: 4000,
      bottomWidthMm: 6000,
      lengthMm: 4500,
    };
    const metrics = calculateRoomMetrics(room, 'm');
    expect(metrics.sqMeters).toBe(22.5);
    expect(metrics.sqFeet).toBe(242.19);
  });

  it('calculates perimeter including both slanted side walls', () => {
    // Top width 4000, Bottom width 6000 (dx = 1000)
    // Height = 4500
    // Slant = sqrt(4500^2 + 1000^2) = sqrt(20250000 + 1000000) = sqrt(21250000) ≈ 4609.77 mm
    // Total perimeter = 4000 + 6000 + 2 * 4609.77 ≈ 19219.5 mm ≈ 19.22 m
    const room = {
      shape: 'trapezoid',
      topWidthMm: 4000,
      bottomWidthMm: 6000,
      lengthMm: 4500,
    };
    const metrics = calculateRoomMetrics(room, 'm');
    expect(metrics.perimeterMm).toBeGreaterThan(19200);
    expect(metrics.perimeterMm).toBeLessThan(19250);
  });

  it('validates trapezoid dimensions within acceptable bounds', () => {
    const valid = validateRoomDimensions({
      shape: 'trapezoid',
      topWidthMm: 4000,
      bottomWidthMm: 6000,
      lengthMm: 4500,
    }, 'm');
    expect(valid.isValid).toBe(true);
    expect(valid.errors.length).toBe(0);

    const invalid = validateRoomDimensions({
      shape: 'trapezoid',
      topWidthMm: 100, // below 600mm
      bottomWidthMm: 6000,
      lengthMm: 4500,
    }, 'm');
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors[0]).toContain('too small');
  });
});

describe('Rotated Item Geometry & Collision Detection', () => {
  const room = {
    shape: 'rectangle',
    widthMm: 6000,
    lengthMm: 4000,
  };

  it('computes rotated corners accurately', () => {
    const item = {
      x: 0,
      y: 0,
      widthMm: 1000,
      depthMm: 500,
      rotation: 90,
    };
    const corners = getItemCorners(item);
    expect(corners.length).toBe(4);
  });

  it('detects when an item is safely inside the room', () => {
    const item = {
      x: -500,
      y: -500,
      widthMm: 1000,
      depthMm: 800,
      rotation: 0,
    };
    expect(isItemOutsideRoom(item, room)).toBe(false);
  });

  it('detects when an item extends beyond room boundaries', () => {
    const item = {
      x: 2800, // room half-width is 3000, item width 1000 extends to 3800
      y: 0,
      widthMm: 1000,
      depthMm: 800,
      rotation: 0,
    };
    expect(isItemOutsideRoom(item, room)).toBe(true);
  });

  it('detects overlapping furniture using SAT', () => {
    const itemA = {
      id: 'a',
      x: 0,
      y: 0,
      widthMm: 1000,
      depthMm: 1000,
      rotation: 0,
    };
    const itemB = {
      id: 'b',
      x: 500, // overlaps half of itemA
      y: 500,
      widthMm: 1000,
      depthMm: 1000,
      rotation: 0,
    };
    const { overlappingIds } = analyzeItemCollisions([itemA, itemB], room);
    expect(overlappingIds.has('a')).toBe(true);
    expect(overlappingIds.has('b')).toBe(true);
  });

  it('detects separated furniture as non-overlapping', () => {
    const itemA = {
      id: 'a',
      x: -2000,
      y: -1000,
      widthMm: 800,
      depthMm: 800,
      rotation: 0,
    };
    const itemB = {
      id: 'b',
      x: 1000,
      y: 1000,
      widthMm: 800,
      depthMm: 800,
      rotation: 0,
    };
    const { overlappingIds } = analyzeItemCollisions([itemA, itemB], room);
    expect(overlappingIds.size).toBe(0);
  });
});

describe('LocalStorage Persistence', () => {
  beforeEach(() => {
    clearSavedDesign();
  });

  it('saves and loads design successfully', () => {
    const testRoom = {
      shape: 'rectangle',
      widthMm: 5000,
      lengthMm: 4000,
    };
    const testItems = [
      { id: 'item-1', name: 'King Bed', widthMm: 1800, depthMm: 2000 },
    ];

    const saveRes = saveDesign(testRoom, testItems, 'm');
    expect(saveRes.success).toBe(true);

    const loaded = loadDesign();
    expect(loaded).toBeDefined();
    expect(loaded.room.widthMm).toBe(5000);
    expect(loaded.items.length).toBe(1);
    expect(loaded.items[0].name).toBe('King Bed');
  });

  it('clears design from localStorage', () => {
    saveDesign({ widthMm: 5000 }, [], 'm');
    clearSavedDesign();
    expect(loadDesign()).toBeNull();
  });
});
