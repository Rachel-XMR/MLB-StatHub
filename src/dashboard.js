import React, { useState, useEffect } from 'react';
import PlayerSelector from './playerSelector';
import Logout from './Logout';
import LiveFeed from './livefeed';
import translateText from './translationServer';
import LanguageSelector from './languageSelector';

// Loading Screen Emoji
const LoadingEmoji = ({ type }) => {
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  const loadingConfigs = {
    playerSelector: {
      emojis: ['👤', '⚾️', '📊', '🔄', '📋', '🎯'],
      texts: [
        "Loading player profiles...",
        "Fetching player stats...",
        "Getting team information...",
        "Preparing player data...",
        "Loading roster details..."
      ]
    },
    liveFeed: {
      emojis: ['🏟️', '📺', '🎥', '📡', '⚡', '🔴'],
      texts: [
        "Connecting to live feed...",
        "Getting game updates...",
        "Fetching scoreboard...",
        "Loading game data...",
        "Preparing live coverage..."
      ]
    }
  };

  const config = loadingConfigs[type];

  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % config.emojis.length);
    }, 300);

    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % config.texts.length);
    }, 1500);

    return () => {
      clearInterval(emojiInterval);
      clearInterval(textInterval);
    };
  }, [config.emojis.length, config.texts.length]);

  return (
    <div className="flex flex-col items-center justify-center h-48 space-y-4">
      <div className="text-4xl animate-bounce">
        {config.emojis[emojiIndex]}
      </div>
      <div className="text-slate-400 text-sm font-medium">
        {config.texts[textIndex]}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [language, setLanguage] = useState('en');
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerSelectorLoaded, setPlayerSelectorLoaded] = useState(false);

  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);

    if (newLanguage !== 'en') {
      try {
        const translated = await translateText("Dashboard", newLanguage);
        setTranslatedContent(translated);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedContent("Dashboard");
      }
    } else {
      setTranslatedContent("Dashboard");
    }
  };

  useEffect(() => {
    handleLanguageChange('en');
  }, []);

  const handlePlayerSelectorLoad = () => {
    setPlayerSelectorLoaded(true);
  };

  useEffect(() => {
    if (playerSelectorLoaded) {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  }, [playerSelectorLoaded]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen p-6 font-sans text-gray-100">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {translatedContent || "Dashboard"}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-gray-100">
              <LanguageSelector onLanguageChange={handleLanguageChange} />
            </div>
            <div className="text-gray-100 hover:text-blue-400 transition-colors duration-200">
              <Logout language={language} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 backdrop-blur-lg border border-gray-700">
                <LoadingEmoji type="playerSelector" />
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 backdrop-blur-lg border border-gray-700">
                <LoadingEmoji type="liveFeed" />
              </div>
            </div>
          </div>
        ) : null}

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isLoading ? 'hidden' : ''}`}>
          <div className="md:col-span-1">
            <PlayerSelector
              language={language}
              onLoad={handlePlayerSelectorLoad}
            />
          </div>
          <div className="md:col-span-1">
            <LiveFeed
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;