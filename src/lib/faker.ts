import { faker } from '@faker-js/faker';

export interface Event {
  id: string;
  title: string;
  creator: {
    name: string;
    avatar: string;
  };
  participants: number;
  tag: string;
  closingSoon: boolean;
  isNew: boolean;
  isTrending: boolean;
}

export const createRandomEvent = (): Event => {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words({ min: 2, max: 5 }),
    creator: {
      name: faker.internet.userName(),
      avatar: faker.image.avatarLegacy(),
    },
    participants: faker.number.int({ min: 5, max: 500 }),
    tag: faker.helpers.arrayElement(['#gaming', '#dance', '#music', '#tech', '#sports']),
    closingSoon: faker.datatype.boolean({ probability: 0.3 }),
    isNew: faker.datatype.boolean({ probability: 0.4 }),
    isTrending: faker.datatype.boolean({ probability: 0.2 }),
  };
};

export const mockEvents: Event[] = Array.from({ length: 20 }, createRandomEvent);
