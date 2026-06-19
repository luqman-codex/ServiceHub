/**
 * Unit: bcrypt password hash + verify round-trip (src/utils/password.ts).
 */
import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password hashing', () => {
  it('hashes a password into a non-plaintext bcrypt string', async () => {
    const plain = 'Password123';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt hash signature
    expect(hash.length).toBeGreaterThanOrEqual(59);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('Password123');
    await expect(verifyPassword('Password123', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Password123');
    await expect(verifyPassword('WrongPassword1', hash)).resolves.toBe(false);
  });

  it('produces a different salt/hash for the same plaintext each call', async () => {
    const a = await hashPassword('Password123');
    const b = await hashPassword('Password123');
    expect(a).not.toBe(b);
    // both still verify
    await expect(verifyPassword('Password123', a)).resolves.toBe(true);
    await expect(verifyPassword('Password123', b)).resolves.toBe(true);
  });
});
