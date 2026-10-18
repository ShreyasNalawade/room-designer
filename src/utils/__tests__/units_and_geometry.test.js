import { describe, it, expect } from 'vitest';
import { fromMm, toMm, formatMeasurement, calculateArea, calculatePerimeter } from '../units';
import { validateRoomDimensions, MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM } from '../validation';

describe('Unit Conversion Utilities', () => {
  it('correctly converts between mm and meters', () => {
    expect(fromMm(5000, 'm')).toBe(5);
    expect(toMm(5, 'm')).toBe(5000);
    expect(formatMeasurement(5000, 'm')).toBe('5.00 m');
  });

  it('correctly converts between mm and centimeters', () => {
    expect(fromMm(4500, 'cm')).toBe(450);
    expect(toMm(450, 'cm')).toBe(4500);
    expect(formatMeasurement(4500, 'cm')).toBe('450 cm');
  });

  it('correctly converts between mm and feet', () => {
    // 3048 mm = 10 ft
    expect(fromMm(3048, 'ft')).toBe(10);
    expect(toMm(10, 'ft')).toBe(3048);
    expect(formatMeasurement(3048, 'ft')).toBe('10.00 ft');
  });

  it('correctly converts between mm and inches', () => {
    // 254 mm = 10 inches
    expect(fromMm(254, 'in')).toBe(10);
    expect(toMm(10, 'in')).toBe(254);
    expect(formatMeasurement(254, 'in')).toBe('10.0 in');
  });

  it('handles zero and invalid inputs safely', () => {
    expect(fromMm(null, 'm')).toBe(0);
    expect(toMm(undefined, 'm')).toBe(0);
    expect(fromMm(NaN, 'm')).toBe(0);
  });
});

describe('Room Geometry Calculations', () => {
  it('computes accurate area in square meters and square feet', () => {
    // 5m x 4m = 20m²
    const area = calculateArea(5000, 4000);
    expect(area.sqMeters).toBe(20.0);
    expect(area.sqFeet).toBe(215.28);
  });

  it('computes perimeter accurately', () => {
    // 2 * (5m + 4m) = 18m
    const perimeter = calculatePerimeter(5000, 4000, 'm');
    expect(perimeter).toBe(18.0);
  });
});

describe('Room Dimension Validation', () => {
  it('validates a standard residential room', () => {
    const res = validateRoomDimensions(6000, 4500, 'm');
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.warnings.length).toBe(0);
  });

  it('rejects dimensions below minimum threshold', () => {
    const res = validateRoomDimensions(MIN_ROOM_DIMENSION_MM - 100, 4000, 'm');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('too small');
  });

  it('rejects dimensions above maximum threshold', () => {
    const res = validateRoomDimensions(MAX_ROOM_DIMENSION_MM + 1000, 4000, 'm');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('exceeds maximum');
  });

  it('rejects zero or negative values', () => {
    const res = validateRoomDimensions(0, -500, 'm');
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBe(2);
  });

  it('flags extreme aspect ratios with an architectural warning', () => {
    // 10m x 1.5m (ratio 6.67:1)
    const res = validateRoomDimensions(10000, 1500, 'm');
    expect(res.isValid).toBe(true);
    expect(res.warnings.length).toBe(1);
    expect(res.warnings[0]).toContain('Extreme aspect ratio');
  });
});
