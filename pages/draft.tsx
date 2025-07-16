import React, { useState } from 'react';
import type { GetStaticProps } from 'next';
import type { Card } from '@/types/card';
import { Pod } from '@/lib/pod';
import { useRouter } from 'next/router';

type Props = { firstPack: Card[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  // SSR needs something; we'll overwrite it immediately on the client
  return { props: { firstPack: [] } };
};

export default function DraftPage() {
  // the pod is created once and kept in a ref
  const [pod] = useState(() => new Pod());

  // reactive seat-0 state
  const [pack, setPack]       = useState<Card[]>(pod.currentPacks[0]!);
  const [pool, setPool]       = useState<Card[]>(pod.seats[0]);
  const [done, setDone]       = useState<boolean>(false);
  const router = useRouter();

  function handlePick(idx: number) {
	const currentPack = [...pack];            // clone before mutating
	const pickedCard  = currentPack[idx];
    if (done || idx < 0 || idx >= pack.length) return;

    pod.advance(idx);
    setPool([...pod.seats[0]]);
    setPack(pod.currentPacks[0] ?? []);
    setDone(pod.isDone());
	if (pod.isDone() && typeof window !== 'undefined') {
	  localStorage.setItem('draftSeats', JSON.stringify(pod.seats));
	  router.push('/deck');     
	}
  }

  return (
    <div className="flex h-screen">
      {/* ░▒ Left: current pack ▒░ */}
      <div className="w-2/3 p-4 overflow-y-auto border-r">
        <h2 className="text-xl font-semibold mb-2">
          {done ? 'Draft Finished' : `Pack (${pack.length} cards left)`}
        </h2>

        <div className="grid grid-cols-5 gap-2">
          {pack.map((card, i) => (
            <div
              key={card.oracle_id}
              onClick={() => handlePick(i)}
              className={
                'cursor-pointer border rounded overflow-hidden shadow hover:ring-4 ' +
                (done ? 'opacity-40 pointer-events-none' : '')
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

        {!done && pack.length === 0 && (
          <p className="mt-4 italic text-zinc-500">
            Waiting for bots to pass their packs …
          </p>
        )}
      </div>

      {/* ░▒ Right: your drafted pool ▒░ */}
      <div className="w-1/3 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">
          Your Picks ({pool.length})
        </h2>
        <ul className="space-y-1 text-sm">
          {pool.map(card => (
            <li key={card.oracle_id} className="relative group">
			  {card.name}
			  <span className="italic text-xs">({card.rarity})</span>

			  {/* hidden image pops on hover */}
			  <img
				src={card.image}
				alt={card.name}
				className="absolute z-50 left-50 top-0 ml-2 w-48 rounded shadow-xl hidden group-hover:block"
			  />
			</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
