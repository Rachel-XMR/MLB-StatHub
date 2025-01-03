import React, { useState } from "react";
import PlayerSelector from "./playerSelector";

function App() {
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Fan Highlights System</h1>
      <PlayerSelector
        selectedPlayers={selectedPlayers}
        setSelectedPlayers={setSelectedPlayers}
      />
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Summary</h2>
        <ul>
          {selectedPlayers.map((id) => (
            <li key={id}>Player ID: {id}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;