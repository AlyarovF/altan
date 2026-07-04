import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes then verifies a password (argon2id)', async () => {
    const hash = await service.hash('ChangeMe!2026');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await service.verify(hash, 'ChangeMe!2026')).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('correct-horse');
    expect(await service.verify(hash, 'battery-staple')).toBe(false);
  });

  it('returns false (never throws) on a malformed hash', async () => {
    expect(await service.verify('not-a-hash', 'whatever')).toBe(false);
  });
});
