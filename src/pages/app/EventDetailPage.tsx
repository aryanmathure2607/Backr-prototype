import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus, Settings, Trophy, Info, Edit } from 'lucide-react';

import PageWrapper from '../../components/app/PageWrapper';
import Button from '../../components/ui/Button';
import ToggleSwitch from '../../components/app/ToggleSwitch';
import BackingPopup from '../../components/app/BackingPopup';
import PodiumLeaderboard from '../../components/app/PodiumLeaderboard';
import AdminLeaderboard from '../../components/app/AdminLeaderboard';

import { auth, db } from '../../config/firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';

// ---- Types used by the UI (keep minimal & explicit) ----
type Participant = { eventId: string; userId: string; username?: string };
type Back = { eventId: string; backerId: string; targetUserId: string };
type EventDoc = {
  title: string;
  description?: string;
  tag?: string;
  creatorId: string;
  creatorUsername?: string; // optional denormalized field
  registration_enabled: boolean;
  backing_enabled: boolean;
  max_backings_per_user: number;
  is_admin_only?: boolean;
  isPublic?: boolean;
};

type LeaderboardEntry = { user_id: string; username: string; backer_count: number };
type AdminLeaderboardEntry = { user_id: string; username: string; points: number };

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const uid = auth.currentUser?.uid || null;

  // UI state
  const [showBackingPopup, setShowBackingPopup] = useState(false);
  const [backedUsername, setBackedUsername] = useState('');
  const [backedParticipantId, setBackedParticipantId] = useState<string | null>(null);
  const [highlightedParticipant, setHighlightedParticipant] = useState<string | null>(null);

  // Data state
  const [event, setEvent] = useState<(EventDoc & { id: string }) | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [backs, setBacks] = useState<Back[]>([]);
  const [managedParticipants, setManagedParticipants] = useState<AdminLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Load event ----
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    const ref = doc(db, 'events', eventId);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          setEvent(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as EventDoc;
        let creatorUsername = data.creatorUsername;

        // Fetch creator username if not denormalized
        if (!creatorUsername && data.creatorId) {
          try {
            const u = await getDoc(doc(db, 'users', data.creatorId));
            if (u.exists()) {
              creatorUsername = (u.data() as any).username || (u.data() as any).displayName || 'anon';
            }
          } catch {
            // ignore
          }
        }

        setEvent({ id: snap.id, ...data, creatorUsername });
        setLoading(false);
      },
      (err) => {
        console.error('event onSnapshot error:', err);
        toast.error('Failed to load event.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [eventId]);

  // ---- Load participants for this event ----
  useEffect(() => {
    if (!eventId) return;
    const qRef = query(collection(db, 'participations'), where('eventId', '==', eventId));
    const unsub = onSnapshot(
      qRef,
      async (snap) => {
        const rows: Participant[] = await Promise.all(
          snap.docs.map(async (d) => {
            const x = d.data() as any;
            // If you didn't denormalize usernames into participations, fetch from users
            let username = x.username as string | undefined;
            if (!username && x.userId) {
              try {
                const u = await getDoc(doc(db, 'users', x.userId));
                if (u.exists()) {
                  username = (u.data() as any).username || (u.data() as any).displayName || 'anon';
                }
              } catch { /* ignore */ }
            }
            return { eventId: x.eventId, userId: x.userId, username };
          })
        );
        setParticipants(rows);
      },
      (err) => {
        console.error('participants onSnapshot error:', err);
        toast.error('Failed to load participants.');
      }
    );
    return () => unsub();
  }, [eventId]);

  // ---- Load backs for this event ----
  useEffect(() => {
    if (!eventId) return;
    const qRef = query(collection(db, 'backs'), where('eventId', '==', eventId));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows: Back[] = snap.docs.map((d) => d.data() as Back);
        setBacks(rows);
      },
      (err) => {
        console.error('backs onSnapshot error:', err);
        toast.error('Failed to load backings.');
      }
    );
    return () => unsub();
  }, [eventId]);

  // ---- (Optional) Admin-only managed scores ----
  useEffect(() => {
    if (!eventId) return;
    if (!event?.is_admin_only) {
      setManagedParticipants([]);
      return;
    }
    // If you have managed scores collection:
    // managedParticipants: [{eventId, userId, username, points}]
    const qRef = query(collection(db, 'managedParticipants'), where('eventId', '==', eventId));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows: AdminLeaderboardEntry[] = snap.docs.map((d) => d.data() as any);
        setManagedParticipants(rows.sort((a, b) => b.points - a.points));
      },
      () => { /* ignore */ }
    );
    return () => unsub();
  }, [eventId, event?.is_admin_only]);

  // ---- Derived state ----
  const isCreator = useMemo(() => !!(uid && event && event.creatorId === uid), [uid, event]);

  const isParticipant = useMemo(
    () => !!(uid && participants.some((p) => p.userId === uid)),
    [uid, participants]
  );

  const backsByTarget = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of backs) {
      map.set(b.targetUserId, (map.get(b.targetUserId) || 0) + 1);
    }
    return map;
  }, [backs]);

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    if (!event || event.is_admin_only) return [];
    return participants
      .map((p) => ({
        user_id: p.userId,
        username: p.username || 'anon',
        backer_count: backsByTarget.get(p.userId) || 0,
      }))
      .sort((a, b) => b.backer_count - a.backer_count);
  }, [participants, backsByTarget, event]);

  const userBackings = useMemo(() => {
    if (!uid) return [];
    return backs.filter((b) => b.backerId === uid).map((b) => b.targetUserId);
  }, [backs, uid]);

  const hasReachedMaxBackings = useMemo(() => {
    const max = event?.max_backings_per_user ?? 1;
    return userBackings.length >= max;
  }, [userBackings, event]);

  // ---- Highlight participant from ?back_id=USER_ID ----
  useEffect(() => {
    const targetId = searchParams.get('back_id');
    if (!targetId || !eventId) return;
    const exists = participants.some((p) => p.userId === targetId);
    if (exists) {
      setHighlightedParticipant(targetId);
      document.getElementById(`participant-${targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedParticipant(null), 4000);
    }
    searchParams.delete('back_id');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, participants, eventId, setSearchParams]);

  // ---- Actions ----
  const handleRegister = async () => {
    if (!uid || !eventId) {
      toast.error('You must be signed in to register.');
      return;
    }
    try {
      // participations/{eventId_uid}
      const pid = `${eventId}_${uid}`;
      await setDoc(
        doc(db, 'participations', pid),
        {
          eventId,
          userId: uid,
          // denormalize username to avoid extra reads later (optional)
          username: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'user',
          joinedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("You've joined the event!");
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'permission-denied') toast.error('Registration blocked by security rules.');
      else toast.error(e?.message || 'Failed to register.');
    }
  };

  const handleBack = async (participantUserId: string) => {
    if (!uid || !eventId) {
      toast.error('You must be signed in to back a participant.');
      return;
    }
    if (!event?.backing_enabled) {
      toast.error('Backing is disabled for this event.');
      return;
    }
    if (hasReachedMaxBackings) {
      toast.error('You have reached the max backings for this event.');
      return;
    }
    const participant = participants.find((p) => p.userId === participantUserId);
    if (!participant) return;

    try {
      // backs/{eventId_backer_target}
      const bid = `${eventId}_${uid}_${participantUserId}`;
      await setDoc(
        doc(db, 'backs', bid),
        {
          eventId,
          backerId: uid,
          targetUserId: participantUserId,
          createdAt: serverTimestamp(),
        },
        { merge: false }
      );

      setBackedUsername(participant.username || 'participant');
      setBackedParticipantId(participantUserId);
      setShowBackingPopup(true);
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'already-exists') {
        toast('You already backed this participant.', { icon: 'ℹ️' });
      } else if (code === 'permission-denied') {
        toast.error('Backing blocked by security rules.');
      } else {
        toast.error(e?.message || 'Failed to back participant.');
      }
    }
  };

  const handleToggleUpdate = async (updates: { registration_enabled?: boolean; backing_enabled?: boolean }) => {
    if (!eventId || !isCreator) return;
    try {
      await updateDoc(doc(db, 'events', eventId), updates as any);
      toast.success('Event settings updated.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update settings.');
    }
  };

  // Guard: if event not found or user not authed, route back
  if (!loading && (!event || !uid)) return <Navigate to="/app/find" replace />;

  // Admin-only event branch
  if (event?.is_admin_only) {
    return (
      <PageWrapper title="">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/app/find')} className="mr-4 !p-2 h-10 w-10">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{event.title}</h1>
            {event.tag && <span className="ml-4 text-sm font-semibold text-secondary bg-secondary/10 py-1 px-3 rounded-full">{event.tag}</span>}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-200 p-6 rounded-xl border border-dark-300">
                <h2 className="text-xl font-bold text-white mb-2">About this Event</h2>
                <p className="text-light-200">{event.description}</p>
                <div className="flex items-center mt-4 text-sm text-light-200">
                  Created by <strong className="text-white ml-1">{event.creatorUsername || 'anon'}</strong>
                </div>
              </motion.div>
              {isCreator && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Button onClick={() => navigate(`/app/event/${eventId}/manage`)} className="w-full" variant="secondary">
                    <Edit size={20} /> Manage Event
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-200 p-6 rounded-xl border border-dark-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Trophy size={20} className="mr-2 text-yellow-400" />
                  Live Leaderboard
                </h2>
                <AdminLeaderboard leaderboard={managedParticipants} />
              </motion.div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Public/backable event branch
  return (
    <PageWrapper title="">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/find')} className="mr-4 !p-2 h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{event?.title || 'Event'}</h1>
          {event?.tag && <span className="ml-4 text-sm font-semibold text-primary bg-primary/10 py-1 px-3 rounded-full">{event.tag}</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-200 p-6 rounded-xl border border-dark-300">
              <h2 className="text-xl font-bold text-white mb-2">About this Event</h2>
              <p className="text-light-200">{event?.description}</p>
              <div className="flex items-center mt-4 text-sm text-light-200">
                Created by <strong className="text-white ml-1">{event?.creatorUsername || 'anon'}</strong>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-dark-200 p-6 rounded-xl border border-dark-300">
              <div className="flex items-center text-secondary">
                <Info size={20} className="mr-2" />
                <p>
                  You can back up to <strong className="text-white">{event?.max_backings_per_user ?? 1}</strong>{' '}
                  participant{(event?.max_backings_per_user ?? 1) > 1 ? 's' : ''} in this event.
                </p>
              </div>
            </motion.div>

            {isCreator && event && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-200 p-6 rounded-xl border border-dark-300">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Settings size={20} className="mr-2 text-primary" />
                  Creator Controls
                </h2>
                <div className="space-y-4">
                  <ToggleSwitch
                    label="Enable Registration"
                    enabled={event.registration_enabled}
                    setEnabled={(v) => handleToggleUpdate({ registration_enabled: v })}
                  />
                  <ToggleSwitch
                    label="Enable Backing"
                    enabled={event.backing_enabled}
                    setEnabled={(v) => handleToggleUpdate({ backing_enabled: v })}
                  />
                </div>
              </motion.div>
            )}

            {!isParticipant && (event?.registration_enabled ?? true) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button onClick={handleRegister} className="w-full" variant="secondary">
                  <UserPlus size={20} /> Register as a Participant
                </Button>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-200 p-6 rounded-xl border border-dark-300">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Trophy size={20} className="mr-2 text-yellow-400" />
                Live Leaderboard
              </h2>

              <PodiumLeaderboard
                leaderboard={leaderboard}
                userBackings={userBackings}
                onBack={handleBack}
                canBack={!hasReachedMaxBackings}
                backingEnabled={event?.backing_enabled ?? true}
                currentUserId={uid || ''}
                highlightedParticipant={highlightedParticipant}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <BackingPopup
        isVisible={showBackingPopup}
        username={backedUsername}
        participantId={backedParticipantId}
        onComplete={() => setShowBackingPopup(false)}
      />
    </PageWrapper>
  );
};

export default EventDetailPage;
