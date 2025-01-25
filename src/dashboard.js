import React from 'react';
import PlayerSelector from './playerSelector';
import Logout from './Logout';
import liveFeed from './livefeed';

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Logout />
      </div>
      <div className="grid gap-6">
        <PlayerSelector />
      </div>
    </div>
  );
};

export default Dashboard;