export interface Register {
  uid: string;
  email: string;
  name: string;
  dob: string;
  sex: 'm' | 'f';
  contact: string;
  geo: string;
  isMember: boolean;
  joins: number[];
  createdAt: number; // unix
  updatedAt: number; // unix
}
