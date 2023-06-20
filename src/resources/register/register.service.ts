import { Injectable } from '@nestjs/common';
import type { Register } from './entities/register.entity';
import { getDatabase } from 'firebase-admin/database';
import { unixNow } from '@/utils/index.util';
import { getFirebase } from '@/providers/firebase.provider';

const DB_NAME = 'register';

@Injectable()
export class RegisterService {
  private readonly db;

  constructor() {
    const app = getFirebase();
    this.db = getDatabase(app);
  }

  async create(register: Register) {
    const document = this.db.ref(DB_NAME);
    const key = btoa(register.email);
    const instance = await document.child(key).once('value');
    if (!instance.val()) {
      const record: Register = { ...register };
      const current = unixNow();
      record.uid = key;
      record.createdAt = current;
      record.updatedAt = current;
      await document.child(key).set(record);
      return true;
    }
    return false;
  }

  async getCount() {
    const document = await this.db.ref(DB_NAME).once('value');
    return { count: Object.keys(document.val()).length };
  }
}

class RegisterError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
