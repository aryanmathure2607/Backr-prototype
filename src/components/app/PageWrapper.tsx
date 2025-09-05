import React from 'react';
import { motion } from 'framer-motion';

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="w-full p-4 sm:p-6 lg:p-8"
    >
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6 sm:mb-8">{title}</h1>
      <div>{children}</div>
    </motion.div>
  );
};

export default PageWrapper;
