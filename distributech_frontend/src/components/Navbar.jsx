import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold gradient-text"
        >
          <Link to="/">DistribuTech</Link>
        </motion.div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-6">
        <DarkModeToggle />
        
        {isAuthenticated ? (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </motion.div>
            
            {(user?.role?.name === 'Warehouse Manager' || 
              user?.role?.name === 'SuperAdmin' || 
              user?.role?.name === 'Administrator') && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/inventory" className="nav-link">Inventory</Link>
              </motion.div>
            )}
            
            {(user?.role?.name === 'Department Manager' || 
              user?.role?.name === 'SuperAdmin') && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/orders/new" className="nav-link">New Order</Link>
              </motion.div>
            )}
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/orders" className="nav-link">Orders</Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/chat" className="nav-link">Messages</Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/profile" className="nav-link">Profile</Link>
            </motion.div>
            
            <motion.button 
              className="button-outline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
            >
              Logout
            </motion.button>
          </>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="nav-link">Home</Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/about" className="nav-link">About</Link>
            </motion.div>
            
            <motion.button 
              className="button-outline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
            >
              Register
            </motion.button>
            
            <motion.button 
              className="button-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              Login
            </motion.button>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center space-x-2">
        <DarkModeToggle />
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 focus:outline-none text-gray-700 dark:text-gray-300"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 shadow-md py-4 px-6 md:hidden z-50"
          >
            <div className="flex flex-col space-y-4">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  
                  {(user?.role?.name === 'Warehouse Manager' || 
                    user?.role?.name === 'SuperAdmin' || 
                    user?.role?.name === 'Administrator') && (
                    <Link to="/inventory" className="nav-link">Inventory</Link>
                  )}
                  
                  {(user?.role?.name === 'Department Manager' || 
                    user?.role?.name === 'SuperAdmin') && (
                    <Link to="/orders/new" className="nav-link">New Order</Link>
                  )}
                  
                  <Link to="/orders" className="nav-link">Orders</Link>
                  <Link to="/chat" className="nav-link">Messages</Link>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <button onClick={handleLogout} className="button-outline w-full">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/" className="nav-link">Home</Link>
                  <Link to="/about" className="nav-link">About</Link>
                  <button onClick={() => navigate('/register')} className="button-outline w-full">Register</button>
                  <button onClick={() => navigate('/login')} className="button-primary w-full">Login</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar; 