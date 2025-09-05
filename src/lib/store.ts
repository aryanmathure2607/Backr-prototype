import { create } from 'zustand';
import { produce } from 'immer';
import { faker } from '@faker-js/faker';
import { Profile, Event, Participant, Backing, ManagedParticipant } from './types';

// --- MOCK DATA GENERATION ---
const createInitialData = () => {
  // 1. Create specific users first
  const zephyrControlsUser: Profile = { id: faker.string.uuid(), username: 'Zephyr Controls', created_at: faker.date.past().toISOString() };
  const amiteshUser: Profile = { id: faker.string.uuid(), username: 'Amitesh', created_at: faker.date.past().toISOString() };
  const wavesControlsUser: Profile = { id: faker.string.uuid(), username: 'Waves Controls', created_at: faker.date.past().toISOString() };
  const bitsFcUser: Profile = { id: faker.string.uuid(), username: 'BITS FC', created_at: faker.date.past().toISOString() };

  // 2. Create other random users
  const otherUsers: Profile[] = Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    created_at: faker.date.past().toISOString(),
  }));
  
  const users: Profile[] = [zephyrControlsUser, amiteshUser, wavesControlsUser, bitsFcUser, ...otherUsers];

  // 3. Define the specific events with their creators
  const specificEventsData = [
    {
      title: "Airball Match 1",
      description: 'The annual basketball tournament kicks off with a thrilling first match. Who will dominate the court?',
      tag: '#sports',
      max_backings_per_user: 1,
      creator: amiteshUser,
    },
    {
      title: "Sizzle Elims",
      description: 'The preliminary rounds for the Sizzle dance competition. Only the best will make it through.',
      tag: '#dance',
      max_backings_per_user: 3,
      creator: wavesControlsUser,
    },
    {
      title: "BITS FC vs Vasco UTD",
      description: 'A friendly but fierce football match between two local giants. Expect a full house.',
      tag: '#sports',
      max_backings_per_user: 1,
      creator: bitsFcUser,
    },
    {
      title: "Battle of the Bands",
      description: 'Local bands compete for a record deal and the title of Best Campus Band. Expect loud music and electric performances.',
      tag: '#music',
      max_backings_per_user: 2,
      creator: zephyrControlsUser,
    },
    {
      title: 'Startup Pitch Night 2025',
      description: 'Future entrepreneurs pitch their groundbreaking ideas to a panel of investors and industry leaders. Witness the next big thing.',
      tag: '#business',
      max_backings_per_user: 5,
      creator: faker.helpers.arrayElement(otherUsers), // A random creator for this one
    },
  ];

  const events: Event[] = specificEventsData.map(eventData => ({
    ...eventData,
    id: faker.string.uuid(),
    creator_id: eventData.creator.id,
    profiles: eventData.creator,
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

  // --- Create and Prepend Dummy Admin Event ---
  const zephyrEventId = faker.string.uuid();
  const zephyrEvent: Event = {
    id: zephyrEventId,
    title: "Zephyr 25'",
    description: "The annual inter-hostel cultural festival. Points are updated live by event admins.",
    tag: '#fest',
    creator_id: zephyrControlsUser.id,
    profiles: zephyrControlsUser,
    registration_enabled: false,
    backing_enabled: false,
    max_backings_per_user: 0,
    created_at: faker.date.recent().toISOString(),
    is_admin_only: true,
  };
  events.unshift(zephyrEvent); // Prepend to ensure it's the first event

  const managedParticipants: ManagedParticipant[] = [];
  const hostels = ['AH1', 'AH2', 'AH3', 'AH4', 'AH5', 'AH6', 'AH7', 'AH8', 'AH9'];
  hostels.forEach(hostelName => {
    managedParticipants.push({
      id: faker.string.uuid(),
      event_id: zephyrEventId,
      name: hostelName,
      points: faker.number.int({ min: 50, max: 500 }),
    });
  });

  return { users, events, participants, backings, managedParticipants };
};


// --- ZUSTAND STORE DEFINITION ---
interface AppState {
  session: { userId: string } | null;
  profile: Profile | null;
  users: Profile[];
  events: Event[];
  participants: Participant[];
  backings: Backing[];
  managedParticipants: ManagedParticipant[];
  signIn: (username: string, email: string) => void;
  signOut: () => void;
  createEvent: (eventData: Omit<Event, 'id' | 'created_at' | 'profiles'>) => Event;
  createAdminEvent: (eventData: Omit<Event, 'id' | 'created_at' | 'profiles' | 'registration_enabled' | 'backing_enabled' | 'max_backings_per_user' | 'is_admin_only'>) => Event;
  registerForEvent: (eventId: string, userId: string) => void;
  backParticipant: (eventId: string, participantId: string, backerId: string) => void;
  updateEventToggles: (eventId: string, updates: Partial<{ registration_enabled: boolean; backing_enabled: boolean }>) => void;
  addManagedParticipant: (eventId: string, name: string) => void;
  updateManagedParticipantPoints: (participantId: string, points: number) => void;
}

const initialState = createInitialData();

export const useStore = create<AppState>((set, get) => ({
  session: null,
  profile: null,
  users: initialState.users,
  events: initialState.events,
  participants: initialState.participants,
  backings: initialState.backings,
  managedParticipants: initialState.managedParticipants,

  signIn: (username, email) => {
    let user = get().users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      user = { id: faker.string.uuid(), username, created_at: new Date().toISOString() };
      set(produce((draft: AppState) => {
        draft.users.push(user!);
      }));
    }
    set({ session: { userId: user.id }, profile: user });
  },

  signOut: () => set({ session: null, profile: null }),

  createEvent: (eventData) => {
    const newEvent: Event = {
      ...eventData,
      id: faker.string.uuid(),
      created_at: new Date().toISOString(),
      profiles: get().profile!,
      is_admin_only: false,
    };
    set(produce((draft: AppState) => {
      draft.events.push(newEvent);
    }));
    return newEvent;
  },

  createAdminEvent: (eventData) => {
    const newEvent: Event = {
      ...eventData,
      id: faker.string.uuid(),
      created_at: new Date().toISOString(),
      profiles: get().profile!,
      registration_enabled: false,
      backing_enabled: false,
      max_backings_per_user: 0,
      is_admin_only: true,
    };
    set(produce((draft: AppState) => {
      draft.events.push(newEvent);
    }));
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
        if (updates.registration_enabled !== undefined) {
          event.registration_enabled = updates.registration_enabled;
        }
        if (updates.backing_enabled !== undefined) {
          event.backing_enabled = updates.backing_enabled;
        }
      }
    }));
  },

  addManagedParticipant: (eventId, name) => {
    set(produce((draft: AppState) => {
      const newParticipant: ManagedParticipant = {
        id: faker.string.uuid(),
        event_id: eventId,
        name,
        points: 0,
      };
      draft.managedParticipants.push(newParticipant);
    }));
  },

  updateManagedParticipantPoints: (participantId, points) => {
    set(produce((draft: AppState) => {
      const participant = draft.managedParticipants.find(p => p.id === participantId);
      if (participant) {
        participant.points = points;
      }
    }));
  },
}));
