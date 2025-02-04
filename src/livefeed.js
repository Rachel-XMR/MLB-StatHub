import React, { useState, useEffect } from 'react';
import { fetchProtectedData } from './api';
import translateText from './translationServer';

const LiveFeed = ({ language, onLoad }) => {
  const [selectedGame, setSelectedGame] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [liveFeedData, setLiveFeedData] = useState(null);
  const [translatedText, setTranslatedText] = useState({});
  const [translatedPlayDescription, setTranslatedPlayDescription] = useState('');

  // Generate years from 1901 to 2024
  const years = Array.from({ length: 2024 - 1901 + 1 }, (_, i) => (1901 + i).toString());

  // Filter years based on input
  const [yearFilter, setYearFilter] = useState('');
  const filteredYears = years.filter(year => year.startsWith(yearFilter));

  useEffect(() => {
    // Fetch saved game_pk on component mount
    fetchGamePreferences();
  }, []);

  // Fetch saved preferences on component mount
  const fetchGamePreferences = async () => {
    try {
        const data = await fetchProtectedData('http://localhost:5000/user/preference');
        console.log('Fetched preferences:', data);

        if (data && data.game_pk) {
            console.log('Found game_pk:', data.game_pk);
            await fetchLiveFeed(data.game_pk);
        } else {
            console.log('No game_pk found in response:', data);
        }
    } catch (err) {
        console.error('Error fetching preferences:', err);
    }
  };

  // Fetch live feed data for a specific game
  const fetchLiveFeed = async (gamePk) => {

    try {
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Validate the required data structure
      if (!data?.gameData || !data?.liveData) {
        throw new Error('Invalid live feed data structure');
      }

      setLiveFeedData(data);
      await translateDynamicContent(data);
    } catch (err) {
      setError('No live feed data available.');
    } finally {
      if (onLoad) {
        onLoad();
      }
    }
  };

  // Save preferences to flask endpoint
  const savePreferences = async () => {
    if (!selectedGame) {
        setError(translatedText.select_before || "Please select a game before saving");
        return;
    }

    setSaveStatus(translatedText.save_status || "Saving...");
    setError('');

    try {
        console.log("Sending preferences data:", { game_pk: selectedGame });
        await fetchProtectedData('http://localhost:5000/user/preference', {
            method: 'POST',
            body: JSON.stringify({ game_pk: selectedGame })
        });

        setSaveStatus(translatedText.preferences_saved || "Preferences saved successfully!");
        await fetchLiveFeed(selectedGame);
        setTimeout(() => setSaveStatus(''), 3000);

    } catch (err) {
        setError('Failed to save preferences');
        setSaveStatus('');
        console.error('Error saving preferences:', err);
    }
  };

  // Fetch games for selected season
  const fetchGames = async (season) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=${season}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const gamesData = data.dates.flatMap((date, dateIndex) =>
        date.games.map((game, gameIndex) => ({
          gamePk: game.gamePk,
          gameDate: new Date(game.gameDate).toLocaleDateString(),
          teams: `${game.teams.away.team.name} @ ${game.teams.home.team.name}`,
          uniqueId: `${dateIndex}-${gameIndex}-${game.gamePk}`
        }))
      );
      setGames(gamesData);
    } catch (err) {
      setError('Failed to fetch games');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const translateContent = async () => {
    try {
      const translations = await Promise.all([
        translateText("Game Selection", language),
        translateText("Filter Years", language),
        translateText("Start typing year...", language),
        translateText("Select Season", language),
        translateText("Select a year", language),
        translateText("Select Game", language),
        translateText("Select a game", language),
        translateText("Save Preferences", language),
        translateText("Live Game Feed", language),
        translateText("Loading games...", language),
        translateText("Saving...", language),
        translateText("Preferences saved successfully!", language),
        translateText("Please select a game before saving", language),
      ]);

      setTranslatedText({
        game_selection: translations[0],
        filter_years: translations[1],
        start_typing_year: translations[2],
        select_season: translations[3],
        select_a_year: translations[4],
        select_game: translations[5],
        select_a_game: translations[6],
        save_preferences: translations[7],
        live_game_feed: translations[8],
        loading_games: translations[9],
        save_status: translations[10],
        preferences_saved: translations[11],
        select_before: translations[12],
      });
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  // Dynamic Content Translation
  const translateDynamicContent = async (liveFeedData) => {
    if (!liveFeedData) return;

    try {
      const { gameData, liveData } = liveFeedData;
      const dynamicContent = new Set([
        'Top',
        'Bottom',
        'ERA',
        'AVG',
        'H',
        'E',
        'Hits',
        'Errors',
        'Current Matchup',
        'Pitching',
        'Batting',
        'Base Runners',
        'Last Play',
        'Game Information',
        'Weather',
        'Wind',
        'Game Type',
        'First Pitch',
        'Loading live feed...',

        // Add play description
        liveData?.plays?.currentPlay?.result?.description
      ].filter(Boolean));

      const contentToTranslate = Array.from(dynamicContent);
      const translations = await Promise.all(
        contentToTranslate.map(text => translateText(text, language))
      );

      const newTranslations = {};
      contentToTranslate.forEach((text, index) => {
        if (text === liveData?.plays?.currentPlay?.result?.description) {
          setTranslatedPlayDescription(translations[index]);
        } else {
          newTranslations[text] = translations[index];
        }
      });

      setTranslatedText(prev => ({
        ...prev,
        ...newTranslations
      }));

    } catch (error) {
      console.error('Error translating content:', error);
    }
  };

  useEffect(() => {
    if (language) {
      setTranslatedPlayDescription('');
      translateContent();
      if (liveFeedData) {
        translateDynamicContent(liveFeedData);
      }
    }
  }, [language, liveFeedData]);


  // Rendering the live feed component
  const renderLiveFeed = () => {
    if (loading) return <div className="text-blue-400 animate-pulse">{translatedText['Loading live feed...'] || 'Loading live feed...'}</div>;
    if (!liveFeedData) return null;

    const { gameData, liveData } = liveFeedData;

    // Check for null values
    if (!gameData || !liveData) {
      return <div className="text-red-400">Invalid game data received</div>;
    }

    const { status, teams, weather, venue, game, datetime } = gameData;
    const { plays, linescore, boxscore } = liveData;

    if (!teams || !status) {
      return <div className="text-red-400">Game data is incomplete</div>;
    }

    const currentInning = linescore?.currentInning || 0;
    const isTopInning = linescore?.isTopInning;
    const inningState = isTopInning ? translatedText['Top'] : translatedText['Bottom'];
    const battingTeam = isTopInning ? teams.away : teams.home;
    const pitchingTeam = isTopInning ? teams.home : teams.away;
    const currentPlay = plays?.currentPlay;
    const currentPitcher = currentPlay?.matchup?.pitcher || {};
    const currentBatter = currentPlay?.matchup?.batter || {};

    return (
      <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-lg">
        {/* Game Header */}
        <div className="border-b border-slate-700 pb-4 mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {translatedText.live_game_feed || "Live Game Feed"}
          </h2>
          <p className="text-sm text-slate-400">
            {venue?.name || 'Venue N/A'} • {datetime?.dateTime ? new Date(datetime.dateTime).toLocaleString() : 'Time TBD'}
          </p>
        </div>

        <div className="space-y-8">
          {/* Game Status and Score */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl text-center backdrop-blur-sm">
            <p className="text-lg font-bold text-blue-400">
              {currentInning > 0
                ? `${inningState} ${currentInning}`
                : translatedText[status?.detailedState] || status?.detailedState || 'Status Unknown'}
            </p>
          </div>

          {/* Score */}
          <div className="grid grid-cols-2 gap-6">
            {[teams.away, teams.home].map((team, idx) => (
              <div key={team?.team?.name || idx} className="text-center p-6 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300">
                <p className="font-bold text-slate-200">
                  {translatedText[team?.team?.name] || team?.team?.name || `Team ${idx + 1}`}
                </p>
                <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {linescore?.teams?.[idx === 0 ? 'away' : 'home']?.runs || 0}
                </p>
                <p className="text-sm text-slate-400">
                  {translatedText['H']}: {linescore?.teams?.[idx === 0 ? 'away' : 'home']?.hits || 0} {" "}
                  {translatedText['E']}: {linescore?.teams?.[idx === 0 ? 'away' : 'home']?.errors || 0}
                </p>
              </div>
            ))}
          </div>

          {/* Current Situation */}
          {currentPlay && (
            <>
              <div className="bg-slate-800/50 p-6 rounded-xl backdrop-blur-sm border border-slate-700/50">
                <h3 className="font-bold text-slate-200 mb-4">
                  {translatedText['Current Matchup'] || 'Current Matchup'}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      title: translatedText['Pitching'] || 'Pitching',
                      name: currentPitcher?.fullName || 'N/A',
                      stat: `${translatedText['ERA'] || 'ERA'}: ${boxscore?.teams?.[pitchingTeam?.id]?.players?.[`ID${currentPitcher?.id}`]?.stats?.pitching?.era || '-'}`
                    },
                    {
                      title: translatedText['Batting'] || 'Batting',
                      name: currentBatter?.fullName || 'N/A',
                      stat: `${translatedText['AVG'] || 'AVG'}: ${boxscore?.teams?.[battingTeam?.id]?.players?.[`ID${currentBatter?.id}`]?.stats?.batting?.avg || '-'}`
                    }
                  ].map(({ title, name, stat }) => (
                    <div key={title} className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-400">{title}</p>
                      <p className="font-bold text-slate-200">{name}</p>
                      <p className="text-sm text-blue-400">{stat}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Base Runners */}
              <div className="bg-slate-800/50 p-6 rounded-xl backdrop-blur-sm border border-slate-700/50">
                <h3 className="font-bold text-slate-200 mb-4">
                  {translatedText['Base Runners'] || 'Base Runners'}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[1, 2, 3].map(base => (
                    <div key={base} className="text-2xl">
                      {plays?.currentPlay?.runners?.find(r => r?.movement?.end === base) ? "🏃" :
                        <span className="text-slate-600">◇</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Play */}
              <div className="bg-slate-800/50 p-6 rounded-xl backdrop-blur-sm border border-slate-700/50">
                <h4 className="font-bold text-slate-200 mb-2">
                  {translatedText['Last Play'] || 'Last Play'}
                </h4>
                <p className="text-slate-300">
                  {translatedPlayDescription || plays?.currentPlay?.result?.description || 'No play information available'}
                </p>
              </div>
            </>
          )}

          {/* Game Info */}
          <div className="bg-slate-800/50 p-6 rounded-xl backdrop-blur-sm border border-slate-700/50">
            <h3 className="font-bold text-slate-200 mb-4">
              {translatedText['Game Information'] || 'Game Information'}
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              {[
                {
                  label: translatedText['Weather'] || 'Weather',
                  value: weather ? `${weather.temp}°F, ${translatedText[weather.condition] || weather.condition}` : 'N/A'
                },
                {
                  label: translatedText['Wind'] || 'Wind',
                  value: weather?.wind || 'N/A'
                },
                {
                  label: translatedText['Game Type'] || 'Game Type',
                  value: translatedText[game?.type] || game?.type || 'N/A'
                },
                {
                  label: translatedText['First Pitch'] || 'First Pitch',
                  value: datetime?.dateTime ? new Date(datetime.dateTime).toLocaleTimeString() : 'TBD'
                }
              ].map(({ label, value }) => (
                <div key={label} className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400">{label}</p>
                  <p className="text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-8 w-full backdrop-blur-lg">
        <div className="border-b border-slate-700 pb-4 mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {translatedText.game_selection || "Game Selection"}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Season Selection */}
          <div className="space-y-2">
            <label htmlFor="yearFilter" className="block text-sm font-medium text-slate-300">
              {translatedText.filter_years || "Filter Years"}
            </label>
            <input
              id="yearFilter"
              type="text"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-500"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              placeholder={translatedText.start_typing_year || "Start typing year..."}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="yearSelect" className="block text-sm font-medium text-slate-300">
              {translatedText.select_season || "Select Season"}
            </label>
            <select
              id="yearSelect"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200"
              onChange={(e) => {
                if (e.target.value) {
                  fetchGames(e.target.value);
                }
              }}
            >
              <option value="">{translatedText.select_a_year || "Select a year"}</option>
              {filteredYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Game Selection */}
          <div className="space-y-2">
            <label htmlFor="gameSelect" className="block text-sm font-medium text-slate-300">
              {translatedText.select_game || "Select Game"}
            </label>
            <select
              id="gameSelect"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              disabled={loading}
            >
              <option value="">{translatedText.select_a_game || "Select a game"}</option>
              {games.map(game => (
                <option key={game.uniqueId} value={game.gamePk}>
                  {game.gameDate} - {game.teams}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={savePreferences}
            disabled={!selectedGame || loading}
            className={`w-full py-3 px-6 rounded-xl transition-all duration-300 ${
              !selectedGame || loading
                ? 'bg-slate-700 cursor-not-allowed text-slate-500'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {translatedText.save_preferences || "Save Preferences"}
          </button>

          {loading && (
            <p className="text-blue-400 animate-pulse">{translatedText.loading_games || "Loading games..."}</p>
          )}
          {error && (
            <p className="text-red-400">{error}</p>
          )}
          {saveStatus && (
            <p className="text-green-400">{saveStatus}</p>
          )}
        </div>
      </div>

      {/* Live Feed Display */}
      {renderLiveFeed()}
    </div>
  );
};

export default LiveFeed;