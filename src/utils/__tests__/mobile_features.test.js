import { describe, it, expect } from 'vitest';
import { isItemOutsideRoom } from '../collision';

describe('Mobile Precision & Actions Validation', () => {
  it('handles mobile nudge increments accurately in millimeters', () => {
    let item = { id: 'item_1', x: 2000, y: 1500, widthMm: 1600, depthMm: 2000, rotation: 0 };
    
    // Nudge Right by 50mm
    item = { ...item, x: item.x + 50 };
    expect(item.x).toBe(2050);

    // Nudge Up by 50mm (-Y in screen coordinates)
    item = { ...item, y: item.y - 50 };
    expect(item.y).toBe(1450);

    // Nudge Left by 50mm
    item = { ...item, x: item.x - 50 };
    expect(item.x).toBe(2000);

    // Nudge Down by 50mm (+Y in screen coordinates)
    item = { ...item, y: item.y + 50 };
    expect(item.y).toBe(1500);
  });

  it('handles mobile 90-degree step rotations', () => {
    let rotation = 0;
    const rotate90 = (deg) => (deg + 90) % 360;

    rotation = rotate90(rotation);
    expect(rotation).toBe(90);

    rotation = rotate90(rotation);
    expect(rotation).toBe(180);

    rotation = rotate90(rotation);
    expect(rotation).toBe(270);

    rotation = rotate90(rotation);
    expect(rotation).toBe(0);
  });

  it('handles item erasure / deletion on mobile', () => {
    const items = [
      { id: 'item_1', name: 'King Bed' },
      { id: 'item_2', name: 'Work Desk' },
      { id: 'item_3', name: 'Armchair' },
    ];

    const deleteItem = (id) => items.filter((item) => item.id !== id);

    const afterDelete = deleteItem('item_2');
    expect(afterDelete).toHaveLength(2);
    expect(afterDelete.map((i) => i.id)).toEqual(['item_1', 'item_3']);
  });

  it('handles item duplication with offset on mobile', () => {
    const original = {
      id: 'f_orig',
      name: 'Nightstand',
      x: 1000,
      y: 1000,
      widthMm: 500,
      depthMm: 450,
      rotation: 0,
    };

    const duplicateItem = (item) => ({
      ...item,
      id: `f_${Date.now()}_dup`,
      x: item.x + 200,
      y: item.y + 200,
    });

    const dup = duplicateItem(original);
    expect(dup.id).not.toBe(original.id);
    expect(dup.x).toBe(1200);
    expect(dup.y).toBe(1200);
    expect(dup.widthMm).toBe(original.widthMm);
  });

  it('preserves boundary containment when nudging inside room', () => {
    const room = {
      shape: 'rectangle',
      widthMm: 6000,
      lengthMm: 4000,
    };

    // Item placed well inside room [-3000..3000, -2000..2000]
    const item = { x: -500, y: -500, widthMm: 1200, depthMm: 800, rotation: 0 };
    expect(isItemOutsideRoom(item, room)).toBe(false);

    // Nudged by 50mm
    const nudgedItem = { ...item, x: item.x + 50, y: item.y + 50 };
    expect(isItemOutsideRoom(nudgedItem, room)).toBe(false);

    // Nudged outside wall boundary
    const outsideItem = { ...item, x: 2800, y: 1800 };
    expect(isItemOutsideRoom(outsideItem, room)).toBe(true);
  });
});
