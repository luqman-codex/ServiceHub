/**
 * Global test setup (run once per test file via setupFilesAfterEach).
 *
 * Safety: hard-guards that we are talking to the *test* database and NODE_ENV=test
 * so a misconfigured run can never `sync({ force: true })` the dev DB.
 *
 * Responsibilities:
 *  - authenticate sequelize against servicehub_test
 *  - sequelize.sync({ force: true }) to build a fresh schema
 *  - seed the minimum rows the suite needs (3 roles + admin/provider/customer,
 *    one category, one service)
 *  - export factory + login helpers used by the integration specs
 *  - close the connection after all tests
 */
import { config } from '../src/config/env';
import { sequelize, Role, User, Category, Service } from '../src/models';
import { hashPassword } from '../src/utils/password';
import { RoleName } from '../src/types/enums';

// ── HARD SAFETY GUARDS ──────────────────────────────────────────────────────
if (config.NODE_ENV !== 'test') {
  throw new Error(
    `Refusing to run tests with NODE_ENV="${config.NODE_ENV}". Expected "test".`,
  );
}
if (config.DB_NAME !== 'servicehub_test') {
  throw new Error(
    `Refusing to run tests against DB "${config.DB_NAME}". Expected "servicehub_test".`,
  );
}

// ── shared seed constants ────────────────────────────────────────────────────
export const SEED = {
  admin: { email: 'admin@test.local', password: 'Password123' },
  provider: { email: 'provider@test.local', password: 'Password123' },
  customer: { email: 'customer@test.local', password: 'Password123' },
  customer2: { email: 'customer2@test.local', password: 'Password123' },
};

export interface SeedIds {
  roleIds: Record<RoleName, number>;
  adminId: number;
  providerId: number;
  customerId: number;
  customer2Id: number;
  categoryId: number;
  serviceId: number;
}

export const seeded: SeedIds = {
  roleIds: {} as Record<RoleName, number>,
  adminId: 0,
  providerId: 0,
  customerId: 0,
  customer2Id: 0,
  categoryId: 0,
  serviceId: 0,
};

async function seed(): Promise<void> {
  const [customerRole, providerRole, adminRole] = await Promise.all([
    Role.create({ name: RoleName.CUSTOMER, description: 'Customer' }),
    Role.create({ name: RoleName.PROVIDER, description: 'Provider' }),
    Role.create({ name: RoleName.ADMIN, description: 'Admin' }),
  ]);
  seeded.roleIds = {
    [RoleName.CUSTOMER]: customerRole.id,
    [RoleName.PROVIDER]: providerRole.id,
    [RoleName.ADMIN]: adminRole.id,
  };

  const hash = await hashPassword(SEED.admin.password); // same plaintext for all seeds

  const [admin, provider, customer, customer2] = await Promise.all([
    User.create({
      role_id: adminRole.id,
      name: 'Admin User',
      email: SEED.admin.email,
      password_hash: hash,
      is_active: true,
    }),
    User.create({
      role_id: providerRole.id,
      name: 'Provider User',
      email: SEED.provider.email,
      password_hash: hash,
      is_active: true,
    }),
    User.create({
      role_id: customerRole.id,
      name: 'Customer User',
      email: SEED.customer.email,
      password_hash: hash,
      is_active: true,
    }),
    User.create({
      role_id: customerRole.id,
      name: 'Customer Two',
      email: SEED.customer2.email,
      password_hash: hash,
      is_active: true,
    }),
  ]);
  seeded.adminId = admin.id;
  seeded.providerId = provider.id;
  seeded.customerId = customer.id;
  seeded.customer2Id = customer2.id;

  const category = await Category.create({
    name: 'Home Cleaning',
    slug: 'home-cleaning',
    description: 'House cleaning services',
    is_active: true,
  });
  seeded.categoryId = category.id;

  const service = await Service.create({
    category_id: category.id,
    name: 'Standard Clean',
    description: 'A standard home clean',
    price: 79.99,
    currency: 'USD',
    duration_minutes: 90,
    is_active: true,
  });
  seeded.serviceId = service.id;
}

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  await seed();
});

afterAll(async () => {
  await sequelize.close();
});
