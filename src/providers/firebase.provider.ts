import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app';
import * as process from 'process';

export function getFirebase() {
  try {
    return getApp();
  } catch (e) {
    return initializeApp({
      credential: applicationDefault(),
      databaseURL: process.env.FS_DATABASE_URL,
      storageBucket: process.env.FS_STORAGE_URL,
      databaseAuthVariableOverride: {
        uid: 'svc-worker',
      },
    });
  }
}
