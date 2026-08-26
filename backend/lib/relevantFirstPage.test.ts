import { describe, expect, it, vi } from "vitest";
import { getRelevantFirstPage } from "./relevantFirstPage.js";

const item = (id: string) => ({ id });

describe("getRelevantFirstPage", () => {
  describe("first page (no cursor)", () => {
    it("fills the page with relevant rows first, then tops up with non-relevant rows", async () => {
      const fetchRelevant = vi.fn().mockResolvedValue([item("r1"), item("r2")]);
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n1")]);

      const page = await getRelevantFirstPage({ limit: 5, fetchRelevant, fetchNonRelevant });

      expect(page.items).toEqual([item("r1"), item("r2"), item("n1")]);
      expect(fetchNonRelevant).toHaveBeenCalledWith(undefined, 4); // remaining (3) + 1 lookahead
      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it("sets a non-relevant cursor and hasMore when the top-up overflows the page", async () => {
      const fetchRelevant = vi.fn().mockResolvedValue([item("r1")]);
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n1"), item("n2"), item("n3")]);

      const page = await getRelevantFirstPage({ limit: 2, fetchRelevant, fetchNonRelevant });

      expect(page.items).toEqual([item("r1"), item("n1")]);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe("nr:n1");
    });

    it("when relevant rows alone fill (or overflow) the page, probes for more instead of fetching a full non-relevant page", async () => {
      const fetchRelevant = vi.fn().mockResolvedValue([item("r1"), item("r2"), item("r3")]);
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n1")]);

      const page = await getRelevantFirstPage({ limit: 2, fetchRelevant, fetchNonRelevant });

      expect(page.items).toEqual([item("r1"), item("r2"), item("r3")]);
      expect(fetchNonRelevant).toHaveBeenCalledWith(undefined, 1); // just a 1-row probe
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe("nr:");
    });

    it("reports no more pages when the probe finds nothing left", async () => {
      const fetchRelevant = vi.fn().mockResolvedValue([item("r1"), item("r2")]);
      const fetchNonRelevant = vi.fn().mockResolvedValue([]);

      const page = await getRelevantFirstPage({ limit: 2, fetchRelevant, fetchNonRelevant });

      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it("skips fetchRelevant's cost by still calling it, but never touches fetchNonRelevant's cursor path", async () => {
      const fetchRelevant = vi.fn().mockResolvedValue([]);
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n1")]);

      await getRelevantFirstPage({ limit: 5, fetchRelevant, fetchNonRelevant });

      expect(fetchRelevant).toHaveBeenCalled();
      expect(fetchNonRelevant).toHaveBeenCalledWith(undefined, 6);
    });
  });

  describe("subsequent pages (cursor present)", () => {
    it("paginates through non-relevant rows only, never calling fetchRelevant again", async () => {
      const fetchRelevant = vi.fn();
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n2")]);

      const page = await getRelevantFirstPage({
        cursor: "nr:n1",
        limit: 5,
        fetchRelevant,
        fetchNonRelevant,
      });

      expect(fetchRelevant).not.toHaveBeenCalled();
      expect(fetchNonRelevant).toHaveBeenCalledWith("n1", 6);
      expect(page.items).toEqual([item("n2")]);
    });

    it("treats a bare 'nr:' cursor (from the probe path) as 'no cursor id yet'", async () => {
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n1")]);

      await getRelevantFirstPage({ cursor: "nr:", limit: 5, fetchRelevant: vi.fn(), fetchNonRelevant });

      expect(fetchNonRelevant).toHaveBeenCalledWith(undefined, 6);
    });

    it("treats a cursor without the nr: prefix the same way (defensive, shouldn't normally happen)", async () => {
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n1")]);

      await getRelevantFirstPage({ cursor: "n1", limit: 5, fetchRelevant: vi.fn(), fetchNonRelevant });

      expect(fetchNonRelevant).toHaveBeenCalledWith("n1", 6);
    });

    it("returns a fresh nr: cursor and hasMore when the lookahead row is trimmed", async () => {
      const fetchNonRelevant = vi.fn().mockResolvedValue([item("n2"), item("n3")]);

      const page = await getRelevantFirstPage({
        cursor: "nr:n1",
        limit: 1,
        fetchRelevant: vi.fn(),
        fetchNonRelevant,
      });

      expect(page.items).toEqual([item("n2")]);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe("nr:n2");
    });
  });
});
