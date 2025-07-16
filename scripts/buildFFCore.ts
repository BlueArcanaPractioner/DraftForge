import raw from '@/scripts/data/ff_cards.json';
import fs from 'fs';

// keep en, paper, non-duplicate oracle_ids
const core: Card[] = Object.values(
  raw
    .filter(c => !c.digital && c.lang === 'en')
    .reduce((m, c) => {
      if (!m[c.oracle_id] ||
          Number(c.collector_number) < Number(m[c.oracle_id].collector_number)) {
        m[c.oracle_id] = {
          oracle_id: c.oracle_id,
          name: c.name,
          mana_cost: c.mana_cost,
          type_line: c.type_line,
          oracle_text: c.oracle_text,
          colors: c.colors,
          rarity: c.rarity as Card['rarity'],
		  image: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null
        };
      }
      return m;
    }, {} as Record<string, Card>)
);
fs.writeFileSync('data/ff_core.json', JSON.stringify(core, null, 2));
