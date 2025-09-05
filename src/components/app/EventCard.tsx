import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User as UserIcon, Users } from 'lucide-react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    tag?: string;
    creatorUsername?: string;
    participants_count: number;
    is_admin_only?: boolean;
  };
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <Link to={`/app/event/${event.id}`}>
      <motion.div
        variants={cardVariants}
        className="relative bg-dark-200 rounded-xl overflow-hidden border border-dark-300 hover:border-primary transition-all duration-300 group shadow-lg hover:shadow-primary/20 h-full flex flex-col"
      >
        {event.is_admin_only && (
          <div
            className="absolute top-2 right-2 bg-secondary text-dark-100 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full z-10"
            title="Admin only event"
          >
            A
          </div>
        )}
        <div className="p-5 flex-grow">
          <div className="flex items-center justify-between mb-3">
            {event.tag && (
              <span className="text-sm font-semibold text-primary">
                {event.tag}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-secondary">
            {event.title}
          </h3>
        </div>
        <div className="p-5 pt-0 mt-auto flex items-center justify-between text-light-200 text-sm">
          <div className="flex items-center">
            <UserIcon size={14} className="mr-1.5" />
            <span>by {event.creatorUsername || 'anon'}</span>
          </div>
          <div className="flex items-center">
            <Users size={14} className="mr-1.5" />
            <span>{event.is_admin_only ? '-' : event.participants_count}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default EventCard;
