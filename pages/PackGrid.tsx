// PackGrid.tsx – stable 5×3 grid, minimal hover churn.
import React from 'react';
import type { Card, CardCopy } from '@/types/card';

export interface PackGridProps {
  cards: readonly (Card | CardCopy)[];
  selectedIdx?: number | null;
  onSelect?: (i: number) => void;    // highlight only
  onPick?: (i: number) => void;       // commit (double‑click / button)
  onHover?: (card: Card | CardCopy | undefined) => void;
}

/*
 * Rationale for simplification:
 * • Do not clear hover on leave; parent preview remains steady (prevents resize spasms).
 * • Fixed grid to 5 columns (good for 15 card packs: 5×3) w/ max width for layout stability.
 */
export function PackGrid({ cards, selectedIdx = null, onSelect, onPick, onHover }: PackGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 p-4 overflow-y-auto w-full max-w-[650px]">
      {cards.map((card, i) => (
        <img
          key={(card as any)._uid ?? card.oracle_id + '-' + i}
          src={card.image}
          alt={card.name}
          onClick={() => onSelect?.(i)}
          onClick={() => onPick?.(i)}
          onMouseEnter={() => onHover?.(card)}
          className={`w-full rounded cursor-pointer shadow transition-transform duration-75 hover:scale-[1.03] ${
            i === selectedIdx ? 'ring-4 ring-indigo-400' : ''
          }`}
        />
      ))}
    </div>
  );
}
