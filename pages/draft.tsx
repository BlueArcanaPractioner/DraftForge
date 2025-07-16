import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import type { Card, CardCopy } from '@/types/card';
import { Pod, PACKS_PER_PLAYER } from '@/lib/pod';
import { PackGrid } from './PackGrid';
import { PreviewPane } from './PreviewPane';

// ────────────────────────────────────────────────────────────
// Config – tweak for dev/testing
// ────────────────────────────────────────────────────────────
const POD_SIZE  = 8;
const USER_SEAT = 0;

/* Stable ID helper */
const mkCopy = (c: Card | CardCopy): CardCopy => ({
  ...(c as Card),
  _uid: (c as any)._uid ?? (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
});

export default function DraftUI() {
  const router = useRouter();
  const pod = useMemo(() => new Pod(POD_SIZE), []);

  // user seat UI state
  const [pack,  setPack]  = useState<Card[]>(pod.currentPacks[USER_SEAT] ?? []);
  const [hover, setHover] = useState<Card | undefined>();
  const [done,  setDone]  = useState(false);
  const [poolVersion, setPoolVersion] = useState(0); // bump when picks change

  // pick immediately on click -------------------------------------------------
  function handlePick(i: number) {
    pod.advance(i);             // user pick + bots + pass + round rollover
    syncFromPod();
    setPoolVersion(v => v + 1); // trigger pool re-render
  }

  function syncFromPod() {
    const newPack = pod.currentPacks[USER_SEAT] ?? [];
    setPack(newPack);
    setHover(undefined); // prevent stale preview between packs

    const finished = pod.isDone();
    setDone(finished);
    if (finished) persistAndGo();
  }

  function persistAndGo() {
    const pools: CardCopy[][] = pod.seats.map(seat => seat.map(mkCopy));
    localStorage.setItem('draftPools', JSON.stringify(pools));
    localStorage.setItem('draftDeckIDs', JSON.stringify(pools.map(() => [])));
    router.push('/deck');
  }

  // preview is hover only now (click = pick)
  const preview = hover;

  // derived: user pool (live from pod)
  const userPool = pod.seats[USER_SEAT]; // mutates in pod; poolVersion forces re-render

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-grow overflow-hidden">
        {/* Pack grid */}
        <PackGrid
          cards={pack}
          selectedIdx={null}
          onPick={i => handlePick(i)}
          onHover={c => setHover(c as Card)}
        />
        {/* Right column: preview + your picks */}
        <div className="w-72 p-4 border-l overflow-y-auto space-y-6">
          <PreviewPane card={preview} />
        </div>
		<div
  className="border-t p-2 flex flex-wrap gap-1 bg-zinc-50"
  onMouseLeave={() => setHover(undefined)} // clear once when leaving whole pool
>
  {userPool.map((card, i) => (
    <img
      key={card.oracle_id + '-' + i}        // stable; no _uid yet in draft
      src={card.image}
      alt={card.name}
      className="h-12 rounded shadow cursor-pointer"
      onMouseEnter={() => setHover(card)}
    />
  ))}
  </div>
      </div>

      {/* footer status only (no pick button) */}
      <footer className="p-2 text-xs text-zinc-600 border-t bg-white/70 backdrop-blur-sm flex justify-between">
        <span>Pack {pod.round + 1} / {PACKS_PER_PLAYER}</span>
        <span>Cards in pack: {pack.length}</span>
        <span>Your pool: {userPool.length}</span>
      </footer>

      {done && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 text-white text-xl">Draft complete! Redirecting…</div>
      )}
    </div>
  );
}
