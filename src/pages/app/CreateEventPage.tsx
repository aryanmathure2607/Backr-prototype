import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import PageWrapper from '../../components/app/PageWrapper';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ToggleSwitch from '../../components/app/ToggleSwitch';
import { useStore } from '../../lib/store';

import { auth, db } from '../../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useStore();

  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [allowBacking, setAllowBacking] = useState(true);
  const [maxBackings, setMaxBackings] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // normalize tags like "#Sports " -> "sports"
  const normalizedTag = useMemo(() => {
    const t = tag.trim().replace(/^#/, '');
    return t;
  }, [tag]);

  const tagLower = useMemo(() => normalizedTag.toLowerCase(), [normalizedTag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericMaxBackings = parseInt(maxBackings, 10);

    const uid = auth.currentUser?.uid || profile?.id; // prefer Firebase auth
    if (!uid) {
      toast.error('You must be signed in to create an event.');
      return;
    }

    if (!eventName.trim()) return toast.error('Event name is required.');
    if (eventName.trim().length < 3) return toast.error('Event name must be at least 3 characters.');
    if (!description.trim()) return toast.error('Description is required.');
    if (!normalizedTag) return toast.error('Please add a tag (e.g., #sports).');
    if (!numericMaxBackings || numericMaxBackings < 1) return toast.error('Max backings must be ≥ 1.');

    setIsSubmitting(true);
    try {
      // Firestore: create events/{eventId}
      const docRef = await addDoc(collection(db, 'events'), {
        title: eventName.trim(),
        description: description.trim(),
        tag: normalizedTag,
        tagLower,
        creatorId: uid,
        registration_enabled: allowRegistration,
        backing_enabled: allowBacking,
        max_backings_per_user: numericMaxBackings,
        isPublic: true, // keep public by default (tweak if you add privacy controls)
        createdAt: serverTimestamp(),
        // Optional future fields:
        // startsAt: null, endsAt: null, location: null
      });

      toast.success(`Event "${eventName.trim()}" created!`);
      navigate(`/app/event/${docRef.id}`);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'permission-denied') {
        toast.error('Permission denied by Firestore rules. Check that you are signed in and your rules allow event creation.');
      } else {
        toast.error(err?.message || 'Could not create event.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Create New Event">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto bg-dark-200 p-8 rounded-xl border border-dark-300"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="eventName"
            label="Event Name"
            placeholder="e.g., Annual Dance-Off"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            required
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-light-200 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Describe what your event is all about..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-dark-300 border border-dark-300 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              required
            />
          </div>

          <Input
            id="tag"
            label="Tag"
            placeholder="#sports, #music, #gaming..."
            value={tag}
            onChange={e => setTag(e.target.value)}
            required
            hint="Use a single tag to help people find your event (e.g., #gaming)"
          />

          <div className="space-y-4 pt-4 border-t border-dark-300">
            <ToggleSwitch
              label="Enable Participant Registration"
              enabled={allowRegistration}
              setEnabled={setAllowRegistration}
            />
            <ToggleSwitch
              label="Enable Backing"
              enabled={allowBacking}
              setEnabled={setAllowBacking}
            />
            <Input
              id="maxBackings"
              label="Max backings per user"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              value={maxBackings}
              onChange={e => setMaxBackings(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <CheckCircle size={20} />
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>

        <div className="pt-6 text-center">
          <Link to="/app/create-admin-event" className="text-sm text-primary hover:underline">
            Or, create an Admin only event
          </Link>
        </div>
      </motion.div>
    </PageWrapper>
  );
};

export default CreateEventPage;
