import { vi } from "vitest";

const model = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  groupBy: vi.fn(),
});

/** Mocked Prisma client. `$transaction` runs its callback with the same mock as `tx`. */
export const prismaMock = {
  user: model(),
  space: model(),
  booking: model(),
  membership: model(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
};

prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prismaMock));

export const prismaModule = { default: prismaMock };
