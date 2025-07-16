import {sample} from '@/lib/sample';   // tiny helper that returns N random elements
import { buckets } from '@/lib/buckets';

export function createBooster(): Card[] {
  // Rare slot
  const rareSlot =
    Math.random() < .125
      ? sample(buckets.mythic, 1)
      : sample(buckets.rare, 1);

  // Uncommons + Commons
  const uncommon = sample(buckets.uncommon, 3);
  const common   = sample(buckets.common, 10);

  // Land slot
  const land = sample(buckets.land, 1);

  // Foil replacement (12.5 %)
  if (Math.random() < .125) {
    const foilRarity = rollFoilRarity();
    const foilCard   = sample(buckets[foilRarity], 1)[0];

    // Swap out one random common
    const i = Math.floor(Math.random() * (common.length - 1));
    common[common.length - 1] = foilCard;
	
  }

  return [...rareSlot, ...uncommon, ...common, ...land];
}

function rollFoilRarity() {
  const r = Math.random();
  if (r < .077)        return 'mythic';
  else if (r < .231)          return 'rare';      // note cumulative
  if (r < .539)        return 'uncommon';
  return 'common';
}

