import React, { useState } from "react";

// Function to fetch player data from the API
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
  // Define `selectedPlayers` state
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerId, setPlayerId] = useState("");

  const handleAddPlayer = async () => {
    // Validate input
    if (!/^\d{6}$/.test(playerId)) {
      alert("Player ID must be a 6-digit number.");
      return;
    }

    const id = parseInt(playerId, 10);

    // Check for duplicates
    if (selectedPlayers.some((player) => player.id === id)) {
      alert("Player is already selected.");
      return;
    }

    // Fetch player data
    const playerData = await searchPlayerInDBbyID(id);
    if (!playerData) {
      alert("Player not found in the database.");
      return;
    }

    // Add player to the list
    setSelectedPlayers((prev) => [...prev, playerData]);
    setPlayerId(""); // Clear input field
  };

  const handleRemovePlayer = (idToRemove) => {
    setSelectedPlayers((prev) => prev.filter((player) => player.id !== idToRemove));
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-4">Player Selector</h2>

      {/* Input Field */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Player ID"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAddPlayer}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Player
        </button>
      </div>

      {/* Selected Players */}
      <div>
        <h3 className="text-md font-semibold mb-2">Selected Players:</h3>
        {selectedPlayers.length > 0 ? (
          <ul>
            {selectedPlayers.map((player) => (
              <li key={player.id} className="mb-4 border-b pb-2">
                <strong>{player.fullName}</strong> (ID: {player.id}) - Position: {player.primaryPosition}
                <br />
                Age: {player.currentAge}, Height: {player.height}, Weight: {player.weight}
                <br />
                Birthplace: {player.birthCity}, {player.birthCountry}
                <br />
                Nickname: {player.nickName || "N/A"}, Debut: {player.debutDate}
                <br />
                Batting: {player.batSide}, Pitching: {player.pitchHand}
                <br />
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No players selected yet.</p>
        )}
      </div>
    </div>
  );
};

export default PlayerSelector;