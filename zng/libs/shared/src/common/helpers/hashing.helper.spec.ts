import { createHashAsync, compareHashAsync } from './hashing.helper';

describe('Hashing Helper', () => {
  describe('createHashAsync', () => {
    it('should create a hash from a given value', async () => {
      const value = 'test-value';
      const hash = await createHashAsync(value);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(value);
    });
  });

  describe('compareHashAsync', () => {
    it('should return true for matching value and hash', async () => {
      const value = 'test-value';
      const hash = await createHashAsync(value);
      const isMatch = await compareHashAsync(value, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching value and hash', async () => {
      const value = 'test-value';
      const hash = await createHashAsync(value);
      const isMatch = await compareHashAsync('wrong-value', hash);

      expect(isMatch).toBe(false);
    });
  });
});
describe('createHashAsync with long values', () => {
  it('should create a hash from a long value', async () => {
    const longValue =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const hash = await createHashAsync(longValue);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(longValue);
  });
});

describe('compareHashAsync with long values', () => {
  it('should return true for matching long value and hash', async () => {
    const longValue =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const hash = await createHashAsync(longValue);
    const isMatch = await compareHashAsync(longValue, hash);

    expect(isMatch).toBe(true);
  });

  it('should return false for non-matching long value and hash', async () => {
    const longValue =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const hash = await createHashAsync(longValue);
    const isMatch = await compareHashAsync('wrong-long-value', hash);

    expect(isMatch).toBe(false);
  });

  it('approves that hashes of the same value are not identical (random salt generation - is the reason)', async () => {
    const longValue =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const hash = await createHashAsync(longValue);
    const hash2 = await createHashAsync(longValue);

    expect(hash).not.toBe(hash2);
  });
});
