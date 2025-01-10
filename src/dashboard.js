import PlayerSelector from './playerSelector';

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6">
        <PlayerSelector />
      </div>
    </div>
  );
};

export default Dashboard;