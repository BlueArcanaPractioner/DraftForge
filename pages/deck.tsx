import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardCopy, CardID } from '@/types/card';
import type { DraftPools, DeckIDs } from '@/types/DraftPool';
import { DeckStore } from '@/lib/deck/DeckStore';

/*─────────────────────────────────────────────────────────────────────────────*
 | LocalStorage Keys                                                            |
 *─────────────────────────────────────────────────────────────────────────────*/
const LS_POOLS = 'draftPools';     // CardCopy[][] – canonical drafted cards (each has _uid)
const LS_DECKS = 'draftDeckIDs';   // CardID[][]   – per‑seat ordered mainboard IDs

/*─────────────────────────────────────────────────────────────────────────────*
 | Helpers                                                                      |
 *─────────────────────────────────────────────────────────────────────────────*/
function isCardCopy(v: any): v is CardCopy { return v && typeof v._uid === 'string'; }

function loadPools(): DraftPools {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_POOLS) ?? 'null');
    if (!Array.isArray(raw)) return [];
    return raw.map((seat: any[]) => Array.isArray(seat) ? seat.filter(isCardCopy) : []);
  } catch { return []; }
}

function loadDeckIDs(pools: DraftPools): DeckIDs {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_DECKS) ?? 'null');
    if (Array.isArray(raw)) return raw as DeckIDs;
  } catch {}
  return pools.map(() => []);
}

/*─────────────────────────────────────────────────────────────────────────────*
 | Seat subscription hook                                                       |
 *─────────────────────────────────────────────────────────────────────────────*/
function useDeckSeat(store: DeckStore | null, seat: number) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!store) return;
    return store.subscribe(seat, () => setVersion(v => v + 1));
  }, [store, seat]);
  return {
    deck: store ? store.getDeck(seat) : [],
    side: store ? store.getSide(seat) : [],
    v: version,
  } as const;
}

/*─────────────────────────────────────────────────────────────────────────────*
 | Component                                                                    |
 *─────────────────────────────────────────────────────────────────────────────*/
export default function DeckBuilder() {
  const pools   = useMemo(loadPools, []);                     // static; needed only to size store
  const deckIDs = useMemo(() => loadDeckIDs(pools), [pools]);
  const store   = useMemo(() => new DeckStore(pools, deckIDs), [pools, deckIDs]);

  /* persist on change */
  useEffect(() => {
    store.onChange = () => {
      try { localStorage.setItem(LS_DECKS, JSON.stringify(store.serialise())); } catch {}
    };
  }, [store]);

  /* seat selection */
  const [seatIdx, setSeatIdx] = useState(0);
  const { deck, side } = useDeckSeat(store, seatIdx);

  /* mutations */
  const addFromSide = useCallback((card: CardCopy) => {
    store.addToMainId(seatIdx, card._uid);   // move from sideboard into deck
  }, [store, seatIdx]);

  const removeCard = useCallback((mainIdx: number) => {
    store.removeFromMain(seatIdx, mainIdx);  // removes from deck, returns to side (derived)
  }, [store, seatIdx]);

  /* row renderers */
  const SideThumb: React.FC<{card: CardCopy; onClick: ()=>void}> = ({card, onClick}) => (
    <img
      key={card._uid}
      src={card.image}
      alt={card.name}
      onClick={onClick}
      className="h-16 rounded shadow cursor-pointer hover:scale-[1.03] transition-transform"
    />
  );

  const DeckRow: React.FC<{card: CardCopy; i: number; onClick: ()=>void}> = ({card, i, onClick}) => (
    <li
      key={card._uid}
      className="relative group cursor-pointer select-none flex items-center gap-2 p-1 rounded hover:bg-indigo-50"
      onClick={onClick}
    >
      <img src={card.image} alt="" className="h-8 w-auto rounded shadow" />
      <span className="truncate text-sm">{card.name}</span>
      <span className="ml-auto text-xs italic text-zinc-500">{card.rarity}</span>
    </li>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* header */}
      <header className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold">Deck Builder</h1>
        <label className="text-sm flex items-center gap-2">
          Seat:
          <select
            value={seatIdx}
            onChange={e => setSeatIdx(Number(e.target.value))}
            className="px-2 py-1 border rounded"
          >
            {pools.map((_, i) => (
              <option key={i} value={i}>{i === 0 ? '0 (You)' : i}</option>
            ))}
          </select>
        </label>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* sideboard column */}
        <section className="w-1/2 p-4 border-r overflow-y-auto">
          <h2 className="font-semibold mb-2 text-lg">Sideboard ({side.length})</h2>
          <div className="flex flex-wrap gap-1">
            {side.map(card => (
              <SideThumb key={card._uid} card={card} onClick={() => addFromSide(card)} />
            ))}
          </div>
        </section>

        {/* deck column */}
        <section className="w-1/2 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-2 text-lg">Deck ({deck.length} / 40 suggested)</h2>
          {deck.length === 0 && (
            <p className="italic text-zinc-500">Click cards in the sideboard to add them.</p>
          )}
          <ul className="space-y-1 text-sm">
            {deck.map((card, i) => (
              <DeckRow key={card._uid} card={card} i={i} onClick={() => removeCard(i)} />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
