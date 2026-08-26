import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: { $transaction: vi.fn() },
}));

import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../database/prisma.js";
import { runSerializable } from "./serializableTransaction.js";

const serializationFailure = () =>
  Object.assign(new Prisma.PrismaClientKnownRequestError("conflict", {
    code: "P2034",
    clientVersion: "test",
  }));

describe("runSerializable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs the callback under a Serializable transaction and returns its result", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue("result");

    const result = await runSerializable(async () => "result");

    expect(result).toBe("result");
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("retries on a P2034 serialization failure and succeeds on a later attempt", async () => {
    vi.mocked(prisma.$transaction)
      .mockRejectedValueOnce(serializationFailure())
      .mockRejectedValueOnce(serializationFailure())
      .mockResolvedValueOnce("result");

    const result = await runSerializable(async () => "result");

    expect(result).toBe("result");
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it("gives up after 3 attempts and throws the last serialization failure", async () => {
    const error = serializationFailure();
    vi.mocked(prisma.$transaction).mockRejectedValue(error);

    await expect(runSerializable(async () => "result")).rejects.toBe(error);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-serialization error, even on the first attempt", async () => {
    const error = new Error("some other db error");
    vi.mocked(prisma.$transaction).mockRejectedValue(error);

    await expect(runSerializable(async () => "result")).rejects.toBe(error);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
