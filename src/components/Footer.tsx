import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-200 text-light-300 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-2xl font-bold text-white">Backr<span className="text-primary">.</span></h3>
          <p className="mt-2 text-sm">Back greatness. Be part of the win.</p>
          <p className="mt-4 text-xs text-gray-400">&copy; 2025 Backr. All rights reserved.</p>
        </div>
        <div className="flex flex-col space-y-2">
            <h4 className="font-semibold text-white">Product</h4>
            <Link to="/#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link to="/#features" className="hover:text-primary transition-colors">Features</Link>
            <Link to="/#who-its-for" className="hover:text-primary transition-colors">Who It's For</Link>
        </div>
        <div className="flex flex-col space-y-2">
            <h4 className="font-semibold text-white">Company</h4>
            <Link to="#" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="#" className="hover:text-primary transition-colors">Careers</Link>
            <Link to="#" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
