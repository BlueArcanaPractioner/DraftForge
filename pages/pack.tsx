import React, { useState } from 'react';
import type { GetStaticProps } from 'next';
import type { Card } from '@/types/card';
import { createBooster } from '@/lib/createBooster';

type Props = { firstPack: Card[] };

// build one pack at compile-time so SSR works
export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { firstPack: createBooster() } };
};

export default function PackPage({ firstPack }: Props) {
  const [pack, setPack] = useState<Card[]>(firstPack);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Draft-style Booster</h1>

      <button
        onClick={() => {
          setPack(createBooster());
          setSelectedId(null);
        }}
        className="px-3 py-1 rounded bg-blue-600 text-white shadow hover:bg-blue-700"
      >
        New Pack
      </button>
        <div className="grid grid-cols-5 gap-2">
  {pack.map(card => (
    <div
      key={card.oracle_id}
      onClick={() => setSelectedId(card.oracle_id)}
      className={
        'cursor-pointer border rounded overflow-hidden shadow ' +
        (selectedId === card.oracle_id ? 'ring-4 ring-yellow-400' : '')
      }
      title={`${card.name} (${card.rarity})`}
    >
      <img
        src={card.image}
        alt={card.name}
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  ))}
</div>
    </div>
  );
}
