import React, { useState, useEffect } from 'react';
import { fetchProtectedData } from './api';
import translateText  from './translationServer';

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


const PlayerSelector = ({ language, onLoad }) => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerImages, setPlayerImages] = useState({});
  const [translatedText, setTranslatedText] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [playerTeams, setPlayerTeams] = useState({});
  const [teamsLoaded, setTeamsLoaded] = useState(false)

  const getToken = () => {
    const token = localStorage.getItem('authToken');
    return token;
  }

  // Fetch user's selected players
  useEffect(() => {
  const fetchUserPlayersAndImages = async () => {
    try {
      const players = await fetchProtectedData('http://127.0.0.1:5000/user/players');
      setSelectedPlayers(players);
      await fetchPlayerImages();
      await fetchPlayerTeams();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('authToken');
        setError('Please log in again');
      } else {
        setError(err.message || 'Failed to load your players. Please try again later.');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
      if (onLoad) {
        onLoad();
      }
    }
  };

  const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserPlayersAndImages();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAddPlayer = async () => {
    const token = getToken();
    if (!token) {
      setError('Please log in to add players.');
      return;
    }

    if (!/^\d{6}$/.test(playerId)) {
      setError("Player ID must be a 6-digit number.");
      return;
    }

    const id = parseInt(playerId, 10);

    if (selectedPlayers.some((player) => player.id === id)) {
      setError("Player is already selected.");
      return;
    }

    try {
      // Check if player exists in MLB database
      const newPlayerData = await searchPlayerInDBbyID(id);
      if (!newPlayerData) {
        setError("Player not found.");
        return;
      }

      // Add player to user's list
      await fetchProtectedData('http://127.0.0.1:5000/user/players', {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
      });

      // Update local state with the new player
      setSelectedPlayers([...selectedPlayers, newPlayerData]);
      setPlayerId('');
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('authToken');
        setError('Please log in again');
      } else {
        setError(err.message || 'Failed to add player. Please try again later.');
      }
      console.error('Error:', err);
      }
    };

  const handleRemovePlayer = async (playerId) => {
    try {
      await fetchProtectedData(`http://127.0.0.1:5000/user/players/${playerId}`, {
        method: 'DELETE',
      });
      // Update the local state
      setSelectedPlayers(selectedPlayers.filter(player => player.id !== playerId));
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('authToken');
        setError('Please log in again');
      } else {
        setError(err.message || 'Failed to remove player. Please try again later.');
      }
      console.error('Error:', err);
    }
  };

  // Fetch headshot image for each player
  const fetchPlayerImages = async () => {
    try {
      const images = await fetchProtectedData('http://127.0.0.1:5000/user/players/images');
      const newImages = {};
      for (const playerId in images) {
        newImages[playerId] = images[playerId];
      }

      setPlayerImages(images);
      setImagesLoaded(true);
    } catch (err) {
      console.error('Failed to fetch player images:', err);
    }
  };

  const fetchPlayerTeams = async () => {
    try {
      const teams = await fetchProtectedData('http://127.0.0.1:5000/user/players/teams');
      setPlayerTeams(teams);
      setTeamsLoaded(true)
    } catch (error) {
      console.error("Failed to fetch player teams:", error);
    }
  };

  const translateContent = async () => {
    try {
      const translations = await Promise.all([ // Translate all texts concurrently for efficiency
        translateText("MLB Player Selector", language),
        translateText("Add Player", language),
        translateText("Selected Players", language),
        translateText("Position:", language),
        translateText("Number:", language),
        translateText("Debut Date:", language),
        translateText("Age:", language),
        translateText("Height:", language),
        translateText("Weight:", language),
        translateText("Batting:", language),
        translateText("Pitching:", language),
        translateText("From:", language),
        translateText("Nickname:", language),
        translateText("Strike Zone:", language),
        translateText("No players selected. Add players using their MLB ID.", language),
        translateText("Remove", language),
        translateText("Team", language)
      ]);

      setTranslatedText({
        mlb_selector: translations[0],
        addPlayerButton: translations[1],
        selected_players: translations[2],
        position: translations[3],
        number: translations[4],
        debutDate: translations[5],
        age: translations[6],
        height: translations[7],
        weight: translations[8],
        batting: translations[9],
        pitching: translations[10],
        from: translations[11],
        nickname: translations[12],
        strikeZone: translations[13],
        noPlayers: translations[14],
        remove: translations[15],
        team: translations[16],
      });
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  useEffect(() => {
    translateContent();
  }, [language]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto backdrop-blur-lg">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
        {translatedText.mlb_selector || "MLB Player Selector"}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder="Enter 6-digit Player ID"
          className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-500"
        />
        <button
          onClick={handleAddPlayer}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {translatedText.addPlayerButton || "Add Player"}
        </button>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-200 mb-6">
          {translatedText.selected_players || "Selected Players"}
        </h3>
        {selectedPlayers.length > 0 ? (
          <div className="space-y-6">
            {selectedPlayers.map((player) => (
              <div key={player.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="flex justify-between items-start gap-6">
                  {playerImages[player.id] && imagesLoaded && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"></div>
                      <img
                        src={playerImages[player.id]}
                        alt={`${player.fullName} headshot`}
                        className="w-24 h-24 rounded-full object-cover relative z-10"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-200">{player.fullName}</h4>
                      <span className="text-sm text-blue-400">#{player.id}</span>
                    </div>
                    {playerTeams[player.id] && teamsLoaded && (
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-blue-400">{translatedText.team || "Team:"}</span>{" "}
                        {playerTeams[player.id].teamName}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      {[
                        { label: translatedText.position || "Position:", value: player.primaryPosition },
                        { label: translatedText.number || "Number:", value: `#${player.primaryNumber}` },
                        { label: translatedText.debutDate || "Debut Date:", value: player.mlbDebutDate },
                        { label: translatedText.age || "Age:", value: player.currentAge },
                        { label: translatedText.height || "Height:", value: player.height },
                        { label: translatedText.weight || "Weight:", value: `${player.weight} lbs` },
                        { label: translatedText.batting || "Batting:", value: player.batSide },
                        { label: translatedText.pitching || "Pitching:", value: player.pitchHand }
                      ].map(({ label, value }) => (
                        <p key={label} className="text-slate-300">
                          <span className="font-semibold text-blue-400">{label}</span> {value}
                        </p>
                      ))}
                      <p className="col-span-2 text-slate-300">
                        <span className="font-semibold text-blue-400">{translatedText.from || "From:"}</span>{" "}
                        {player.birthCity}, {player.birthCountry}
                      </p>
                      {player.nickName && (
                        <p className="col-span-2 text-slate-300">
                          <span className="font-semibold text-blue-400">{translatedText.nickname || "Nickname:"}</span>{" "}
                          {player.nickName}
                        </p>
                      )}
                      {player.strikeZoneTop && player.strikeZoneBottom && (
                        <p className="col-span-2 text-slate-300">
                          <span className="font-semibold text-blue-400">{translatedText.strikeZone || "Strike Zone:"}</span>{" "}
                          {player.strikeZoneBottom.toFixed(2)} - {player.strikeZoneTop.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all duration-300 text-sm border border-red-500/20 hover:border-red-500/30"
                  >
                    {translatedText.remove || "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 text-center py-8 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            {translatedText.noPlayers || "No players selected. Add players using their MLB ID."}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSelector;