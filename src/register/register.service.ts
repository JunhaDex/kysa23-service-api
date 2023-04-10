import { Injectable } from '@nestjs/common';
import type { Register } from './entities/register.entity';
import { credential, initializeApp } from 'firebase-admin';

@Injectable()
export class RegisterService {
  private fireStore;

  constructor() {
    this.fireStore = initializeApp({
      credential: credential.applicationDefault(),
    });
  }

  create(register: Register) {
    return 'This action adds a new register';
  }

  findAll() {
    return `This action returns all register`;
  }

  findOne(id: number) {
    return `This action returns a #${id} register`;
  }

  update(register: Register) {
    return `This action updates a #${id} register`;
  }

  remove(id: number) {
    return `This action removes a #${id} register`;
  }
}
