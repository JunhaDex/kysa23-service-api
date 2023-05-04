export interface Register {
  uid: string;
  email: string;
  name: string;
  dob: string;
  sex: 'm' | 'f';
  contact: string;
  geo: string;
  isMember: boolean;
}

export interface User extends Register {
  password: string;
  image: string; // Link to file
  bio: string;
}
