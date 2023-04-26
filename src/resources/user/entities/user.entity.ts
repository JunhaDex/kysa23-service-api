import { Register } from '@/resources/register/entities/register.entity';

const ActionTypes = {
  Contact: 'contact',
  Match: 'match',
} as const;

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes];

export interface User extends Register {
  password: string;
  image: string; // Link to file
  bio: string;
}

export class Message {
  from: string;
  uid: string;
  msgType: ActionType;
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
