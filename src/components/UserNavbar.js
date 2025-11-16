import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiLogIn, FiUserPlus, FiCheckCircle, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiXCircle } from "react-icons/fi";
import RegistrationVerification from "./RegistrationVerification";
import apiClient from "../api/client";

const UserNavbar = () => {
  const navigate = useNavigate();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registrationPhoneNumber, setRegistrationPhoneNumber] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    street: "",
    barangay: "",
    city: "Dolores",
    province: "Abra",
    birthdate: "",
    meterNumber: "",
    phoneNumber: "",
    role: "customer"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [isSenior, setIsSenior] = useState(false);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [approvalCheckInterval, setApprovalCheckInterval] = useState(null);
  
  const steps = [
    { label: "Account Info" },
    { label: "Address" },
    { label: "Contact" },
    { label: "Confirmation" }
  ];

  // Abra, Dolores barangays
  const doloresBarangays = [
    "Bayaan",
    "Cabaroan",
    "Calumbaya",
    "Cardona",
    "Isit",
    "Kimmalaba",
    "Libtec",
    "Lublubba",
    "Mudiit",
    "Namitingan",
    "Pacac",
    "Poblacion",
    "Salucag",
    "Taping",
    "Talogtog"
  ];

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one uppercase letter");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one number");
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("At least one special character");
    }

    return { score, feedback };
  };

  // Phone number validation for Philippines format (accept 9xxxxxxxxx too)
  const validatePhoneNumber = (phone) => {
    const clean = String(phone).trim();
    return (
      /^9\d{9}$/.test(clean) || // 9123456789
      /^09\d{9}$/.test(clean) || // 09123456789
      /^\+639\d{9}$/.test(clean) || // +639123456789
      /^639\d{9}$/.test(clean) // 639123456789
    );
  };

  // Handle phone number input (display 9xxxxxxxxx while typing)
  const handlePhoneNumberChange = (e) => {
    let v = e.target.value.replace(/[^\d+]/g, '');
    // Normalize: +639xxxxxxxxx or 639xxxxxxxxx or 09xxxxxxxxx => 9xxxxxxxxx
    if (/^\+?639/.test(v)) v = v.replace(/^\+?63/, '');
    if (/^09/.test(v)) v = v.replace(/^0/, '');
    // Keep only up to 10 digits starting with 9
    v = v.replace(/(\d{10}).*/, '$1');
    setFormData(prev => ({ ...prev, phoneNumber: v }));
  };

  // Normalize to +63 format for saving/OTP
  const toPlus63 = (phone) => {
    const raw = String(phone).trim();
    if (raw.startsWith('+63')) return raw;
    if (raw.startsWith('63')) return '+' + raw;
    if (raw.startsWith('09')) return '+63' + raw.slice(1);
    if (raw.startsWith('9')) return '+63' + raw;
    return raw;
  };

  // Hash-based modal control
  useEffect(() => {
    const checkHash = () => setIsSignUpOpen(window.location.hash === '#signup');
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (formData.birthdate) {
      const today = new Date();
      const birthDate = new Date(formData.birthdate);
      
      // Validate that birthdate is not in the future
      if (birthDate > today) {
        setCalculatedAge(null);
        setIsSenior(false);
        return;
      }
      
      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Validate age is reasonable (between 18 and 120)
      if (age < 18 || age > 120) {
        setCalculatedAge(null);
        setIsSenior(false);
        return;
      }
      
      setCalculatedAge(age);
      setIsSenior(age >= 60);
    } else {
      setCalculatedAge(null);
      setIsSenior(false);
    }
  }, [formData.birthdate]);

  useEffect(() => {
    if (window.location.pathname === "/login") {
      setIsSignUpOpen(false);
    }
  }, []);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password]);

  const handleSignUpClick = () => {
    navigate('#signup');
    setIsSignUpOpen(true);
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const getPasswordStrengthText = (score) => {
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

  // Validate step 0 (Account Info)
  const validateStep0 = () => {
    if (!formData.firstName || !formData.lastName || !formData.username || 
        !formData.birthdate || !formData.meterNumber || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields in Account Info");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (passwordStrength.score < 3) {
      setError("Password is too weak. Please meet the requirements.");
      return false;
    }

    // Validate age
    if (formData.birthdate) {
      const today = new Date();
      const birthDate = new Date(formData.birthdate);
      
      if (birthDate > today) {
        setError("Birthdate cannot be in the future");
        return false;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18 || age > 120) {
        setError("You must be at least 18 years old to register");
        return false;
      }
    }

    return true;
  };

  // Validate step 1 (Address)
  const validateStep1 = () => {
    if (!formData.province || !formData.city || !formData.barangay || !formData.street) {
      setError("Please fill in all required fields in Address");
      return false;
    }
    return true;
  };

  // Validate step 2 (Contact)
  const validateStep2 = () => {
    if (!formData.phoneNumber) {
      setError("Please fill in your phone number");
      return false;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError("Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)");
      return false;
    }

    return true;
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (passwordStrength.score < 3) {
      setError("Password is too weak. Please meet the requirements.");
      return false;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError("Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)");
      return false;
    }

    // Validate age
    if (formData.birthdate) {
      const today = new Date();
      const birthDate = new Date(formData.birthdate);
      
      if (birthDate > today) {
        setError("Birthdate cannot be in the future");
        return false;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18 || age > 120) {
        setError("You must be at least 18 years old to register");
        return false;
      }
    }

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.password || 
        !formData.street || !formData.barangay || !formData.phoneNumber || !formData.birthdate || !formData.meterNumber) {
      setError("Please fill in all required fields");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword from the data sent to server
      const { confirmPassword, ...registrationData } = formData;
      const phoneForSave = toPlus63(formData.phoneNumber);
      registrationData.phoneNumber = phoneForSave;
      
      const response = await apiClient.post("/auth/register", registrationData);
      const data = response.data;

      console.log('🔍 Registration Response:', data);
      console.log('🔍 requiresOTP:', data.requiresOTP);

      if (data.requiresOTP) {
        // Show OTP verification modal
        setShowOTPVerification(true);
        setRegistrationPhoneNumber(phoneForSave);
        setSuccess("Registration successful! Please check your phone for verification code.");
      } else {
        // Keep modal open and start polling for approval
        setWaitingForApproval(true);
        setRegistrationPhoneNumber(phoneForSave);
        setSuccess("Registration submitted! Please wait for admin approval. You will receive an OTP via SMS once approved.");
        
        // Start polling for approval status
        const interval = setInterval(async () => {
          try {
            const checkResponse = await apiClient.get(`/customers`);
            const customers = checkResponse.data;
            const user = customers.find(c => c.phone_number === phoneForSave);
            
            if (user && user.status === 'Approved') {
              clearInterval(interval);
              setWaitingForApproval(false);
              setSuccess("Approved! Please check your phone for OTP verification code.");
              setShowOTPVerification(true);
              setRegistrationPhoneNumber(phoneForSave);
            }
          } catch (err) {
            console.error('Error checking approval status:', err);
          }
        }, 5000); // Check every 5 seconds
        
        setApprovalCheckInterval(interval);
      }
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const closeModal = () => {
    setIsSignUpOpen(false);
    setWaitingForApproval(false);
    if (approvalCheckInterval) {
      clearInterval(approvalCheckInterval);
      setApprovalCheckInterval(null);
    }
    navigate("#");
  };

  return (
    <>
      {/* Clean Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-[#B7C5E5] text-gray-800 p-4 flex justify-between items-center fixed top-0 w-full z-30 shadow-lg border-b border-brand-200"
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/")} 
          className="flex items-center cursor-pointer"
        >
          <img 
            src="/logodolores.png"
            alt="Dolores Water District Logo"
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <h1 className="text-2xl font-bold text-brand-700">
            Dolores Water District
          </h1>
        </motion.div>

        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="px-5 py-2 bg-transparent border border-brand-500 rounded-lg hover:bg-brand-200 transition-all duration-300 font-medium text-sm text-brand-700 flex items-center gap-2"
          >
            <FiLogIn className="text-lg" />
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignUpClick}
            className="px-5 py-2 bg-gradient-to-r from-brand-500 to-brand-700 text-white rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all duration-300 font-medium shadow-lg text-sm flex items-center gap-2"
          >
            <FiUserPlus className="text-lg" />
            Sign Up
          </motion.button>
        </div>
      </motion.nav>

      {/* Premium Modal */}
      <AnimatePresence>
      {isSignUpOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
    {/* Backdrop */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={closeModal}
    />
    
    {/* Modal Content */}
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] border border-gray-100 overflow-hidden flex flex-col"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-700 px-8 py-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Create Your Account
          </h2>
          <button 
            onClick={closeModal}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-brand-50 mt-2 text-sm">Join Dolores Water District for seamless billing management</p>
      </div>

      {/* Form Content */}
      <div className="px-8 py-6 flex-1 overflow-y-auto">
        {/* Stepper UI */}
        <div className="flex items-center w-full mb-8 px-2">
          {steps.map((stepObj, idx) => (
            <div key={stepObj.label} className="flex-1 flex flex-col items-center">
              <button
                type="button"
                disabled={idx > step}
                onClick={() => setStep(idx)}
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 focus:outline-none transition-all duration-200 shadow-sm
                  ${step === idx ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-500'}
                  ${step > idx ? 'bg-green-500 text-white cursor-pointer shadow-md' : ''}
                  ${idx > step ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'}`}
                aria-label={`Go to step ${idx + 1}`}
              >
                {step > idx ? <FiCheckCircle className="w-5 h-5" /> : <span className="font-semibold">{idx + 1}</span>}
              </button>
              <span className={`text-xs font-medium ${step === idx ? 'text-blue-600' : 'text-gray-500'}`}>{stepObj.label}</span>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 w-12 rounded-full ${step > idx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <FiXCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Step Content and Navigation */}
        {step < 3 ? (
          <div className="space-y-6">
            {step === 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username*</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Birthdate*</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                      formData.birthdate && calculatedAge === null 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : formData.birthdate && calculatedAge !== null 
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                        : 'border-gray-200'
                    }`}
                    required
                  />
                  {formData.birthdate && calculatedAge !== null && (
                    <p className="text-green-500 text-xs mt-1 flex items-center">
                      <FiCheckCircle className="w-3 h-3 mr-1" />
                      Age: {calculatedAge} years old {isSenior && <span className="text-blue-600 font-medium">(Senior Citizen)</span>}
                    </p>
                  )}
                  {formData.birthdate && calculatedAge === null && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <FiXCircle className="w-3 h-3 mr-1" />
                      You must be at least 18 years old to register
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meter Number*</label>
                  <input
                    type="text"
                    name="meterNumber"
                    value={formData.meterNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter meter number"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password*</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {formData.password && formData.password.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password Strength</label>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' : 
                          passwordStrength.score <= 3 ? 'bg-yellow-500' : 
                          passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                        }`} 
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' : 
                        passwordStrength.score <= 3 ? 'text-yellow-600' : 
                        passwordStrength.score <= 4 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                      <span className="text-xs text-gray-500">{passwordStrength.score}/5</span>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Requirements:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center">
                          {passwordStrength.score >= 1 ? (
                            <FiCheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          )}
                          <span className={passwordStrength.score >= 1 ? "text-green-600" : "text-gray-600"}>
                            At least 8 characters
                          </span>
                        </li>
                        <li className="flex items-center">
                          {passwordStrength.score >= 2 ? (
                            <FiCheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          )}
                          <span className={passwordStrength.score >= 2 ? "text-green-600" : "text-gray-600"}>
                            At least one lowercase letter
                          </span>
                        </li>
                        <li className="flex items-center">
                          {passwordStrength.score >= 3 ? (
                            <FiCheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          )}
                          <span className={passwordStrength.score >= 3 ? "text-green-600" : "text-gray-600"}>
                            At least one uppercase letter
                          </span>
                        </li>
                        <li className="flex items-center">
                          {passwordStrength.score >= 4 ? (
                            <FiCheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          )}
                          <span className={passwordStrength.score >= 4 ? "text-green-600" : "text-gray-600"}>
                            At least one number
                          </span>
                        </li>
                        <li className="flex items-center">
                          {passwordStrength.score >= 5 ? (
                            <FiCheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          )}
                          <span className={passwordStrength.score >= 5 ? "text-green-600" : "text-gray-600"}>
                            At least one special character
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password*</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full p-3 pr-12 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : formData.confirmPassword && formData.password === formData.confirmPassword 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                          : 'border-gray-200'
                      }`}
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <FiXCircle className="w-3 h-3 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-green-500 text-xs mt-1 flex items-center">
                      <FiCheckCircle className="w-3 h-3 mr-1" />
                      Passwords match
                    </p>
                  )}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Province*</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    required
                  >
                    <option value="Abra">Abra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Municipality*</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    required
                  >
                    <option value="Dolores">Dolores</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay*</label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    required
                  >
                    <option value="">Select a barangay</option>
                    {doloresBarangays.map((barangay) => (
                      <option key={barangay} value={barangay}>{barangay}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address*</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your street address"
                    required
                  />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number*</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-700 select-none">+63</span>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="9123456789"
                      className={`flex-1 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber) 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : formData.phoneNumber && validatePhoneNumber(formData.phoneNumber) 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                          : 'border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  {formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber) && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <FiXCircle className="w-3 h-3 mr-1" />
                      Please enter a valid Philippine phone number (e.g., 9123456789)
                    </p>
                  )}
                  {formData.phoneNumber && validatePhoneNumber(formData.phoneNumber) && (
                    <p className="text-green-500 text-xs mt-1 flex items-center">
                      <FiCheckCircle className="w-3 h-3 mr-1" />
                      Valid phone number format
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          waitingForApproval ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Waiting for Admin Approval</h3>
                <p className="text-gray-600 mb-4">
                  Your registration has been submitted successfully. We're checking your information and will send you an OTP via SMS once approved.
                </p>
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
                  <p className="text-sm mt-1">
                    <strong>Status:</strong> Pending Approval
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <div className="text-lg text-gray-800 font-semibold mb-4">Review your information:</div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                    <div><span className="font-semibold text-gray-800">First Name:</span> {formData.firstName}</div>
                    <div><span className="font-semibold text-gray-800">Middle Name:</span> {formData.middleName || "N/A"}</div>
                    <div><span className="font-semibold text-gray-800">Last Name:</span> {formData.lastName}</div>
                    <div><span className="font-semibold text-gray-800">Username:</span> {formData.username}</div>
                    <div><span className="font-semibold text-gray-800">Phone:</span> {formData.phoneNumber}</div>
                    <div><span className="font-semibold text-gray-800">Street:</span> {formData.street}</div>
                    <div><span className="font-semibold text-gray-800">Barangay:</span> {formData.barangay}</div>
                    <div><span className="font-semibold text-gray-800">Municipality:</span> {formData.city}</div>
                    <div><span className="font-semibold text-gray-800">Province:</span> {formData.province}</div>
                    <div><span className="font-semibold text-gray-800">Birthdate:</span> {formData.birthdate}</div>
                    <div><span className="font-semibold text-gray-800">Meter Number:</span> {formData.meterNumber}</div>
                    {calculatedAge && (
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-800">Age:</span> {calculatedAge} years old
                        {isSenior && <span className="text-blue-600 ml-2 font-medium">(Senior Citizen)</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                  <FiXCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
                  <FiCheckCircle className="w-5 h-5 mr-2" />
                  {success}
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" /> Register Now
                    </>
                  )}
                </button>
              </div>
            </form>
          )
        )}

        {/* Navigation Buttons for steps 0-2 */}
        {step < 3 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                step === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                let isValid = false;
                if (step === 0) {
                  isValid = validateStep0();
                } else if (step === 1) {
                  isValid = validateStep1();
                } else if (step === 2) {
                  isValid = validateStep2();
                }
                
                if (isValid) {
                  setError("");
                  setStep(step + 1);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Next <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => { closeModal(); navigate("/login"); }}
            className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  </div>
)}
      </AnimatePresence>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOTPVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <RegistrationVerification 
                phoneNumber={registrationPhoneNumber}
                onVerificationSuccess={(user) => {
                  console.log('✅ OTP verification successful, closing modal');
                  setShowOTPVerification(false);
                  closeModal();
                  // User will be redirected to dashboard by the component
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserNavbar;
