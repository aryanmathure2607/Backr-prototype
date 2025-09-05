import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Compass, PlusSquare, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/app/find', icon: Compass, label: 'Find Events' },
  { to: '/app/create', icon: PlusSquare, label: 'Create Event' },
  { to: '/app/profile', icon: User, label: 'My Profile' },
];

const SideNav: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-dark-200 text-light-200 p-4 border-r border-dark-300">
      <Link to="/app" className="text-3xl font-bold tracking-tighter text-white mb-12 px-2">
        Backr<span className="text-primary">.</span>
      </Link>
      <nav className="flex flex-col space-y-2 flex-grow">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center py-3 px-4 rounded-lg transition-colors duration-200 hover:bg-dark-300 hover:text-white',
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : ''
              )
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SideNav;
