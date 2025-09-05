import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'primary' | 'secondary';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    primary: 'from-primary/20 to-dark-200 text-primary',
    secondary: 'from-secondary/20 to-dark-200 text-secondary',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-xl flex items-center space-x-4`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-light-200">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
