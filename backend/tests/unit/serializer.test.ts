/**
 * Unit: serializer timestamp handling (src/utils/serializers.ts).
 *
 * Sequelize exposes managed timestamps as camelCase (createdAt/updatedAt) on a
 * freshly written instance, while DTOs read snake_case. The `plain()` helper must
 * backfill snake_case from camelCase so a write response never serializes
 * created_at/updated_at as undefined.
 */
import { serializeService, serializeUser } from '../../src/utils/serializers';
import { RoleName } from '../../src/types/enums';

describe('serializer timestamp handling', () => {
  it('emits ISO created_at/updated_at when only camelCase keys are present', () => {
    const created = new Date('2026-06-19T10:00:00.000Z');
    const updated = new Date('2026-06-19T11:30:00.000Z');
    // simulate a freshly created Sequelize instance: get({plain:true}) yields camelCase
    const instance = {
      get: () => ({
        id: 1,
        category_id: 2,
        name: 'Standard Clean',
        description: 'desc',
        price: '79.99',
        currency: 'USD',
        duration_minutes: 90,
        is_active: true,
        createdAt: created,
        updatedAt: updated,
        // note: NO created_at / updated_at — must be backfilled
      }),
    };

    const dto = serializeService(instance);
    expect(dto.created_at).toBe(created.toISOString());
    expect(dto.updated_at).toBe(updated.toISOString());
    expect(dto.created_at).not.toBeUndefined();
    expect(dto.price).toBe('79.99'); // DECIMAL stays a string
  });

  it('prefers existing snake_case timestamps when present (DB read shape)', () => {
    const ts = '2026-01-01T00:00:00.000Z';
    const row = {
      id: 5,
      role_id: 3,
      role: { name: RoleName.ADMIN },
      name: 'Admin',
      email: 'admin@test.local',
      phone: null,
      is_active: true,
      created_at: new Date(ts),
      updated_at: new Date(ts),
    };
    const dto = serializeUser(row);
    expect(dto.created_at).toBe(ts);
    expect(dto.role).toBe(RoleName.ADMIN);
    // password_hash is never present on the DTO
    expect((dto as unknown as Record<string, unknown>).password_hash).toBeUndefined();
  });
});
