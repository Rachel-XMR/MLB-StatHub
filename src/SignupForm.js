import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import AppDescription from './AppDescription'

// Validation patterns
const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const VALIDATION_MESSAGES = {
  username: 'Must be 4-24 characters long and start with a letter. Only letters, numbers, underscores, and hyphens allowed.',
  email: 'Please enter a valid email address.',
  password: 'Password must be 8-24 characters and include uppercase and lowercase letters, a number and a special character.',
  confirmPassword: 'Passwords must match.'
};

const SignupForm = () => {
  const userRef = useRef(null);
  const errRef = useRef(null);

  // Data Formats
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Validation States
  const [validations, setValidations] = useState({
    username: false,
    email: false,
    password: false,
    passwordMatch: false
  });

  // Form Touched States
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  // Password Visibility States
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false
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
        username: USER_REGEX.test(formData.username),
        email: EMAIL_REGEX.test(formData.email),
        password: PWD_REGEX.test(formData.password),
        passwordMatch: formData.password === formData.confirmPassword
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
      username: true,
      email: true,
      password: true,
      confirmPassword: true
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
      const response = await axios.post('http://localhost:5000/user/signup',
        {
          username: formData.username,
          email: formData.email,
          password: formData.password
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 5000
        }
      );

      if (response.status === 201) {
        const { token } = response.data;

        // Store the JWT token in localStorage
        localStorage.setItem("authToken", token);

        setSuccess(true);
        // If the response is successful, clear the fields
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      // Handle different types of errors
      let errorMessage = 'Registration failed';

      if (!err?.response) {
        errorMessage = 'No server response';
      } else if (err.response?.status === 409) {
        errorMessage = 'Username or email already exists';
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
  const renderInputField = (name, label, type = "text", autoComplete = "off", isPassword = false) => {
    const isValid = validations[name === "confirmPassword" ? "passwordMatch" : name]
    const showError = touched[name] && !isValid && formData[name]

    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400">
          {label}
        </label>
        <div className="relative mt-1">
          <input
            type={isPassword ? (showPassword[name] ? "text" : "password") : type}
            id={name}
            name={name}
            ref={name === "username" ? userRef : null}
            autoComplete={autoComplete}
            value={formData[name]}
            onChange={handleInputChange}
            onBlur={() => handleBlur(name)}
            required
            aria-invalid={!isValid ? "true" : "false"}
            aria-describedby={`${name}Note`}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md shadow-sm focus:outline-none focus:ring-1 
              ${showError ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-blue-500"}
              ${isPassword ? "pr-20" : "pr-10"}`} // Add extra padding if password field
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
    )
  }

  // Success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="bg-gray-800/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <FaCheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
            Success!
          </h1>
          <p className="text-gray-300 mb-6">Your account has been created successfully.</p>
          <Link
            to="/login"
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:opacity-90 transition-all duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Form layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="w-full max-w-4xl">
        <AppDescription />
        <div className="bg-gray-800/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          {errMsg && (
            <div
              ref={errRef}
              className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{errMsg}</span>
            </div>
          )}

          <h1 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {renderInputField("username", "Username")}
            {renderInputField("email", "Email", "email")}
            {renderInputField("password", "Password", "password", "new-password", true)}
            {renderInputField("confirmPassword", "Confirm Password", "password", "new-password", true)}

            <button
              type="submit"
              disabled={!Object.values(validations).every(Boolean) || isSubmitting}
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 
                ${
                  !Object.values(validations).every(Boolean) || isSubmitting
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                }`}
            >
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
};

export default SignupForm;