import { getApp, initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import cred from '../.config.json';
import * as path from 'path';

export async function getFirebase() {
  const secPath = path.join(process.cwd(), cred.fbAdmin);
  const svcAcc = await import(secPath);
  return initializeApp({
    credential: credential.cert(svcAcc),
    databaseURL: cred.dbUrl,
    databaseAuthVariableOverride: {
      uid: 'svc-worker',
    },
  });
}
