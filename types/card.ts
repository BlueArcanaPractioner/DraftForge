export type Card = {
  oracle_id: string;
  name: string;
  mana_cost: string;
  type_line: string;
  oracle_text?: string;
  colors: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  image: string;
};

export type CardID = string;

// Every drafted card instance gets a stable ID.
export type CardCopy = Card & { _uid: CardID };