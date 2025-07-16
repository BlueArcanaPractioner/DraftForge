// lib/pod.ts ---------------------------------------------------------------
import { createBooster } from '@/lib/createBooster';
import type { Card } from '@/types/card';

const SEATS            = 8;   // players per pod
const PACKS_PER_PLAYER = 3;   // three rounds
const PICKS_PER_PACK   = 15;  // cards per pack

type Direction = 'left' | 'right';

export class Pod {
  /** drafted piles  */
  seats: Card[][] = Array.from({ length: SEATS }, () => []);
  /** packs currently being passed */
  currentPacks: (Card[] | null)[] = Array(SEATS).fill(null);

  round  = 0;                // 0, 1, 2
  pick   = 0;                // 0-14 within a pack
  dir: Direction = 'left';   // start passing left

  constructor() {
    this.dealNewRound();     // create first 8 packs
  }

  /** create 1 pack per seat for the new round */
  private dealNewRound() {
    this.currentPacks = Array.from({ length: SEATS }, () => createBooster());
    this.pick   = 0;
    this.dir    = this.round === 1 ? 'right' : 'left'; // L-R-L
  }

  /** advance one “everyone picks a card” step */
  advance(userPickIndex: number) {
    const nextPacks = Array<Card[] | null>(SEATS).fill(null);

	for (let seat = 0; seat < SEATS; seat++) {
	  const pack = this.currentPacks[seat];
	  if (!pack || pack.length === 0) continue;

	  // === 1 ▸ pick a card (clone first so we don’t mutate original) ===
	  const newPack = [...pack];
	  const picked =
		seat === 0
		  ? newPack.splice(userPickIndex, 1)[0]   // player’s choice
		  : newPack.splice(0, 1)[0];              // bot takes first card

	  this.seats[seat].push(picked);

	  // === 2 ▸ pass the remaining pack (if any) ========================
	  if (newPack.length > 0) {
		const delta  = this.dir === 'left' ? 1 : -1;
		const target = (seat + delta + SEATS) % SEATS;
		nextPacks[target] = newPack;
	  }
	}


    this.currentPacks = nextPacks;
    this.pick++;

    // === 3. If all packs emptied, start next round =======================
    const packsRemaining = this.currentPacks.some(p => p && p.length);
    if (!packsRemaining) {
      this.round++;
      if (this.round < PACKS_PER_PLAYER) this.dealNewRound();
    }
  }

  /** quick helper: is the draft finished? */
  isDone() {
    return this.round >= PACKS_PER_PLAYER;
  }
}
