import { describe, expect, it } from "vitest";
import {
  addToHistory,
  removeById,
  upsertSaved,
  type HistoryEntry,
  type SavedRequest,
} from "./api-client-store";

const hist = (over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: Math.random().toString(36).slice(2),
  method: "GET",
  url: "https://api.example.com/a",
  headers: [],
  body: "",
  status: 200,
  at: Date.now(),
  ...over,
});

const saved = (over: Partial<SavedRequest> = {}): SavedRequest => ({
  id: "s1",
  name: "One",
  method: "GET",
  url: "https://api.example.com/a",
  headers: [],
  body: "",
  savedAt: 1,
  ...over,
});

describe("addToHistory", () => {
  it("prepends the newest entry", () => {
    const list = [hist({ url: "https://x/1" })];
    const out = addToHistory(list, hist({ url: "https://x/2" }));
    expect(out[0].url).toBe("https://x/2");
    expect(out).toHaveLength(2);
  });

  it("dedupes by method+url, keeping the newest", () => {
    const list = [hist({ method: "GET", url: "https://x/1", status: 500 })];
    const out = addToHistory(list, hist({ method: "GET", url: "https://x/1", status: 200 }));
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe(200);
  });

  it("treats different methods on the same url as distinct", () => {
    const list = [hist({ method: "GET", url: "https://x/1" })];
    const out = addToHistory(list, hist({ method: "POST", url: "https://x/1" }));
    expect(out).toHaveLength(2);
  });

  it("caps the list length", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < 30; i++) list = addToHistory(list, hist({ url: `https://x/${i}` }), 20);
    expect(list).toHaveLength(20);
    expect(list[0].url).toBe("https://x/29");
  });
});

describe("upsertSaved", () => {
  it("inserts a new request", () => {
    const out = upsertSaved([], saved());
    expect(out).toHaveLength(1);
  });

  it("replaces an existing id rather than duplicating", () => {
    const out = upsertSaved([saved({ id: "s1", name: "Old", savedAt: 1 })], saved({ id: "s1", name: "New", savedAt: 2 }));
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("New");
  });

  it("sorts newest-saved first", () => {
    const out = upsertSaved(
      [saved({ id: "s1", savedAt: 1 })],
      saved({ id: "s2", savedAt: 5 })
    );
    expect(out.map((r) => r.id)).toEqual(["s2", "s1"]);
  });
});

describe("removeById", () => {
  it("drops the matching id only", () => {
    const out = removeById([saved({ id: "s1" }), saved({ id: "s2" })], "s1");
    expect(out.map((r) => r.id)).toEqual(["s2"]);
  });
});
