import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, PlusSquare, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/app/find', icon: Compass, label: 'Find' },
  { to: '/app/create', icon: PlusSquare, label: 'Create' },
  { to: '/app/profile', icon: User, label: 'Profile' },
];

const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-200/80 backdrop-blur-lg border-t border-dark-300 z-50">
      <div className="flex justify-around items-center h-16">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full text-light-200 transition-colors duration-200',
                isActive ? 'text-primary' : 'hover:text-white'
              )
            }
          >
            <link.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
