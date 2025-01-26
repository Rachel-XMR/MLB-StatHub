import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, UserCircle, KeyRound, LogOut, Eye, EyeOff } from 'lucide-react';
import { fetchProtectedData } from './api';

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,24}$/;

const Logout = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [username, setUsername] = useState('User');
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordError, setPasswordError] = useState('');

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

  const handlePasswordChange = async () => {
    const {current_password, new_password, confirm_password} = passwordFields;

    // Validation
    if (!current_password || !new_password || !confirm_password) {
      setPasswordError('All fields are required');
      return;
    }

    if (new_password !== confirm_password) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (current_password === new_password) {
      setPasswordError('New password cannot be the same as the current password');
      return;
    }

    if (!PWD_REGEX.test(new_password)) {
      setPasswordError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    // API call
    try {
      await fetchProtectedData('http://127.0.0.1:5000/user/change_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({current_password, new_password}),
      });

      // Clear token and username
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');

      // Clear input fields
      setPasswordFields({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      setIsPasswordChangeOpen(false);

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setPasswordError('The current password is incorrect');
      } else {
        setPasswordError(error.message || 'An unexpected error occurred');
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
  };

  return (
    <div className="relative">
      <div
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
          setIsPasswordChangeOpen(false);
        }}
        className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition duration-200"
      >
        <UserCircle className="mr-2 text-blue-600" />
        <span className="font-medium mr-2">{username}</span>
        <ChevronDown className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                setIsPasswordChangeOpen(!isPasswordChangeOpen);
                setPasswordError('');
              }}
              className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 transition duration-200"
            >
              <KeyRound className="mr-2 text-blue-500" size={20} />
              Change Password
            </button>

            {isPasswordChangeOpen && (
              <div className="p-4 space-y-3">
                <div className="px-2 py-1">
                  <div className="relative">
                    <input
                      type={passwordVisibility.current_password ? "text" : "password"}
                      name="current_password"
                      placeholder="Current Password"
                      value={passwordFields.current_password}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded pr-10"
                    />
                    <button
                      onClick={() => togglePasswordVisibility('current_password')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {passwordVisibility.current_password ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="px-2 py-1">
                  <div className="relative">
                    <input
                      type={passwordVisibility.new_password ? "text" : "password"}
                      name="new_password"
                      placeholder="New Password"
                      value={passwordFields.new_password}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded pr-10"
                    />
                    <button
                      onClick={() => togglePasswordVisibility('new_password')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {passwordVisibility.new_password ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="px-2 py-1">
                  <div className="relative">
                    <input
                      type={passwordVisibility.confirm_password ? "text" : "password"}
                      name="confirm_password"
                      placeholder="Confirm New Password"
                      value={passwordFields.confirm_password}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded pr-10"
                    />
                    <button
                      onClick={() => togglePasswordVisibility('confirm_password')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {passwordVisibility.confirm_password ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="text-red-500 text-sm">{passwordError}</div>
                )}

                <button onClick={handlePasswordChange} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
                  Change Password
                </button>
              </div>
            )}

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