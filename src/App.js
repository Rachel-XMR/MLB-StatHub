import React, { useState } from "react";
import PlayerSelector from "./playerSelector";
import SignupForm from "./SignupForm";
import LoginForm from './LoginForm';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from "./dashboard";

function App() {
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  return (
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
      </BrowserRouter>
    /* <div className="p-6">
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
    </div> */
  );
}

export default App;