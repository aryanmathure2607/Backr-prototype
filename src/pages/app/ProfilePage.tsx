import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/app/PageWrapper';
import StatCard from '../../components/app/StatCard';
import { Users, Award, BarChart, LogOut, HeartHandshake } from 'lucide-react';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

import { auth, db } from '../../config/firebase';
import {
  collection, query, where, getCountFromServer, doc, getDoc
} from 'firebase/firestore';
import { signOut as fbSignOut } from 'firebase/auth';

type UserDoc = {
  username?: string;
  createdAt?: any; // Timestamp
  photoURL?: string | null;
  email?: string | null;
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid || null;

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [eventsCreated, setEventsCreated] = useState(0);
  const [eventsParticipated, setEventsParticipated] = useState(0);
  const [participantsBacked, setParticipantsBacked] = useState(0);
  const [lifetimeBackers, setLifetimeBackers] = useState(0);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    (async () => {
      try {
        // Fetch user profile doc (optional; used for username + createdAt)
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setUserDoc({
            username: data.username || auth.currentUser?.displayName || (auth.currentUser?.email?.split('@')[0] ?? 'You'),
            createdAt: data.createdAt,
            photoURL: data.photoURL ?? auth.currentUser?.photoURL ?? null,
            email: auth.currentUser?.email ?? null,
          });
        } else {
          setUserDoc({
            username: auth.currentUser?.displayName || (auth.currentUser?.email?.split('@')[0] ?? 'You'),
            createdAt: undefined,
            photoURL: auth.currentUser?.photoURL ?? null,
            email: auth.currentUser?.email ?? null,
          });
        }

        // Counts (server-side)
        const [
          cEventsCreated,
          cParticipations,
          cParticipantsBacked,
          cLifetimeBackers,
        ] = await Promise.all([
          getCountFromServer(query(collection(db, 'events'), where('creatorId', '==', uid))),
          getCountFromServer(query(collection(db, 'participations'), where('userId', '==', uid))),
          getCountFromServer(query(collection(db, 'backs'), where('backerId', '==', uid))),
          getCountFromServer(query(collection(db, 'backs'), where('targetUserId', '==', uid))),
        ]);

        setEventsCreated(cEventsCreated.data().count);
        setEventsParticipated(cParticipations.data().count);
        setParticipantsBacked(cParticipantsBacked.data().count);
        setLifetimeBackers(cLifetimeBackers.data().count);
      } catch (e: any) {
        console.error(e);
        toast.error('Failed to load profile stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      navigate('/');
    } catch (e: any) {
      toast.error('Sign out failed.');
    }
  };

  if (!uid) return <Navigate to="/login" replace />;

  const initials = useMemo(() => {
    const name = userDoc?.username || 'You';
    return String(name).charAt(0).toUpperCase();
  }, [userDoc?.username]);

  const memberSinceYear = useMemo(() => {
    // prefer Firestore createdAt; fallback to auth creation time
    const ts = userDoc?.createdAt?.toDate?.() as Date | undefined;
    const fromAuth = auth.currentUser?.metadata?.creationTime
      ? new Date(auth.currentUser.metadata.creationTime)
      : undefined;
    return (ts || fromAuth || new Date()).getFullYear();
  }, [userDoc?.createdAt]);

  return (
    <PageWrapper title="My Profile">
      <div className="space-y-8">
        {/* Header card */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-dark-200 p-8 rounded-xl border border-dark-300">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold">
            {initials}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold text-white">
              {userDoc?.username || 'You'}
            </h2>
            <p className="text-md text-light-200">
              Member since {memberSinceYear}
            </p>
            {userDoc?.email && (
              <p className="text-sm text-light-200/80 mt-1">{userDoc.email}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Award />} label="Events Created" value={eventsCreated} color="secondary" loading={loading} />
          <StatCard icon={<Users />} label="Events Participated" value={eventsParticipated} color="primary" loading={loading} />
          <StatCard icon={<BarChart />} label="Participants Backed" value={participantsBacked} color="secondary" loading={loading} />
          <StatCard icon={<HeartHandshake />} label="Lifetime Backers" value={lifetimeBackers.toLocaleString()} color="primary" loading={loading} />
        </div>

        {/* Account */}
        <div className="bg-dark-200 p-8 rounded-xl border border-dark-300">
          <h3 className="text-xl font-bold mb-4">Account</h3>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut size={20} />
            Sign Out
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfilePage;
