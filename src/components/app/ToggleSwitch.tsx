import React from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, setEnabled }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-white font-medium">{label}</span>
      <div
        onClick={() => setEnabled(!enabled)}
        className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
          enabled ? 'bg-primary' : 'bg-dark-300'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 30 }}
          className="w-6 h-6 bg-white rounded-full shadow-md"
        />
      </div>
    </label>
  );
};

export default ToggleSwitch;
