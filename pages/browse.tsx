import React, { useState } from 'react';
import type { GetStaticProps } from 'next';
import type { Card } from '@/types/card';
import cards from '@/scripts/data/ff_core.json';          // the cleaned list you built

type Props = { cards: Card[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  // In real life you might load from FS here; we can import directly.
  return { props: { cards } };
};

export default function SetBrowser({ cards }: Props) {
  const [selected, setSelected] = useState<Card | null>(null);

  return (
    <div className="flex h-screen">
      {/* ░▒ Left – scrollable name list ▒░ */}
      <div className="w-1/3 overflow-y-auto border-r p-4 space-y-1">
        {cards.map(card => (
          <button
            key={card.oracle_id}
            onClick={() => setSelected(card)}
            className="block w-full text-left px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            {card.name}
          </button>
        ))}
      </div>

      {/* ░▒ Right – image or placeholder ▒░ */}
      <div className="flex-1 flex items-center justify-center p-4">
        {selected ? (
          <img
            src={selected.image}
            alt={selected.name}
            className="max-h-[90%] rounded shadow-lg"
          />
        ) : (
          <p className="text-zinc-500 italic">
            Select a card on the left …
          </p>
        )}
      </div>
    </div>
  );
}
