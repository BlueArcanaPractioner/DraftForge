import fs from 'fs';
import fetch from 'node-fetch';

async function fetchSet() {
  const res = await fetch('https://api.scryfall.com/cards/search?q=set:FIN&order=collector_number&unique=prints');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const cards = [...json.data];
  let next = json.has_more ? json.next_page : null;

  while (next) {
    const r = await fetch(next);
    const j = await r.json();
    cards.push(...j.data);
    next = j.has_more ? j.next_page : null;
  }

  return cards;
}

async function main() {
  console.log('Fetching Final Fantasy cards...');
  const cards = await fetchSet();
  console.log(`Fetched ${cards.length} cards.`);

  fs.writeFileSync('data/ff_cards.json', JSON.stringify(cards, null, 2));
  console.log('Saved to data/ff_cards.json');
}

main().catch(console.error);
