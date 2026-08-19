import { prisma } from "../database/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

const MAX_ATTEMPTS = 3;

const isSerializationFailure = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

// Runs `fn` under Postgres SERIALIZABLE isolation so a check-then-write
// (e.g. "is there a ban?" then "create the membership row") can't race a
// concurrent write to the same rows. Postgres reports the loser of a
// conflicting pair as error P2034, which is safe to retry from scratch.
export const runSerializable = async <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isSerializationFailure(error) || attempt === MAX_ATTEMPTS) throw error;
    }
  }
  throw new Error("Unreachable");
};
