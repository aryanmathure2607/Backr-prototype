// store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { faker } from '@faker-js/faker';
import { Profile, Event, Participant, Backing, ManagedParticipant } from './types';

// ---- If you're using Firebase v9+ (modular) ----
import { User } from 'firebase/auth';

// -------------------------------------------
// MOCK DATA GENERATION (unchanged from yours)
// -------------------------------------------
const createInitialData = () => {
  const zephyrControlsUser: Profile = { id: faker.string.uuid(), username: 'Zephyr Controls', created_at: faker.date.past().toISOString() };
  const amiteshUser: Profile = { id: faker.string.uuid(), username: 'Amitesh', created_at: faker.date.past().toISOString() };
  const wavesControlsUser: Profile = { id: faker.string.uuid(), username: 'Waves Controls', created_at: faker.date.past().toISOString() };
  const bitsFcUser: Profile = { id: faker.string.uuid(), username: 'BITS FC', created_at: faker.date.past().toISOString() };

  const otherUsers: Profile[] = Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    created_at: faker.date.past().toISOString(),
  }));

  const users: Profile[] = [zephyrControlsUser, amiteshUser, wavesControlsUser, bitsFcUser, ...otherUsers];

  const specificEventsData = [
    { title: 'Airball Match 1', description: 'The annual basketball tournament kicks off with a thrilling first match. Who will dominate the court?', tag: '#sports', max_backings_per_user: 1, creator: amiteshUser },
    { title: 'Sizzle Elims', description: 'The preliminary rounds for the Sizzle dance competition. Only the best will make it through.', tag: '#dance', max_backings_per_user: 3, creator: wavesControlsUser },
    { title: 'BITS FC vs Vasco UTD', description: 'A friendly but fierce football match between two local giants. Expect a full house.', tag: '#sports', max_backings_per_user: 1, creator: bitsFcUser },
    { title: 'Battle of the Bands', description: 'Local bands compete for a record deal and the title of Best Campus Band. Expect loud music and electric performances.', tag: '#music', max_backings_per_user: 2, creator: zephyrControlsUser },
    { title: 'Startup Pitch Night 2025', description: 'Future entrepreneurs pitch their groundbreaking ideas to a panel of investors and industry leaders. Witness the next big thing.', tag: '#business', max_backings_per_user: 5, creator: faker.helpers.arrayElement(otherUsers) },
  ];

  const events: Event[] = specificEventsData.map(ed => ({
    ...ed,
    id: faker.string.uuid(),
    creator_id: ed.creator.id,
    profiles: ed.creator,
    registration_enabled: true,
    backing_enabled: true,
    created_at: faker.date.recent().toISOString(),
    is_admin_only: false,
  }));

  const participants: Participant[] = [];
  events.forEach(event => {
    const numParticipants = faker.number.int({ min: 5, max: 10 });
    const eventParticipants = faker.helpers.shuffle(users).slice(0, numParticipants);
    eventParticipants.forEach(user => {
      participants.push({
        event_id: event.id,
        user_id: user.id,
        created_at: faker.date.recent().toISOString(),
        profiles: user,
      });
    });
  });

  const backings: Backing[] = [];
  participants.forEach(participant => {
    const numBackers = faker.number.int({ min: 0, max: 15 });
    const backers = faker.helpers.shuffle(users).slice(0, numBackers);
    backers.forEach(backer => {
      if (!backings.some(b => b.event_id === participant.event_id && b.participant_id === participant.user_id && b.backer_id === backer.id)) {
        backings.push({
          id: faker.string.uuid(),
          event_id: participant.event_id,
          participant_id: participant.user_id,
          backer_id: backer.id,
          created_at: faker.date.recent().toISOString(),
        });
      }
    });
  });

  const zephyrEventId = faker.string.uuid();
  const zephyrEvent: Event = {
    id: zephyrEventId,
    title: "Zephyr 25'",
    description: 'The annual inter-hostel cultural festival. Points are updated live by event admins.',
    tag: '#fest',
    creator_id: zephyrControlsUser.id,
    profiles: zephyrControlsUser,
    registration_enabled: false,
    backing_enabled: false,
    max_backings_per_user: 0,
    created_at: faker.date.recent().toISOString(),
    is_admin_only: true,
  };
  events.unshift(zephyrEvent);

  const managedParticipants: ManagedParticipant[] = [];
  ['AH1','AH2','AH3','AH4','AH5','AH6','AH7','AH8','AH9'].forEach(h => {
    managedParticipants.push({
      id: faker.string.uuid(),
      event_id: zephyrEventId,
      name: h,
      points: faker.number.int({ min: 50, max: 500 }),
    });
  });

  return { users, events, participants, backings, managedParticipants };
};

const initialState = createInitialData();

// ----------------------
// STORE: State & Actions
// ----------------------
interface AppState {
  // Auth (Firebase is source of truth)
  authReady: boolean;
  firebaseUser: Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'> | null;

  // Optional mirrored profile for your UI (derived from Firebase user)
  profile: Profile | null;

  // App data
  users: Profile[];
  events: Event[];
  participants: Participant[];
  backings: Backing[];
  managedParticipants: ManagedParticipant[];

  // Actions
  setAuthFromFirebase: (user: User | null) => void;
  resetAuth: () => void;
  createEvent: (eventData: Omit<Event, 'id' | 'created_at' | 'profiles'>) => Event;
  createAdminEvent: (eventData: Omit<Event, 'id' | 'created_at' | 'profiles' | 'registration_enabled' | 'backing_enabled' | 'max_backings_per_user' | 'is_admin_only'>) => Event;
  registerForEvent: (eventId: string, userId: string) => void;
  backParticipant: (eventId: string, participantId: string, backerId: string) => void;
  updateEventToggles: (eventId: string, updates: Partial<{ registration_enabled: boolean; backing_enabled: boolean }>) => void;
  addManagedParticipant: (eventId: string, name: string) => void;
  updateManagedParticipantPoints: (participantId: string, points: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth slice (persist only tiny bit; Firebase still rules)
      authReady: false,
      firebaseUser: null,
      profile: null,

      // App data (mock, not persisted)
      users: initialState.users,
      events: initialState.events,
      participants: initialState.participants,
      backings: initialState.backings,
      managedParticipants: initialState.managedParticipants,

      // ----------------
      // Auth wiring
      // ----------------
      setAuthFromFirebase: (user) => {
        if (!user) {
          set({ firebaseUser: null, profile: null, authReady: true });
          return;
        }
        const lite = {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          photoURL: user.photoURL ?? null,
        };
        // Map Firebase user to your local Profile shape (optional)
        let p = get().profile;
        if (!p || p.id !== lite.uid) {
          p = {
            id: lite.uid,
            username: lite.displayName || lite.email || 'User',
            created_at: new Date().toISOString(),
          };
        }
        set({ firebaseUser: lite, profile: p, authReady: true });
      },

      resetAuth: () => {
        set({ firebaseUser: null, profile: null, authReady: true });
        try { localStorage.removeItem('backr_auth'); } catch {}
      },

      // -------------
      // App actions
      // -------------
      createEvent: (eventData) => {
        const current = get().firebaseUser;
        const prof = get().profile;
        if (!current || !prof) throw new Error('Must be signed in to create an event.');
        const newEvent: Event = {
          ...eventData,
          id: faker.string.uuid(),
          created_at: new Date().toISOString(),
          profiles: prof,
          is_admin_only: false,
        };
        set(produce((draft: AppState) => { draft.events.push(newEvent); }));
        return newEvent;
      },

      createAdminEvent: (eventData) => {
        const current = get().firebaseUser;
        const prof = get().profile;
        if (!current || !prof) throw new Error('Must be signed in to create an admin-only event.');
        const newEvent: Event = {
          ...eventData,
          id: faker.string.uuid(),
          created_at: new Date().toISOString(),
          profiles: prof,
          registration_enabled: false,
          backing_enabled: false,
          max_backings_per_user: 0,
          is_admin_only: true,
        };
        set(produce((draft: AppState) => { draft.events.push(newEvent); }));
        return newEvent;
      },

      registerForEvent: (eventId, userId) => {
        set(produce((draft: AppState) => {
          const user = draft.users.find(u => u.id === userId);
          if (user && !draft.participants.some(p => p.event_id === eventId && p.user_id === userId)) {
            draft.participants.push({
              event_id: eventId,
              user_id: userId,
              created_at: new Date().toISOString(),
              profiles: user,
            });
          }
        }));
      },

      backParticipant: (eventId, participantId, backerId) => {
        set(produce((draft: AppState) => {
          draft.backings.push({
            id: faker.string.uuid(),
            event_id: eventId,
            participant_id: participantId,
            backer_id: backerId,
            created_at: new Date().toISOString(),
          });
        }));
      },

      updateEventToggles: (eventId, updates) => {
        set(produce((draft: AppState) => {
          const event = draft.events.find(e => e.id === eventId);
          if (event) {
            if (updates.registration_enabled !== undefined) event.registration_enabled = updates.registration_enabled;
            if (updates.backing_enabled !== undefined) event.backing_enabled = updates.backing_enabled;
          }
        }));
      },

      addManagedParticipant: (eventId, name) => {
        set(produce((draft: AppState) => {
          draft.managedParticipants.push({
            id: faker.string.uuid(),
            event_id,
            name,
            points: 0,
          });
        }));
      },

      updateManagedParticipantPoints: (participantId, points) => {
        set(produce((draft: AppState) => {
          const participant = draft.managedParticipants.find(p => p.id === participantId);
          if (participant) participant.points = points;
        }));
      },
    }),
    {
      name: 'backr_auth',
      storage: createJSONStorage(() => localStorage),
      // Persist just enough to avoid UI flicker; Firebase still drives truth.
      partialize: (s) => ({
        firebaseUser: s.firebaseUser, // tiny snapshot; may be null until Firebase hydrates
        profile: s.profile,
      }),
      onRehydrateStorage: () => (_state, _err) => {
        // After hydration completes, we still wait for Firebase onAuthStateChanged
        // to call setAuthFromFirebase(user). Until then, authReady should be false.
      },
    }
  )
);
