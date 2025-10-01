import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = ({ userRole }) => {
  const userData = JSON.parse(sessionStorage.getItem("userData")) || { username: "User" };
  const username = userData.username || "User";
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Billing", path: "/billing", icon: "🧾" },
    { name: "Customers", path: "/customers", icon: "👥" },
  ];

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-xl backdrop-blur-sm bg-opacity-90 border-b border-blue-400/20"
    >
      {/* Brand Logo with Water Icon */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="flex items-center cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <div className="mr-3">
          <svg 
            className="w-8 h-8 text-white" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 2C13.1 2 14 2.9 14 4C14 4.1 13.9 4.3 13.8 4.4C12.8 5.7 12 8.6 12 12C12 15.4 12.8 18.3 13.8 19.6C13.9 19.7 14 19.9 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 19.9 10.1 19.7 10.2 19.6C11.2 18.3 12 15.4 12 12C12 8.6 11.2 5.7 10.2 4.4C10.1 4.3 10 4.1 10 4C10 2.9 10.9 2 12 2Z" />
            <path d="M8 6C9.1 6 10 6.9 10 8C10 8.1 9.9 8.3 9.8 8.4C8.8 9.7 8 12.6 8 16C8 19.4 8.8 22.3 9.8 23.6C9.9 23.7 10 23.9 10 24C10 25.1 9.1 26 8 26C6.9 26 6 25.1 6 24C6 23.9 6.1 23.7 6.2 23.6C7.2 22.3 8 19.4 8 16C8 12.6 7.2 9.7 6.2 8.4C6.1 8.3 6 8.1 6 8C6 6.9 6.9 6 8 6Z" />
            <path d="M16 6C17.1 6 18 6.9 18 8C18 8.1 17.9 8.3 17.8 8.4C16.8 9.7 16 12.6 16 16C16 19.4 16.8 22.3 17.8 23.6C17.9 23.7 18 23.9 18 24C18 25.1 17.1 26 16 26C14.9 26 14 25.1 14 24C14 23.9 14.1 23.7 14.2 23.6C15.2 22.3 16 19.4 16 16C16 12.6 15.2 9.7 14.2 8.4C14.1 8.3 14 8.1 14 8C14 6.9 14.9 6 16 6Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
          Dolores Water
        </h1>
      </motion.div>

      {/* Navigation Links */}
      <div className="hidden md:flex space-x-1 bg-white/10 rounded-full p-1 backdrop-blur-sm">
        {menuItems.map((item) => (
          <motion.div
            key={item.path}
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <Link 
              to={item.path} 
              className={`flex items-center px-5 py-2 rounded-full transition-all ${location.pathname === item.path ? 'bg-white/20' : 'hover:bg-white/5'}`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
            {location.pathname === item.path && (
              <motion.div
                layoutId="underline"
                className="absolute left-1/2 -bottom-1 h-0.5 bg-white rounded-full"
                initial={{ width: 0, x: "-50%" }}
                animate={{ width: "60%", x: "-50%" }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* User Greeting & Logout */}
      <motion.div className="flex items-center space-x-4">
        <motion.div 
          className="hidden md:flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/15 transition-all"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm font-medium">
            Hello, <span className="font-semibold">{username}</span>
          </div>
        </motion.div>

        <motion.button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </motion.button>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;