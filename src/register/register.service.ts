import { Injectable, Logger } from '@nestjs/common';
import type { Register } from './entities/register.entity';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import * as process from 'process';

const DB_NAME = 'test';

@Injectable()
export class RegisterService {
  private readonly db;

  constructor() {
    const app = initializeApp({
      credential: applicationDefault(),
      databaseURL: process.env.FS_DATABASE_URL,
    });
    this.db = getDatabase(app);
  }

  create(register: Register) {
    console.log(btoa(register.email), register);
    return 'This action adds a new register';
  }

  async findAll(options?: any) {
    const ref = this.db.ref(DB_NAME);
    const data = await ref.once('value');
    console.log(data.val());
    return `This action returns all register`;
  }

  async findOne(id: string) {
    const ref = this.db.ref(`${DB_NAME}/${id}`);
    const data = await ref.once('value');
    console.log(data.val());
    return `This action returns a #${id} register`;
  }

  update(id: string, register: Register) {
    return `This action updates a #${id} register`;
  }

  remove(id: string) {
    return `This action removes a #${id} register`;
  }
}
