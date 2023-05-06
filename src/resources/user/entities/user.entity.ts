import { Register } from '@/resources/register/entities/register.entity';

export const ActionTypes = {
  Contact: 'contact',
  Match: 'match',
} as const;

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes];

export interface User extends Register {
  password: string;
  image: string; // Link to file
  bio: string;
  tweet: string;
  mbti: string;
  interest: string;
  ageGroup: number[]; // tuple of year
}

export class Message {
  from: string;
  to: string;
  msgType: ActionType;
  isReveal: boolean;
}

export interface UserCredential {
  email: string;
  password: string;
  fcm: string;
}

export interface UserAuth {
  token: string;
  isFirst: boolean; // true - has no additional
}