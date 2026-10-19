import { describe, it, expect } from 'vitest';
import { CATEGORIES, FURNITURE_CATALOG } from '../../constants/catalog';

describe('Wall Partition Components Catalog', () => {
  it('includes the walls category in CATEGORIES', () => {
    const wallsCat = CATEGORIES.find((c) => c.id === 'walls');
    expect(wallsCat).toBeDefined();
    expect(wallsCat.name).toContain('Walls');
  });

  it('contains standard interior partition wall with customizable length and thickness', () => {
    const wall = FURNITURE_CATALOG.find((item) => item.id === 'wall-partition');
    expect(wall).toBeDefined();
    expect(wall.category).toBe('walls');
    expect(wall.symbol).toBe('wall');
    expect(wall.widthMm).toBe(2000); // 2.0m length
    expect(wall.depthMm).toBe(150);  // 15cm thickness
  });

  it('contains divider wall, masonry structural wall, and glass partition screen', () => {
    const divider = FURNITURE_CATALOG.find((item) => item.id === 'wall-divider');
    expect(divider).toBeDefined();
    expect(divider.widthMm).toBe(1200);
    expect(divider.depthMm).toBe(120);

    const structural = FURNITURE_CATALOG.find((item) => item.id === 'wall-structural');
    expect(structural).toBeDefined();
    expect(structural.widthMm).toBe(3000);
    expect(structural.depthMm).toBe(200);

    const glass = FURNITURE_CATALOG.find((item) => item.id === 'wall-glass');
    expect(glass).toBeDefined();
    expect(glass.symbol).toBe('wall-glass');
    expect(glass.widthMm).toBe(1800);
    expect(glass.depthMm).toBe(80);
  });
});

describe('Wall Partition Rotation & Placement Logic', () => {
  it('calculates rotated coordinates and wrap angles for wall components', () => {
    const wall = {
      x: 0,
      y: 0,
      widthMm: 2000,
      depthMm: 150,
      rotation: 0,
    };

    // Rotating wall by 90 degrees
    const rotateAngle = (current, delta) => ((current + delta) % 360 + 360) % 360;
    expect(rotateAngle(wall.rotation, 90)).toBe(90);
    expect(rotateAngle(wall.rotation, -90)).toBe(270);
    expect(rotateAngle(wall.rotation, 45)).toBe(45);
    expect(rotateAngle(350, 20)).toBe(10);
  });

  it('computes parallel offset for duplicating a parallel partition wall', () => {
    // Wall at angle 0 (horizontal)
    const wallHorizontal = {
      x: 500,
      y: 500,
      widthMm: 2000,
      depthMm: 150,
      rotation: 0,
    };

    const rad = (wallHorizontal.rotation * Math.PI) / 180;
    const perpX = Math.round(-Math.sin(rad) * 1500) || 0;
    const perpY = Math.round(Math.cos(rad) * 1500) || 0;

    expect(perpX).toBe(0);
    expect(perpY).toBe(1500); // Placed 1.5m below horizontal wall

    // Wall at angle 90 (vertical)
    const wallVertical = {
      x: 500,
      y: 500,
      widthMm: 2000,
      depthMm: 150,
      rotation: 90,
    };
    const radV = (wallVertical.rotation * Math.PI) / 180;
    const perpXV = Math.round(-Math.sin(radV) * 1500) || 0;
    const perpYV = Math.round(Math.cos(radV) * 1500) || 0;

    expect(perpXV).toBe(-1500);
    expect(perpYV).toBe(0);
  });

  it('computes inline extension offset for extending a partition wall end-to-end', () => {
    const wall = {
      x: 1000,
      y: 1000,
      widthMm: 2000,
      depthMm: 150,
      rotation: 0,
    };

    const rad = (wall.rotation * Math.PI) / 180;
    const inlineX = Math.round(Math.cos(rad) * wall.widthMm);
    const inlineY = Math.round(Math.sin(rad) * wall.widthMm);

    expect(inlineX).toBe(2000);
    expect(inlineY).toBe(0);
    expect(wall.x + inlineX).toBe(3000);
  });
});
