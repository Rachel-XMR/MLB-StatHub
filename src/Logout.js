import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, UserCircle, KeyRound, LogOut } from 'lucide-react';
import { fetchProtectedData } from './api';

const Logout = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState('User');

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetchProtectedData('http://127.0.0.1:5000/user/get_username');
        setUsername(response.username);
      } catch (error) {
        console.error('Failed to fetch username:', error);
      }
    };

    fetchUsername();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handlePasswordChange = () => {
    navigate('/change-password');
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition duration-200">
        <UserCircle className="mr-2 text-blue-600" />
        <span className="font-medium mr-2">{username}</span>
        <ChevronDown className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button onClick={handlePasswordChange} className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 transition duration-200">
              <KeyRound className="mr-2 text-blue-500" size={20} />
              Change Password
            </button>
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition duration-200">
              <LogOut className="mr-2" size={20} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logout;