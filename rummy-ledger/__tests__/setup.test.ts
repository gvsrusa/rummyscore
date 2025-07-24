/**
 * Basic setup test to verify Jest configuration
 */

describe('Project Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import types', () => {
    const types = require('../src/types');
    expect(types).toBeDefined();
    expect(typeof types).toBe('object');
  });
});
