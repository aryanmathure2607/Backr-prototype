import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-dark-100/80 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-3xl font-bold tracking-tighter text-white">
            Backr<span className="text-primary">.</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link to="/login" className="flex items-center text-light-200 hover:text-white transition-colors duration-300">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30 flex items-center"
            >
                <UserPlus className="w-5 h-5 mr-2" />
              Sign Up
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
