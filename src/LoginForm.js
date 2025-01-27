import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

// Validation patterns
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const VALIDATION_MESSAGES = {
  email: 'Please enter a valid email address.',
  password: 'Password must be 8-24 characters and include uppercase and lowercase letters, a number and a special character.',
};

const LoginForm = () => {
  const userRef = useRef(null);
  const errRef = useRef(null);

  // Data Formats
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Validation States
  const [validations, setValidations] = useState({
    email: false,
    password: false
  });

  // Form Touched States
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // Password Visibility States
  const [showPassword, setShowPassword] = useState({
    password: false
  });

  // Form interaction states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // Validate the form upon change in data
  useEffect(() => {
    const validateForm = () => {
      setValidations({
        email: EMAIL_REGEX.test(formData.email),
        password: PWD_REGEX.test(formData.password)
      });
    };
    validateForm();
  }, [formData]);

  // Reset error messages and form data upon form reset
  useEffect(() => {
    setErrMsg('');
  }, [formData]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form input focus
  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // On/off for password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true
    });

    // Check if the form is valid
    if (!Object.values(validations).every(Boolean)) {
      setErrMsg("Please ensure all fields are valid");
      errRef.current?.focus();
      return;
    }

    // Make request to flask server
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/user/login',
        {
          email: formData.email,
          password: formData.password
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 5000
        }
    );


      if (response.status === 200) {
        const { token } = response.data;

        // Store the JWT token in localStorage
        localStorage.setItem("authToken", token);

        setSuccess(true);
        setFormData({
          email: '',
          password: '',
        });
      }

    } catch (err) {
      let errorMessage = 'Login failed';

      if (!err?.response) {
        errorMessage = 'No server response';
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid form data';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out - please try again';
      }
      setErrMsg(errorMessage);
      errRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering input fields
  const renderInputField = (
    name,
    label,
    type = 'text',
    autoComplete = 'off',
    isPassword = false
  ) => {
    const isValid = validations[name];
    const showError = touched[name] && !isValid && formData[name];

    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative mt-1">
          <input
            type={isPassword ? (showPassword[name] ? 'text' : 'password') : type}
            id={name}
            name={name}
            ref={name === 'email' ? userRef : null}
            autoComplete={autoComplete}
            value={formData[name]}
            onChange={handleInputChange}
            onBlur={() => handleBlur(name)}
            required
            aria-invalid={!isValid ? "true" : "false"}
            aria-describedby={`${name}Note`}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 
              ${showError ? 'border-red-500' : formData[name] && isValid ? 'border-green-500' : 'border-gray-300'}
              ${isPassword ? 'pr-20' : 'pr-10'}`}
            disabled={isSubmitting}
          />

          <div className="absolute inset-y-0 right-0 flex items-center">
            {isPassword && (
              <button
                type="button"
                onClick={() => togglePasswordVisibility(name)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                tabIndex="-1"
              >
                {showPassword[name] ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}

            {formData[name] && (
              <span className="pl-2 pr-3">
                {isValid ? (
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <FaTimesCircle className="h-5 w-5 text-red-500" />
                )}
              </span>
            )}
          </div>
        </div>
        {showError && (
          <p className="mt-1 text-sm text-red-600" id={`${name}Note`}>
            {VALIDATION_MESSAGES[name]}
          </p>
        )}
      </div>
    );
  };

  // Success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-600 mb-4">Success!</h1>
          <p className="text-gray-600 mb-4">You have successfully logged in.</p>

          <Link to="/dashboard" className="text-blue-500 hover:underline font-medium">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Form layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {errMsg && (
          <div
            ref={errRef}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{errMsg}</span>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 text-gray-800">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderInputField('email', 'Email', 'email', 'email')}
          {renderInputField('password', 'Password', 'password', 'current-password', true)}

          <button
            type="submit"
            disabled={!Object.values(validations).every(Boolean) || isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${(!Object.values(validations).every(Boolean) || isSubmitting)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Don't have an account?{' '}
          <Link to="/" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;