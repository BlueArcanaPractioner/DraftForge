/*
 * DeckList – canonical per‑seat deck state built over an immutable drafted pool.
 *
 * Responsibilities
 * ──────────────────────────────────────────────────────────────────────────
 * • Hold a *read‑only* reference to the seat's full drafted pool (CardCopy[]).
 * • Track the mainboard as an ordered list of CardIDs referencing that pool.
 * • Provide safe, copy‑before‑write mutation helpers (functional updates).
 * • Expose readonly projected views: getPool(), getMain(), counts, etc.
 * • Serialize minimally (IDs only) for compact persistence.
 *
 * No React imports; this is a pure data structure suitable for any environment.
 */

import type { CardCopy, CardID } from '@/types/card';

/* A convenience alias for arrays of IDs */
export type MainIDs = CardID[];

export class DeckList {
  readonly seatIdx: number;
  private readonly pool: readonly CardCopy[];          // canonical; never mutated
  private mainIds: MainIDs;                            // mutable (copy‑on‑write)

  constructor(
    seatIdx: number,
    pool: readonly CardCopy[],
    initMainIds: readonly CardID[] = [],
  ) {
    this.seatIdx = seatIdx;
    // freeze a defensive copy so caller can't later mutate the array they passed
    this.pool = Object.freeze([...pool]);

    // Filter initial IDs so we never reference cards that aren't in the pool.
    const poolSet = new Set(this.pool.map(c => c._uid));
    this.mainIds = initMainIds.filter(id => poolSet.has(id)).slice();
  }

  /*───────────────── basic queries ─────────────────*/
  getPool(): readonly CardCopy[] { return this.pool; }
  getPoolCount(): number { return this.pool.length; }

  /** Ordered list of CardIDs in the mainboard. */
  getMainIds(): readonly CardID[] { return this.mainIds; }
  getMainCount(): number { return this.mainIds.length; }

  /** Materialize full CardCopy objects for the mainboard, by ID lookup. */
  getMain(): readonly CardCopy[] {
    // NOTE: intentionally map each call; consumers that need referential stability
    // can cache if desired.
    return this.mainIds.map(id => this.byId(id)!).filter(Boolean);
  }

  /** Lookup helper. */
  byId(id: CardID): CardCopy | undefined {
    // Linear search; acceptable for small lists. Replace w/ index if perf matters.
    return this.pool.find(c => c._uid === id);
  }

  /*───────────────── derived helpers ─────────────────*/
  /** Cards in pool *not* in mainboard – effectively a sideboard. */
  getSide(): readonly CardCopy[] {
    const inMain = new Set(this.mainIds);
    return this.pool.filter(c => !inMain.has(c._uid));
  }
  getSideCount(): number { return this.getSide().length; }

  /*───────────────── mutation (copy‑before‑write) ─────────────────*/
  /** Add the card at poolIdx to the end of the mainboard. */
  addToMainByPoolIdx(poolIdx: number) {
    const card = this.pool[poolIdx]; if (!card) return;
    this.mainIds = [...this.mainIds, card._uid];
  }

  /** Insert a specific CardID (validated) at optional position. */
  addToMainId(id: CardID, at?: number) {
    if (!this.pool.some(c => c._uid === id)) return; // ignore unknown
    const next = [...this.mainIds];
    if (at == null || at < 0 || at > next.length) next.push(id); else next.splice(at, 0, id);
    this.mainIds = next;
  }

  /** Remove the mainboard card at index. */
  removeFromMain(mainIdx: number) {
    if (mainIdx < 0 || mainIdx >= this.mainIds.length) return;
    const next = [...this.mainIds];
    next.splice(mainIdx, 1);
    this.mainIds = next;
  }

  /** Remove by CardID (first occurrence). */
  removeId(id: CardID) {
    const i = this.mainIds.indexOf(id);
    if (i >= 0) this.removeFromMain(i);
  }

  /** Clear the mainboard. */
  clearMain() { this.mainIds = []; }

  /** Replace the entire mainboard with the given IDs (validated). */
  importMainIds(ids: readonly CardID[]) {
    const poolSet = new Set(this.pool.map(c => c._uid));
    this.mainIds = ids.filter(id => poolSet.has(id)).slice();
  }

  /*───────────────── serialisation ─────────────────*/
  /** Persist minimal shape: ordered main IDs only. */
  toJSON(): MainIDs { return [...this.mainIds]; }
}
