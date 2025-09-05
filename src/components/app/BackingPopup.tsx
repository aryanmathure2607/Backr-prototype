import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Share2, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';

interface BackingPopupProps {
  isVisible: boolean;
  username: string;
  participantId: string | null;
  onComplete: () => void;
}

const BackingPopup: React.FC<BackingPopupProps> = ({ isVisible, username, participantId, onComplete }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const closePopup = () => {
    setShowShareOptions(false);
    onComplete();
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible && !showShareOptions) {
      // Auto-close after a delay if share options aren't opened
      timer = setTimeout(() => {
        closePopup();
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isVisible, onComplete, showShareOptions]);

  const shareText = `I just backed ${username} on Backr! 🚀 You should back them too and be part of their winning moment! 💪`;
  const shareUrl = `${window.location.origin}${window.location.pathname}?back_id=${participantId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Back ${username} on Backr!`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        setShowShareOptions(true); // Fallback for mobile share cancellation
      }
    } else {
      setShowShareOptions(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        closePopup();
      }, 1500);
    } catch (error) {
      console.log('Error copying to clipboard:', error);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={!showShareOptions ? closePopup : undefined}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-dark-200 border border-primary/30 rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl shadow-primary/20 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {!showShareOptions ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
                  >
                    <Heart className="w-8 h-8 text-white fill-current" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                  <p className="text-light-200 mb-4">You've backed <strong className="text-white">{username}</strong>!</p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button onClick={handleShare} variant="secondary" className="w-full !py-2">
                      <Share2 size={16} />
                      Invite friends to back
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">Share with friends</h3>
                  <div className="bg-dark-300/50 rounded-lg p-4 mb-6 border border-primary/20">
                    <p className="text-sm text-light-200 mb-2">Copy and share this message:</p>
                    <p className="text-xs text-white italic">"{shareText}"</p>
                  </div>
                  <div className="space-y-3">
                    <Button onClick={handleCopyLink} variant="primary" className="w-full" disabled={copied}>
                      {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Message & Link</>}
                    </Button>
                    <Button onClick={closePopup} variant="ghost" className="w-full">Close</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackingPopup;
