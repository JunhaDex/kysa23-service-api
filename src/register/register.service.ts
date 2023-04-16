import { Injectable } from '@nestjs/common';
import type { Register } from './entities/register.entity';
import { initializeApp } from 'firebase-admin/app';

@Injectable()
export class RegisterService {
  private readonly fireStore;

  constructor() {
    const app = initializeApp();
  }

  create(register: Register) {
    return 'This action adds a new register';
  }

  async findAll(options?: any) {
    return `This action returns all register`;
  }

  findOne(id: string) {
    return `This action returns a #${id} register`;
  }

  update(id: string, register: Register) {
    return `This action updates a #${id} register`;
  }

  remove(id: string) {
    return `This action removes a #${id} register`;
  }
}
