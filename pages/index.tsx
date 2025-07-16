import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const mockCardPack = [
  { name: "Cloud Strife, Soldier 1st Class", color: "White", type: "Creature", manaCost: "3W", rarity: "Mythic" },
  { name: "Ifrit, Flame Avatar", color: "Red", type: "Creature", manaCost: "4R", rarity: "Rare" },
  { name: "Potion", color: "Colorless", type: "Artifact", manaCost: "1", rarity: "Common" },
];

export default function DrafterApp() {
	const [draftPool, setDraftPool] = useState([]);
	const [pack, setPack] = useState(mockCardPack);
	
	const handlePick = (card) => {
		setDraftPool([...draftPool,card]);
		setPack(pack.filter(c => c!== card));
};

return (

	<div className="p-4 grid grid-cols-1 gap-4">
		<h1 className="text-2x1 font-bold">FF Universes Beyond Draft</h1>
	
	<Card>
        <CardContent>
          <h2 className="text-xl font-semibold">Current Pack</h2>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {pack.map((card, index) => (
              <div key={index} className="border rounded p-2">
                <p><strong>{card.name}</strong></p>
                <p>{card.type} - {card.color}</p>
                <p>Mana: {card.manaCost}</p>
                <Button onClick={() => handlePick(card)}>Pick</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold">Your Picks</h2>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {draftPool.map((card, index) => (
              <div key={index} className="border rounded p-2">
                <p><strong>{card.name}</strong></p>
                <p>{card.type} - {card.color}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
	  	<Link href="/browse" className="text-blue-600 underline">
			Browse FF Set
		</Link>
			  	<Link href="/pack" className="text-blue-600 underline">
			Open packs
		</Link>
			  	<Link href="/draft" className="text-blue-600 underline">
			Draft
		</Link>
    </div>

  );
}
