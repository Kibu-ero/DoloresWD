import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // If user navigates back to the login page, automatically log them out
  // and clear any cached auth state
  const clearAuth = React.useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initial mount
  React.useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  // Handle bfcache restore and tab visibility
  React.useEffect(() => {
    const onPageShow = (e) => {
      if (e.persisted) clearAuth();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') clearAuth();
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [clearAuth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        username,
        password,
      });

      const { token, userId, username: userUsername, email: userEmail, role, firstName, lastName } = response.data;
      if (!token || !role) throw new Error("Token or role not received from backend");

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify({ userId, username: userUsername, email: userEmail, role, firstName, lastName }));

      console.log("Login success, role:", role);
      console.log("User in localStorage:", JSON.parse(localStorage.getItem('user')));

      // Replace history so the Back button won't return to the login page
      switch (role.toLowerCase()) {
        case "admin":
          navigate("/dashboard", { replace: true });
          break;
        case "cashier":
          navigate("/cashier-dashboard", { replace: true });
          break;
        case "customer":
          navigate("/customer-dashboard", { replace: true });
          break;
        case "encoder":
          navigate("/encoder-dashboard", { replace: true });
          break;
        case "finance_officer":
          navigate("/finance-dashboard", { replace: true });
          break;
        default:
          navigate("/unauthorized", { replace: true });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 via-purple-100 to-pink-100 p-4 relative overflow-hidden">
      {/* Billink Logo/Name in upper left */}
      <motion.div 
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 group"
        >
          <img 
            src="/logodolores.png"
            alt="Billink Logo"
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/50 shadow-lg group-hover:border-blue-400 transition-all duration-300"
          />
          <span className="text-2xl font-bold text-gray-800 tracking-wide group-hover:text-blue-600 transition-colors duration-300">
            Billink
          </span>
        </button>
      </motion.div>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Particle Background */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400 pointer-events-none"
            style={{
              width: Math.random() * 8 + 4 + 'px',
              height: Math.random() * 8 + 4 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 150],
              x: [0, (Math.random() - 0.5) * 100],
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating Light Orbs */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full filter blur-[120px] opacity-30 pointer-events-none"
          animate={{
            scale: [1, 1.3, 1],
            x: [-30, 30, -30],
            y: [-20, 20, -20]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full filter blur-[140px] opacity-30 pointer-events-none"
          animate={{
            scale: [1, 1.4, 1],
            x: [30, -30, 30],
            y: [20, -20, 20]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/3 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full filter blur-[100px] opacity-25 pointer-events-none"
          animate={{
            scale: [1, 1.2, 1],
            x: [20, -20, 20],
            y: [-15, 15, -15]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-30 relative"
      >
        {/* Glass Morphism Card */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border-2 border-white/50 relative">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl blur-xl opacity-30 animate-pulse pointer-events-none"></div>
          
          {/* Premium Header with Logo */}
          <div className="relative p-8 pb-8 text-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-b-2 border-white/20">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <img 
                  src="/logodolores.png"
                  alt="Dolores Water District Logo"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-white/20"
                />
              </motion.div>
            </div>
            <div className="pt-4">
              <motion.h1 
                className="text-3xl font-bold text-white tracking-tight mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome Back
              </motion.h1>
              <motion.p 
                className="text-blue-100 text-base font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Sign in to your account
              </motion.p>
            </div>
          </div>
          {/* Luxury Form */}
          <div className="p-8 pt-6 relative z-10 bg-gradient-to-b from-white to-gray-50/50">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm border border-red-200 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer z-20 focus:outline-none focus:text-gray-700"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 bg-white border-gray-300 rounded focus:ring-blue-400 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-700 transition duration-200 font-medium cursor-pointer focus:outline-none focus:text-blue-700 z-10 relative"
                >
                  Forgot password?
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-white transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] ${
                    isLoading ? "opacity-90 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-600 backdrop-blur-sm rounded-full font-medium border border-gray-200">
                    New to Dolores Water?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/#signup')}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-blue-600 hover:text-white border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 z-10 relative"
                >
                  Create account
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
