import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseClasses = 'font-bold py-3 px-6 rounded-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 hover:scale-105 focus:ring-primary',
    secondary: 'bg-secondary hover:bg-secondary-hover text-dark-100 shadow-lg shadow-secondary/30 hover:scale-105 focus:ring-secondary',
    ghost: 'bg-dark-300 hover:bg-dark-200 text-white hover:scale-105 focus:ring-primary',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
