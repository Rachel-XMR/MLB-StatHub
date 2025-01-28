import React, { useState, useEffect } from 'react';
import PlayerSelector from './playerSelector';
import Logout from './Logout';
import liveFeed from './livefeed';
import translateText from './translationServer';
import LanguageSelector from './languageSelector';

const Dashboard = () => {
  const [language, setLanguage] = useState('en');
  const [translatedContent, setTranslatedContent] = useState(null);

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{translatedContent}</h1>
        <LanguageSelector onLanguageChange={handleLanguageChange} />
        <Logout language={language}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <PlayerSelector language={language} />
        </div>
        <div className="md:col-span-1">
          <liveFeed language={language}/>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;