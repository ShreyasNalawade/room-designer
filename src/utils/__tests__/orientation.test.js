import { describe, it, expect } from 'vitest';
import {
  CARDINAL_DIRECTIONS,
  getHeadingDirection,
  rotateRoom,
  setRoomRotation,
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
});
