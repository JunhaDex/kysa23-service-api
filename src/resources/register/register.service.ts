import { Injectable } from '@nestjs/common';
import type { Register } from './entities/register.entity';
import { getDatabase } from 'firebase-admin/database';
import { unixNow } from '@/utils/index.util';
import { getFirebase } from '@/providers/firebase.provider';

const DB_NAME = 'register';
const DB_COUPON = 'reg_coupon';

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

  async getCoupon(
    key: string,
  ): Promise<{ code: string; rank: string } | undefined> {
    const ctb = this.db.ref(DB_COUPON); // coupon table
    const instance = await ctb.child(`_${key}`).once('value');
    if (instance.val()) {
      return instance.val();
    }
  }

  async getCount() {
    const document = await this.db.ref(DB_NAME).once('value');
    return { count: Object.keys(document.val()).length };
  }

  async getRegister(params: { name: string; phone: string }) {
    const document = this.db.ref(DB_NAME);
    const instance = await document
      .orderByChild('contact')
      .equalTo(params.phone)
      .once('value');
    const registers = instance.val();
    if (registers) {
      const reg = Object.values(registers)
        .filter((rr: Register) => rr.name.includes(params.name))
        .pop() as Register;
      if (reg) {
        return reg;
      }
    }
    throw new RegisterError(403, 'Invalid Access');
  }

  async getOneRegister(params: { email: string }) {
    const document = this.db.ref(DB_NAME);
    const uid = btoa(params.email);
    const instance = await document.child(uid).once('value');
    const register = instance.val();
    if (register) {
      return register;
    }
    throw new RegisterError(403, 'Invalid Access');
  }

  async searchGroup(
    params: { email: string },
    query?: {
      group?: string;
    },
  ) {
    const document = this.db.ref(DB_NAME);
    const uid = btoa(params.email);
    const myInst = await document.child(uid).once('value');
    const me: Register = myInst.val();
    if (me) {
      const items = [];
      let count = 0;
      let leader: Register;
      const groupInst = await document
        .orderByChild('group')
        .equalTo(query.group)
        .once('value');
      const result = groupInst.val();
      if (result) {
        let clean = Object.values(result).filter(
          (item: Register) => item.group === query.group,
        );
        const ll = clean
          .filter((item: Register) => !!item.isLeader)
          .pop() as Register;
        if (ll) {
          clean = [
            ll,
            ...clean.filter((item: Register) => item.uid !== ll.uid),
          ];
        }
        items.push(...clean);
        count = clean.length;
        if (me.group === query.group) {
          leader = ll;
        }
      }
      return {
        items,
        count,
        leader,
      };
    }
    throw new RegisterError(403, 'Invalid Access');
  }

  async searchName(
    params: { email: string },
    query?: {
      name?: string;
    },
  ) {
    const document = this.db.ref(DB_NAME);
    const uid = btoa(params.email);
    const myInst = await document.child(uid).once('value');
    const me: Register = myInst.val();
    if (me) {
      const items = [];
      let count = 0;
      const groupInst = await document
        .orderByChild('name')
        .equalTo(query.name)
        .once('value');
      const result = groupInst.val();
      if (result) {
        const clean = Object.values(result).filter(
          (item: Register) => item.name === query.name,
        );
        items.push(...clean);
        count = clean.length;
      }
      return {
        items,
        count,
      };
    }
    throw new RegisterError(403, 'Invalid Access');
  }

  async searchRoommates(params: { email: string }) {
    const document = this.db.ref(DB_NAME);
    const items = [];
    let count = 0;
    const register = await this.getOneRegister(params);
    if (register) {
      const room = register.room;
      if (room) {
        const groupInst = await document
          .orderByChild('room')
          .equalTo(room)
          .once('value');
        const result = groupInst.val();
        if (result) {
          const clean = Object.values(result).filter(
            (item: Register) => item.room === room,
          );
          items.push(...clean);
          count = clean.length;
        }
      }
      return {
        items,
        count,
      };
    }
    throw new RegisterError(403, 'Invalid Access');
  }
}

class RegisterError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
