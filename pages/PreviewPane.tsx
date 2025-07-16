import React from 'react';
import type { Card, CardCopy } from '@/types/card';

export interface PreviewPaneProps { card?: Card | CardCopy }

/* Prevent layout thrash by constraining width */
export function PreviewPane({ card }: PreviewPaneProps) {
  if (!card) {
    return <p className="italic text-zinc-500">Select a card to preview…</p>;
  }
  return (
    <div className="space-y-2 max-w-[340px] mx-auto">
      <img
        src={card.image}
        alt={card.name}
        className="w-full rounded shadow"
      />
      <h3 className="font-semibold">{card.name}</h3>
      <p className="text-sm whitespace-pre-line text-zinc-700">
        {card.oracle_text ?? 'No rules text available.'}
      </p>
    </div>
  );
}
