import React, { useState, useEffect } from 'react';

const AppDescription = () => {
  const [text, setText] = useState('');
  const fullText = "MLB StatHub is a full-stack web application where users can sign up, log in, and follow their favorite MLB players. Users will receive personalized highlights of the games they select in text, audio, or video formats. The application supports multiple languages (English, Spanish, Japanese) and allows users to follow players, view player profiles, and manage their own preferences.";

  useEffect(() => {
    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < fullText.length) {
        setText((prevText) => prevText + fullText.charAt(i));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, 20);

    return () => clearInterval(typingEffect);
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl border border-gray-700 mb-6">
      <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        Welcome to MLB StatHub
      </h2>
      <p className="text-gray-300">{text}</p>
    </div>
  );
};

export default AppDescription;