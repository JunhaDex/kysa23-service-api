export interface Register {
  uid: string;
  email: string;
  name: string;
  dob: string;
  sex: 'm' | 'f';
  contact: string;
  geo: string;
  isMember: boolean;
  createdAt: number; // unix
}

export interface User extends Register {
  group?: string; // TODO: Remove Temp Entity
  password: string;
  image: string; // Link to file
  bio: string;
  tweet: string;
  mbti: string;
  interest: string;
  ageGroup: number[]; // tuple of year
}

export type RegisterInput = 'general' | 'sensitive';
