import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Plus, X } from 'lucide-react';
import PageWrapper from '../../components/app/PageWrapper';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

import { auth, db } from '../../config/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  writeBatch,
  doc,
} from 'firebase/firestore';

const CreateAdminEventPage: React.FC = () => {
  const navigate = useNavigate();

  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedTag = useMemo(
    () => tag.trim().replace(/^#/, ''),
    [tag]
  );
  const tagLower = useMemo(() => normalizedTag.toLowerCase(), [normalizedTag]);

  const handleAddParticipant = () => {
    const name = currentParticipant.trim();
    if (!name) return;
    setParticipants((prev) => [...prev, name]);
    setCurrentParticipant('');
  };

  const handleRemoveParticipant = (indexToRemove: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error('You must be signed in to create an event.');
      return;
    }
    if (!eventName.trim() || !description.trim() || !normalizedTag) {
      toast.error('Please fill out all event details.');
      return;
    }
    if (participants.length === 0) {
      toast.error('Please add at least one participant.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) Create the admin-only event
      const eventRef = await addDoc(collection(db, 'events'), {
        title: eventName.trim(),
        description: description.trim(),
        tag: normalizedTag,
        tagLower,
        creatorId: uid,
        creatorUsername: auth.currentUser?.displayName ?? (auth.currentUser?.email?.split('@')[0] || 'admin'),
        // Admin-only flags
        is_admin_only: true,
        isPublic: true, // still listable
        registration_enabled: false,
        backing_enabled: false,
        max_backings_per_user: 0,
        createdAt: serverTimestamp(),
      });

      // 2) Seed managed participants
      const batch = writeBatch(db);
      const mpCol = collection(db, 'managedParticipants');
      participants.forEach((username) => {
        const rowRef = doc(mpCol); // auto id
        batch.set(rowRef, {
          eventId: eventRef.id,
          username,
          points: 0,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();

      toast.success(`Admin event "${eventName.trim()}" created!`);
      navigate(`/app/event/${eventRef.id}/manage`);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'permission-denied') {
        toast.error('Blocked by Firestore rules. Ensure your rules allow creating events and managedParticipants.');
      } else {
        toast.error(err?.message || 'Could not create event.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Create Admin only Event">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto bg-dark-200 p-8 rounded-xl border border-dark-300"
      >
        <div className="flex items-center gap-3 mb-6 text-secondary">
          <Shield size={24} />
          <h2 className="text-xl font-bold">Admin only Event</h2>
        </div>
        <p className="text-light-200 mb-6 -mt-2">
          Manually add participants and update their points. User registration and backing are disabled.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Details */}
          <div className="space-y-6">
            <Input
              id="eventName"
              label="Event Name"
              placeholder="e.g., Zephyr '25"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-light-200 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-dark-300 border border-dark-300 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                required
              />
            </div>
            <Input
              id="tag"
              label="Tag"
              placeholder="#fest, #competition..."
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
              hint="Example: #fest — we’ll store it as 'fest'"
            />
          </div>

          {/* Participants */}
          <div className="space-y-4 pt-8 border-t border-dark-300">
            <h3 className="text-lg font-semibold text-white">Initial Participants</h3>
            <div className="flex gap-2">
              <Input
                id="new-participant"
                label=""
                placeholder="Enter team or participant name"
                value={currentParticipant}
                onChange={(e) => setCurrentParticipant(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <Button type="button" onClick={handleAddParticipant} className="!px-4">
                <Plus size={20} /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {participants.map((p, i) => (
                <motion.div
                  key={`${p}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-dark-300/50 p-3 rounded-lg"
                >
                  <span className="font-medium text-white">{p}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(i)}
                    className="text-light-200 hover:text-accent"
                    aria-label={`Remove ${p}`}
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
              {participants.length === 0 && (
                <p className="text-center text-sm text-light-200 py-2">No participants added yet.</p>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <CheckCircle size={20} />
              {isSubmitting ? 'Creating...' : 'Create Event & Add Participants'}
            </Button>
          </div>
        </form>
      </motion.div>
    </PageWrapper>
  );
};

export default CreateAdminEventPage;
