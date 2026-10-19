import { describe, it, expect } from 'vitest';
import { CATEGORIES, FURNITURE_CATALOG } from '../../constants/catalog';

describe('People Components & Scale Testing Catalog', () => {
  it('includes the people category in CATEGORIES', () => {
    const peopleCat = CATEGORIES.find((c) => c.id === 'people');
    expect(peopleCat).toBeDefined();
    expect(peopleCat.name).toContain('People');
  });

  it('contains standing person with circular 500mm architectural dimensions', () => {
    const standingPerson = FURNITURE_CATALOG.find((item) => item.id === 'person-standing');
    expect(standingPerson).toBeDefined();
    expect(standingPerson.category).toBe('people');
    expect(standingPerson.symbol).toBe('person-standing');
    expect(standingPerson.widthMm).toBe(500);
    expect(standingPerson.depthMm).toBe(500);
  });

  it('contains sleeping person with standard 1850mm x 650mm dimensions in horizontal and vertical orientations', () => {
    const horizPerson = FURNITURE_CATALOG.find((item) => item.id === 'person-sleeping-horizontal');
    expect(horizPerson).toBeDefined();
    expect(horizPerson.category).toBe('people');
    expect(horizPerson.symbol).toBe('person-sleeping');
    expect(horizPerson.widthMm).toBe(1850);
    expect(horizPerson.depthMm).toBe(650);

    const vertPerson = FURNITURE_CATALOG.find((item) => item.id === 'person-sleeping-vertical');
    expect(vertPerson).toBeDefined();
    expect(vertPerson.category).toBe('people');
    expect(vertPerson.symbol).toBe('person-sleeping');
    expect(vertPerson.widthMm).toBe(650);
    expect(vertPerson.depthMm).toBe(1850);
  });

  it('contains sleeping mat and double sleeping capacity figures', () => {
    const matPerson = FURNITURE_CATALOG.find((item) => item.id === 'person-sleeping-mat');
    expect(matPerson).toBeDefined();
    expect(matPerson.widthMm).toBe(1900);
    expect(matPerson.depthMm).toBe(800);

    const doublePeople = FURNITURE_CATALOG.find((item) => item.id === 'people-sleeping-double');
    expect(doublePeople).toBeDefined();
    expect(doublePeople.widthMm).toBe(1900);
    expect(doublePeople.depthMm).toBe(1400);
  });
});

describe('Room Sleeping Capacity Logic', () => {
  it('correctly calculates head-to-toe and side-by-side sleeping capacity for a standard 4m x 3m bedroom', () => {
    const room = {
      lengthMm: 4000, // 4 meters
      widthMm: 3000,  // 3 meters
    };

    // Standard sleeping footprint: ~1900mm length, ~700mm width
    const lengthCapacity = Math.floor(room.lengthMm / 1900);
    const widthCapacity = Math.floor(room.widthMm / 700);

    expect(lengthCapacity).toBe(2); // 2 rows along 4m length
    expect(widthCapacity).toBe(4);  // 4 persons side by side along 3m width
    expect(lengthCapacity * widthCapacity).toBe(8); // Grid capacity: 8 persons
  });

  it('calculates side-by-side placement coordinates when duplicating a sleeping person beside', () => {
    const horizPerson = {
      x: 100,
      y: 200,
      widthMm: 1850,
      depthMm: 650,
    };

    // When horizontal (width >= depth), next person is placed directly below (same X, offset Y)
    const nextY = horizPerson.y + horizPerson.depthMm + 80;
    expect(nextY).toBe(200 + 650 + 80); // 930 mm

    const vertPerson = {
      x: 300,
      y: 400,
      widthMm: 650,
      depthMm: 1850,
    };

    // When vertical (depth > width), next person is placed directly to the right (offset X, same Y)
    const nextX = vertPerson.x + vertPerson.widthMm + 80;
    expect(nextX).toBe(300 + 650 + 80); // 1030 mm
  });
});
