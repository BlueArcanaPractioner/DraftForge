import React, { useCallback, useEffect, useState } from 'react';
import type { Card } from '@/types/card';

// ────────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ────────────────────────────────────────────────────────────────────────────────
export type CardCopy = Card & { _uid: string };

const mkCopy = (c: Card): CardCopy => ({
  ...c,
  _uid: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
});

const hydrate = (raw: Card[][] | undefined | null): CardCopy[][] =>
  Array.isArray(raw) ? raw.map(seat => seat.map(mkCopy)) : [];

const serialise = (data: CardCopy[][]): Card[][] =>
  data.map(seat => seat.map(({ _uid, ...rest }) => rest));

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
export default function DeckBuilder() {
  // Pools per seat (immutable except via picks)
  const [seats, setSeats] = useState<CardCopy[][]>([]);
  // Decks per seat (what the user actually builds)
  const [decks, setDecks] = useState<CardCopy[][]>([]);

  const [seatIdx, setSeatIdx] = useState(0);
  const [pool, setPool]       = useState<CardCopy[]>([]);
  const [deck, setDeck]       = useState<CardCopy[]>([]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Bootstrap from localStorage once
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedPools = hydrate(JSON.parse(localStorage.getItem('draftSeats') ?? 'null'));
    const storedDecks = hydrate(JSON.parse(localStorage.getItem('draftDecks') ?? 'null'));

    setSeats(storedPools);

    // ensure decks has same length as seats
    if (storedPools.length) {
      while (storedDecks.length < storedPools.length) storedDecks.push([]);
    }
    setDecks(storedDecks);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // When seats or decks change length, guarantee parity between them
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seats.length) return;
    setDecks(prev => {
      const copy = [...prev];
      while (copy.length < seats.length) copy.push([]);
      return copy;
    });
  }, [seats.length]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Swap active seat ⇒ refresh local pool & deck (no destructive clears)
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seats.length) return;
    setPool([...seats[seatIdx]]);
    setDeck([...decks[seatIdx]]);
  }, [seatIdx, seats, decks]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Persist any seat/deck mutation back to localStorage
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('draftSeats', JSON.stringify(serialise(seats)));
    localStorage.setItem('draftDecks', JSON.stringify(serialise(decks)));
  }, [seats, decks]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────────
  const mutate = (
    idx: number,
    from: CardCopy[],
    setFrom: React.Dispatch<React.SetStateAction<CardCopy[]>>,
    to: CardCopy[],
    setTo: React.Dispatch<React.SetStateAction<CardCopy[]>>,
    updatePool: boolean
  ) => {
    const nextFrom = [...from];
    const [card]   = nextFrom.splice(idx, 1);
    if (!card) return;

    setFrom(nextFrom);
    setTo(prev => [...prev, card]);

    if (updatePool) {
      // pool changed
      setSeats(prev => {
        const cp = [...prev];
        cp[seatIdx] = nextFrom;
        return cp;
      });
      setDecks(prev => {
        const cp = [...prev];
        cp[seatIdx] = [...to, card];
        return cp;
      });
    } else {
      // deck changed (moving card back to pool)
      setDecks(prev => {
        const cp = [...prev];
        cp[seatIdx] = nextFrom;
        return cp;
      });
    }
  };

  const addCard    = (i: number) => mutate(i, pool, setPool, deck, setDeck, true);
  const removeCard = (i: number) => mutate(i, deck, setDeck, pool, setPool, false);

  // ──────────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold">Deck Builder</h1>
        <label className="text-sm">
          View Seat:
          <select
            value={seatIdx}
            onChange={e => setSeatIdx(Number(e.target.value))}
            className="ml-2 px-2 py-1 border rounded"
          >
            {seats.map((_, i) => (
              <option key={i} value={i}>
                {i === 0 ? '0 (You)' : i}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Pool */}
        <section className="w-1/2 p-4 border-r overflow-y-auto">
          <h2 className="font-semibold mb-2 text-lg">Pool ({pool.length})</h2>
          <ul className="space-y-1 text-sm">
            {pool.map((card, i) => (
              <li
                key={card._uid}
                className="relative group cursor-pointer select-none"
                onClick={() => addCard(i)}
              >
                {card.name}
                <span className="italic text-xs text-zinc-600"> ({card.rarity})</span>
                {card.image && (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="absolute z-40 left-full ml-2 w-40 rounded shadow-xl hidden group-hover:block"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Deck */}
        <section className="w-1/2 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-2 text-lg">Deck ({deck.length} / 40 suggested)</h2>
          {deck.length === 0 && (
            <p className="italic text-zinc-500">Click cards to add them to your deck.</p>
          )}
          <ul className="space-y-1 text-sm">
            {deck.map((card, i) => (
              <li
                key={card._uid}
                className="relative group cursor-pointer select-none"
                onClick={() => removeCard(i)}
              >
                {card.name}
                <span className="italic text-xs text-zinc-600"> ({card.rarity})</span>
                {card.image && (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="absolute z-40 left-full ml-2 w-40 rounded shadow-xl hidden group-hover:block"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}