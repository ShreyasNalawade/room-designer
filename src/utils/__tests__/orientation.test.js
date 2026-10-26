import { describe, it, expect } from 'vitest';
import {
  CARDINAL_DIRECTIONS,
  getHeadingDirection,
  getRoomWallDirections,
  getRotationForWallDirection,
  rotateRoom,
  setRoomRotation,
  getRoomHeadingAngle,
  setCompassHeading,
  rotatePhysicalLayout,
  flipPhysicalLayout,
} from '../orientation';

describe('Orientation and Compass utilities', () => {
  it('defines the 8 cardinal directions', () => {
    expect(CARDINAL_DIRECTIONS).toHaveLength(8);
    expect(CARDINAL_DIRECTIONS.map((d) => d.code)).toEqual([
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
    ]);
  });

  describe('getHeadingDirection', () => {
    it('accurately identifies True North around 0 and 360 degrees', () => {
      expect(getHeadingDirection(0).code).toBe('N');
      expect(getHeadingDirection(10).code).toBe('N');
      expect(getHeadingDirection(350).code).toBe('N');
      expect(getHeadingDirection(360).code).toBe('N');
    });

    it('identifies East, South, and West precisely at 90, 180, and 270 degrees', () => {
      expect(getHeadingDirection(90).code).toBe('E');
      expect(getHeadingDirection(180).code).toBe('S');
      expect(getHeadingDirection(270).code).toBe('W');
    });

    it('handles negative angles seamlessly', () => {
      expect(getHeadingDirection(-90).code).toBe('W');
      expect(getHeadingDirection(-180).code).toBe('S');
      expect(getHeadingDirection(-270).code).toBe('E');
    });
  });

  describe('rotateRoom', () => {
    const baseRoom = {
      id: 'test-room',
      name: 'Test Room',
      shape: 'rectangle',
      widthMm: 5000,
      lengthMm: 4000,
      rotation: 0,
    };

    it('rotates room clockwise by 90 degrees iteratively', () => {
      const r1 = rotateRoom(baseRoom, 90);
      expect(r1.rotation).toBe(90);
      expect(r1.widthMm).toBe(5000); // Canonical dimensions preserved!

      const r2 = rotateRoom(r1, 90);
      expect(r2.rotation).toBe(180);

      const r3 = rotateRoom(r2, 90);
      expect(r3.rotation).toBe(270);

      const r4 = rotateRoom(r3, 90);
      expect(r4.rotation).toBe(0); // 360 wraps to 0
    });

    it('rotates room counter-clockwise by -90 degrees', () => {
      const r1 = rotateRoom(baseRoom, -90);
      expect(r1.rotation).toBe(270);

      const r2 = rotateRoom(r1, -90);
      expect(r2.rotation).toBe(180);
    });

    it('rotates room by 180 degrees', () => {
      const r1 = rotateRoom(baseRoom, 180);
      expect(r1.rotation).toBe(180);
    });
  });

  describe('setRoomRotation', () => {
    const baseRoom = { id: 'room-1', rotation: 90 };

    it('sets room rotation to target angle normalized within 0..360', () => {
      expect(setRoomRotation(baseRoom, 0).rotation).toBe(0);
      expect(setRoomRotation(baseRoom, 270).rotation).toBe(270);
      expect(setRoomRotation(baseRoom, 450).rotation).toBe(90);
      expect(setRoomRotation(baseRoom, -90).rotation).toBe(270);
    });
  });

  describe('getRoomHeadingAngle and setCompassHeading', () => {
    it('extracts compassHeading preferentially over rotation', () => {
      expect(getRoomHeadingAngle({ rotation: 0, compassHeading: 90 })).toBe(90);
      expect(getRoomHeadingAngle({ rotation: 180 })).toBe(180);
      expect(getRoomHeadingAngle(null)).toBe(0);
    });

    it('sets compassHeading without modifying room canvas rotation', () => {
      const room = { id: 'r1', rotation: 0, compassHeading: 0 };
      const updated = setCompassHeading(room, 90);
      expect(updated.compassHeading).toBe(90);
      expect(updated.rotation).toBe(0);
    });
  });

  describe('getRoomWallDirections and getRotationForWallDirection', () => {
    it('returns default cardinal wall directions at 0 degrees', () => {
      const dirs = getRoomWallDirections(0);
      expect(dirs.top.code).toBe('N');
      expect(dirs.bottom.code).toBe('S');
      expect(dirs.left.code).toBe('W');
      expect(dirs.right.code).toBe('E');
    });

    it('correctly maps Bottom Wall to West when rotation is 90 degrees', () => {
      const dirs = getRoomWallDirections(90);
      expect(dirs.bottom.code).toBe('W'); // Kitchen at bottom is now West!
      expect(dirs.top.code).toBe('E');
      expect(dirs.left.code).toBe('N');
      expect(dirs.right.code).toBe('S');
    });

    it('calculates the needed rotation for any wall to face a target direction', () => {
      // User wants bottom wall to face West ('W')
      expect(getRotationForWallDirection('bottom', 'W')).toBe(90);
      // User wants bottom wall to face North ('N')
      expect(getRotationForWallDirection('bottom', 'N')).toBe(180);
      // User wants bottom wall to face East ('E')
      expect(getRotationForWallDirection('bottom', 'E')).toBe(270);
      // User wants bottom wall to face South ('S')
      expect(getRotationForWallDirection('bottom', 'S')).toBe(0);
    });
  });

  describe('rotatePhysicalLayout & flipPhysicalLayout', () => {
    const testRoom = {
      id: 'r1',
      shape: 'rectangle',
      widthMm: 4000,
      lengthMm: 6000,
    };
    const testItems = [
      { id: 'kitchen-1', x: 0, y: 2500, rotation: 0 }, // Near bottom wall
    ];

    it('physically rotates room and items by 90 degrees', () => {
      const res = rotatePhysicalLayout(testRoom, testItems, 90);
      expect(res.room.widthMm).toBe(6000);
      expect(res.room.lengthMm).toBe(4000);
      expect(res.items[0].x).toBe(-2500); // Rotated to left wall
      expect(res.items[0].y).toBe(0);
      expect(res.items[0].rotation).toBe(90);
    });

    it('flips layout horizontally and vertically', () => {
      const flippedH = flipPhysicalLayout(testRoom, [{ id: 'i1', x: 500, y: 1000, rotation: 45 }], 'horizontal');
      expect(flippedH.items[0].x).toBe(-500);
      expect(flippedH.items[0].y).toBe(1000);

      const flippedV = flipPhysicalLayout(testRoom, [{ id: 'i1', x: 500, y: 1000, rotation: 0 }], 'vertical');
      expect(flippedV.items[0].x).toBe(500);
      expect(flippedV.items[0].y).toBe(-1000);
    });
  });
});
