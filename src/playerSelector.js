import React, { useState } from 'react';

const searchPlayerInDBbyID = async (id) => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/player/${id}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data.error || "Failed to fetch player data.");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching player data:", error);
    return null;
  }
};


const PlayerSelector = () => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerId, setPlayerId] = useState("");

  const handleAddPlayer = async () => {
    if (!/^\d{6}$/.test(playerId)) {
      alert("Player ID must be a 6-digit number.");
      return;
    }

    const id = parseInt(playerId, 10);

    if (selectedPlayers.some((player) => player.id === id)) {
      alert("Player is already selected.");
      return;
    }

    const playerData = await searchPlayerInDBbyID(id);
    if (!playerData) {
      alert("Player not found in the database.");
      return;
    }

    setSelectedPlayers((prev) => [...prev, playerData]);
    setPlayerId("");
  };

  const handleRemovePlayer = (idToRemove) => {
    setSelectedPlayers((prev) => prev.filter((player) => player.id !== idToRemove));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">MLB Player Selector</h2>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder="Enter 6-digit Player ID"
          className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleAddPlayer}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Add Player
        </button>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Selected Players</h3>
        {selectedPlayers.length > 0 ? (
          <div className="space-y-4">
            {selectedPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-md transition duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-blue-900">{player.fullName}</h4>
                      <span className="text-sm text-gray-500">#{player.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <p><span className="font-semibold">Position:</span> {player.primaryPosition}</p>
                      <p><span className="font-semibold">Number:</span> #{player.primaryNumber}</p>
                      <p><span className="font-semibold">Debut Date:</span> {player.mlbDebutDate}</p>
                      <p><span className="font-semibold">Age:</span> {player.currentAge}</p>
                      <p><span className="font-semibold">Height:</span> {player.height}</p>
                      <p><span className="font-semibold">Weight:</span> {player.weight} lbs</p>
                      <p><span className="font-semibold">Batting:</span> {player.batSide}</p>
                      <p><span className="font-semibold">Pitching:</span> {player.pitchHand}</p>
                      <p className="col-span-2">
                        <span className="font-semibold">From:</span> {player.birthCity}, {player.birthCountry}
                      </p>
                      {player.nickName && (
                          <p className="col-span-2">
                            <span className="font-semibold">Nickname:</span> {player.nickName}
                          </p>
                      )}
                      {player.strikeZoneTop && player.strikeZoneBottom && (
                          <p className="col-span-2">
                            <span
                                className="font-semibold">Strike Zone:</span> {player.strikeZoneBottom.toFixed(2)} - {player.strikeZoneTop.toFixed(2)}
                          </p>
                      )}
                    </div>
                  </div>
                  <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition duration-200 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              No players selected. Add players using their MLB ID.
            </p>
        )}
      </div>
    </div>
  );
};

export default PlayerSelector;