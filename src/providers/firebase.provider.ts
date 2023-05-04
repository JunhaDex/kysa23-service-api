import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app';

export function getFirebase() {
  try {
    return getApp();
  } catch (e) {
    return initializeApp({
      credential: applicationDefault(),
      databaseURL: process.env.FS_DATABASE_URL,
      databaseAuthVariableOverride: {
        uid: 'svc-worker',
      },
    });
  }
}
