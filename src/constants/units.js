export const UNITS = {
  m: {
    id: 'm',
    name: 'Meters',
    symbol: 'm',
    mmFactor: 1000,
    decimals: 2,
    step: 0.1,
    min: 0.5,
    max: 50,
  },
  cm: {
    id: 'cm',
    name: 'Centimeters',
    symbol: 'cm',
    mmFactor: 10,
    decimals: 0,
    step: 5,
    min: 50,
    max: 5000,
  },
  ft: {
    id: 'ft',
    name: 'Feet',
    symbol: 'ft',
    mmFactor: 304.8,
    decimals: 2,
    step: 0.5,
    min: 1.5,
    max: 164,
  },
  in: {
    id: 'in',
    name: 'Inches',
    symbol: 'in',
    mmFactor: 25.4,
    decimals: 1,
    step: 1,
    min: 20,
    max: 1968,
  },
};

export const DEFAULT_UNIT = 'm';
