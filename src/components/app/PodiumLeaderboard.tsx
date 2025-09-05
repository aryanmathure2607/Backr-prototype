import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Medal, Award, Users } from 'lucide-react';
import { LeaderboardEntry } from '../../lib/types';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

interface PodiumLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userBackings: string[];
  onBack: (participantId: string) => void;
  canBack: boolean;
  backingEnabled: boolean;
  currentUserId: string;
  highlightedParticipant: string | null;
}

const PodiumLeaderboard: React.FC<PodiumLeaderboardProps> = ({
  leaderboard,
  userBackings,
  onBack,
  canBack,
  backingEnabled,
  currentUserId,
  highlightedParticipant
}) => {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);

  const toggleNameExpansion = (id: string) => {
    setExpandedNames(prev => 
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const podiumStyles = {
    1: {
      gradient: 'from-yellow-300/70 to-yellow-500/70',
      border: 'border-yellow-400/80',
      iconColor: 'text-yellow-400',
      shadow: 'shadow-yellow-400/20',
      icon: <Crown className="w-7 h-7" />,
    },
    2: {
      gradient: 'from-slate-300/70 to-slate-400/70',
      border: 'border-slate-300/80',
      iconColor: 'text-slate-300',
      shadow: 'shadow-slate-300/20',
      icon: <Medal className="w-7 h-7" />,
    },
    3: {
      gradient: 'from-amber-500/70 to-orange-600/70',
      border: 'border-amber-500/80',
      iconColor: 'text-amber-500',
      shadow: 'shadow-amber-500/20',
      icon: <Award className="w-7 h-7" />,
    },
  };

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-light-200">
        <p>No participants yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {leaderboard.map((participant, index) => {
          const position = index + 1;
          const isPodium = position <= 3;
          const styles = isPodium ? podiumStyles[position as keyof typeof podiumStyles] : null;

          const isSelf = participant.user_id === currentUserId;
          const hasBackedThisParticipant = userBackings.includes(participant.user_id);
          const canBackThis = backingEnabled && !hasBackedThisParticipant && canBack;
          const isHighlighted = participant.user_id === highlightedParticipant;
          const isExpanded = expandedNames.includes(participant.user_id);

          return (
            <motion.div
              id={`participant-${participant.user_id}`}
              layout
              key={participant.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'p-3 rounded-xl transition-all duration-300 relative overflow-hidden',
                isPodium
                  ? `bg-gradient-to-br ${styles?.gradient} border ${styles?.border} shadow-lg ${styles?.shadow}`
                  : 'bg-dark-300/50 hover:bg-dark-300/70',
                isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-dark-200'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={cn(
                    "text-xl font-bold w-8 text-center",
                    isPodium ? styles?.iconColor : 'text-light-200'
                  )}>
                    {position}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-dark-100 font-bold text-xl">
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className={cn(
                        "font-bold text-white cursor-pointer",
                        !isExpanded && "truncate"
                      )}
                      onClick={() => toggleNameExpansion(participant.user_id)}
                      title={participant.username}
                    >
                      {participant.username}
                      {isSelf && " (You)"}
                    </p>
                    <p className={cn("text-sm font-bold flex items-center", isPodium ? styles?.iconColor : 'text-primary')}>
                      <Users size={12} className="mr-1.5" />
                      {participant.backer_count.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isPodium && (
                    <div className={cn("hidden sm:block", styles?.iconColor)}>{styles?.icon}</div>
                  )}

                  {backingEnabled && (
                    <Button
                      onClick={() => onBack(participant.user_id)}
                      className="!py-1.5 !px-3 !text-sm flex-shrink-0"
                      disabled={!canBackThis}
                      variant={hasBackedThisParticipant ? "ghost" : "primary"}
                    >
                      {hasBackedThisParticipant ? 'Backed' : isSelf ? 'Back Self' : 'Back'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PodiumLeaderboard;
