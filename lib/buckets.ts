import type { Card } from '@/types/card';
import core from '@/scripts/data/ff_core.json';

export type RarityBuckets = {
  land: Card[];
  common: Card[];
  uncommon: Card[];
  rare: Card[];
  mythic: Card[];


};

export function buildBuckets(cards: Card[]): RarityBuckets {
  const initial: RarityBuckets = {
    land: [], common: [], uncommon: [], rare: [], mythic: []
  };
	  console.log(core.length);
  return cards.reduce((b, c) => {
	  
    if (c.rarity === 'common' && /Basic Land/i.test(c.type_line)) {
      b.land.push(c);
    } else if (c.rarity === 'common') {
      b.common.push(c);
    } else if (c.rarity === 'uncommon') {
      b.uncommon.push(c);
    } else if (c.rarity === 'rare') {
      b.rare.push(c);
    } else if (c.rarity === 'mythic') {
      b.mythic.push(c);
    }
    return b;                       // must return accumulator
  }, initial);
}



export const buckets = buildBuckets(core);
