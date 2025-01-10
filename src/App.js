import React from "react";
import SignupForm from "./SignupForm";
import LoginForm from './LoginForm';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from "./dashboard";

function App() {
  return (
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
      </BrowserRouter>
  );
}

export default App;