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
