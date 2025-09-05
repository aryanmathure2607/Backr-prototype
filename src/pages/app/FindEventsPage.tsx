import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import PageWrapper from '../../components/app/PageWrapper';
import EventCard from '../../components/app/EventCard';
import toast from 'react-hot-toast';

import { db } from '../../config/firebase';
import {
  collection, doc, getCountFromServer, getDoc,
  onSnapshot, orderBy, query, where, limit,
} from 'firebase/firestore';

type EventUI = {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  tagLower?: string;
  creatorId: string;
  creatorUsername?: string;
  participants_count: number;
  createdAt?: any;
  is_admin_only?: boolean;
  isPublic?: boolean;
};

const FindEventsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<EventUI[]>([]);
  const [loading, setLoading] = useState(true);

  const userCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    setLoading(true);

    // Preferred query (needs a composite index: isPublic + createdAt)
    const preferred = query(
      collection(db, 'events'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    // Fallback query (no composite index needed)
    const fallback = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    let unsub: (() => void) | null = null;

    // Attach the preferred listener first
    unsub = onSnapshot(
      preferred,
      async (snap) => {
        const baseRows: EventUI[] = snap.docs.map((d) => {
          const x = d.data() as any;
          return {
            id: d.id,
            title: String(x.title || ''),
            description: x.description || '',
            tag: x.tag || '',
            tagLower: x.tagLower || (x.tag ? String(x.tag).toLowerCase() : ''),
            creatorId: String(x.creatorId || ''),
            createdAt: x.createdAt ?? null,
            is_admin_only: Boolean(x.is_admin_only),
            isPublic: Boolean(x.isPublic),
            participants_count: 0,
          };
        });

        const rows = await enrichCountsAndUsernames(baseRows, userCacheRef.current);
        setEvents(rows);
        setLoading(false);
      },
      (err) => {
        // If it’s an index error, Firestore includes a link to create the index
        console.error('events onSnapshot error:', err);
        setLoading(false);

        if (String(err?.code) === 'failed-precondition' && String(err?.message || '').includes('index')) {
          toast.error('A Firestore index is required. Falling back temporarily.');
          // Re-attach listener with fallback and client-side isPublic filter
          setLoading(true);
          unsub?.(); // ensure previous is detached
          unsub = onSnapshot(
            fallback,
            async (snap2) => {
              const baseRows: EventUI[] = snap2.docs.map((d) => {
                const x = d.data() as any;
                return {
                  id: d.id,
                  title: String(x.title || ''),
                  description: x.description || '',
                  tag: x.tag || '',
                  tagLower: x.tagLower || (x.tag ? String(x.tag).toLowerCase() : ''),
                  creatorId: String(x.creatorId || ''),
                  createdAt: x.createdAt ?? null,
                  is_admin_only: Boolean(x.is_admin_only),
                  isPublic: Boolean(x.isPublic),
                  participants_count: 0,
                };
              }).filter(e => e.isPublic !== false); // keep public by default

              enrichCountsAndUsernames(baseRows, userCacheRef.current)
                .then((rows) => {
                  setEvents(rows);
                  setLoading(false);
                })
                .catch(() => setLoading(false));
            },
            (err2) => {
              console.error('fallback events onSnapshot error:', err2);
              toast.error(err2?.message || 'Failed to load events.');
              setLoading(false);
            }
          );
        } else {
          toast.error(err?.message || 'Failed to load events.');
        }
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return events;
    return events.filter((e) =>
      e.title.toLowerCase().includes(term) ||
      (e.creatorUsername?.toLowerCase() || '').includes(term) ||
      (e.tagLower || '').includes(term)
    );
  }, [events, searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <PageWrapper title="Find Events">
      <div className="space-y-6">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-light-200" size={20} />
          <input
            type="text"
            placeholder="Search by name, creator, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-200 border border-dark-300 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading && (
          <div className="text-center py-16 text-light-200">Loading events…</div>
        )}

        {!loading && (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={{
                      id: evt.id,
                      title: evt.title,
                      tag: evt.tag,
                      creatorUsername: evt.creatorUsername,
                      participants_count: evt.participants_count,
                      is_admin_only: evt.is_admin_only,
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-16 text-light-200">
                <h3 className="text-xl font-semibold">No events found</h3>
                <p>Try adjusting your search or create the first event!</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default FindEventsPage;

// ---------- helpers ----------
async function enrichCountsAndUsernames(
  baseRows: EventUI[],
  cache: Map<string, string>
): Promise<EventUI[]> {
  return Promise.all(
    baseRows.map(async (evt) => {
      // participants count
      let count = 0;
      try {
        const countQ = query(collection(db, 'participations'), where('eventId', '==', evt.id));
        const agg = await getCountFromServer(countQ);
        count = agg.data().count;
      } catch {
        // ignore count error
      }

      // creator username (cache)
      let creatorUsername = cache.get(evt.creatorId);
      if (!creatorUsername && evt.creatorId) {
        try {
          const uSnap = await getDoc(doc(db, 'users', evt.creatorId));
          if (uSnap.exists()) {
            const u = uSnap.data() as any;
            creatorUsername = String(u.username || u.displayName || 'anon');
            cache.set(evt.creatorId, creatorUsername);
          }
        } catch {
          // ignore
        }
      }

      return { ...evt, participants_count: Number(count || 0), creatorUsername };
    })
  );
}
