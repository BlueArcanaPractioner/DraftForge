/*
 * DeckStore – top‑level coordinator for per‑seat DeckLists.
 *
 * Responsibilities
 * ──────────────────────────────────────────────────────────────────────────
 * • Own all seats’ drafted pools (CardCopy[][]) *immutably*.
 * • Construct a DeckList for each seat, seeded w/ persisted main IDs.
 * • Provide thin, type‑safe mutation passthroughs (add/remove/clear/import).
 * • Emit seat‑scoped + global change notifications.
 * • Serialize minimally: array of main ID arrays (CardID[][]).
 *
 * NOTE: Pools are assumed canonical + already contain stable `_uid` values.
 *       Do not mutate the passed‑in arrays; DeckStore defensively freezes them.
 */

import type { CardCopy, CardID } from '@/types/card';
import { DeckList } from './DeckList';

export type SeatPool   = readonly CardCopy[];
export type SeatMains  = readonly CardID[];
export type AllPools   = readonly SeatPool[];
export type AllMains   = readonly SeatMains[];

export class DeckStore {
  private readonly lists: DeckList[];         // one per seat
  /** Fired after *any* mutation across any seat. */
  public onChange?: () => void;

  /* seat‑scoped subscriptions */
  private subs = new Map<number, Set<() => void>>();

  constructor(pools: AllPools, mainIds: AllMains = []) {
    // freeze top‑level pools so outside callers can’t mutate under us
    const frozenPools = pools.map(p => Object.freeze([...p])) as AllPools;

    this.lists = frozenPools.map((pool, i) =>
      new DeckList(i, pool, mainIds[i] ?? [])
    );
  }

  /*───────────────── seat access ─────────────────*/
  seatCount(): number { return this.lists.length; }

  getSeat(i: number): DeckList {
    const seat = this.lists[i];
    if (!seat) throw new Error(`DeckStore: invalid seat ${i}`);
    return seat;
  }

  /* convenience passthroughs */
  getPool(i: number)      { return this.getSeat(i).getPool(); }
  getPoolCount(i: number) { return this.getSeat(i).getPoolCount(); }
  getDeck(i: number)      { return this.getSeat(i).getMain(); }
  getDeckIds(i: number)   { return this.getSeat(i).getMainIds(); }
  getDeckCount(i: number) { return this.getSeat(i).getMainCount(); }
  getSide(i: number)      { return this.getSeat(i).getSide(); }
  getSideCount(i: number) { return this.getSeat(i).getSideCount(); }

  /*───────────────── mutation ─────────────────*/
  /** Add by pool index */
  addToMain(seat: number, poolIdx: number) {
    this.getSeat(seat).addToMainByPoolIdx(poolIdx);
    this.fire(seat);
  }

  /** Add a specific card ID at optional position */
  addToMainId(seat: number, id: CardID, at?: number) {
    this.getSeat(seat).addToMainId(id, at);
    this.fire(seat);
  }

  /** Remove main entry by index */
  removeFromMain(seat: number, mainIdx: number) {
    this.getSeat(seat).removeFromMain(mainIdx);
    this.fire(seat);
  }

  /** Remove first occurrence of ID */
  removeId(seat: number, id: CardID) {
    this.getSeat(seat).removeId(id);
    this.fire(seat);
  }

  /** Clear the seat's mainboard */
  clearMain(seat: number) {
    this.getSeat(seat).clearMain();
    this.fire(seat);
  }

  /** Replace entire mainboard */
  importMainIds(seat: number, ids: readonly CardID[]) {
    this.getSeat(seat).importMainIds(ids);
    this.fire(seat);
  }

  /*───────────────── serialisation ─────────────────*/
  /** Serialize *all* seats: CardID[][] */
  serialise(): CardID[][] {
    return this.lists.map(l => l.toJSON());
  }

  /*───────────────── subscriptions ─────────────────*/
  /** Subscribe to changes for a specific seat. */
  subscribe(seat: number, fn: () => void) {
    if (!this.subs.has(seat)) this.subs.set(seat, new Set());
    this.subs.get(seat)!.add(fn);
    return () => this.subs.get(seat)!.delete(fn);
  }

  /** Internal: fire seat listeners + global change callback. */
  private fire(seat: number) {
    this.onChange?.();
    this.subs.get(seat)?.forEach(fn => fn());
  }
}