import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app';
import * as process from 'process';
import { Message } from '@/types/general.type';
import axios from 'axios';

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

export async function sendMessage(fcm: string, noti: Message) {
  if (fcm) {
    const api = axios.create({
      baseURL: 'https://fcm.googleapis.com/fcm',
      headers: {
        Authorization: `key=${process.env.FS_MESSAGING_SVR}`,
        'Content-Type': 'application/json',
      },
    });
    return await api.post('send', {
      to: fcm,
      priority: 'high',
      notification: { ...noti.notification },
    });
  }
  throw new Error('FCM not specified (User not active)');
}
