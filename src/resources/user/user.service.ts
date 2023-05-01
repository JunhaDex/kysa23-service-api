import { Injectable } from '@nestjs/common';
import {
  Message,
  User,
  UserAuth,
  UserCredential,
} from '@/resources/user/entities/user.entity';
import { getFirebase } from '@/providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';
import { Page } from '@/types/general.type';

const DOC_NAME_USER = 'user';
const DOC_NAME_INBOX = 'inbox';
const DOC_NAME_CONTACT = 'contact';
const DOC_NAME_MATCH = 'match';

@Injectable()
export class UserService {
  private readonly db;

  constructor() {
    const app = getFirebase();
    this.db = getDatabase(app);
  }

  async update(id: string, user: User): Promise<boolean> {
    const doc = this.db.ref(DOC_NAME_USER);
    const key = btoa(user.email);
    const instance = await doc.child(key).once('value');
    if (instance.val()) {
      const updateUser = instance.val();
      updateUser.image = user.image;
      updateUser.bio = user.bio;
      await doc.child(key).set(updateUser);
      return true;
    }
    return false;
  }

  /**
   * Login provides User Auth
   * .token: JWT token
   * .isFirst: is first login?
   * @param cred: check password
   * @throws 403 Password Incorrect
   * @throws 404 User Not Exist
   */
  async login(cred: UserCredential): Promise<UserAuth> {
    const doc = this.db.ref(DOC_NAME_USER);
    const key = btoa(cred.email);
    const instance = await doc.child(key).once('value');
    if (instance.val()) {
      const user = instance.val();
      if (user.password === cred.password) {
        // TODO: get jwt token, check is first (has bio or image)
        return {} as UserAuth;
      }
      throw new UserError(403, 'Password Incorrect');
    }
    throw new UserError(404, 'User Not Exist');
  }

  async getList(query?: {
    page: number;
    geo?: string;
    name?: string;
    group?: string;
  }): Promise<Page<User>> {
    // default value
    const page = query ? query.page : 1;
    const doc = this.db.ref(DOC_NAME_USER);
    // TODO: add conditions
    return {} as Page<User>;
  }

  /**
   * get single user instance
   * @param uid
   * @throws 404 User Not Exist
   */
  async getUser(uid: string): Promise<User> {
    const doc = this.db.ref(DOC_NAME_USER);
    const instance = await doc.child(uid).once('value');
    if (instance.val()) {
      return instance.val();
    }
    throw new UserError(404, 'User Not Exist');
  }

  async getInbox(
    uid: string,
    query?: { page: number },
  ): Promise<Page<Message>> {
    // default value
    const page = query ? query.page : 1;
    const doc = this.db.ref(DOC_NAME_INBOX).ref(uid);
    // TODO: add conditions
    return {} as Page<Message>;
  }

  async notifyApp() {
    // TODO: Cloud Messaging
  }

  async sendContact(senderId: string, recipientId: string): Promise<boolean> {
    const doc = this.db.ref(DOC_NAME_USER);
    const inbox = this.db.ref(DOC_NAME_INBOX);
    const contact = this.db.ref(DOC_NAME_CONTACT);
    const ss = await doc.child(senderId).once('value');
    const rr = await doc.child(recipientId).once('value');
    if (ss.val() && rr.val()) {
      const sender = ss.val();
      const onlyOnce = contact.child(recipientId).child(senderId).once('value');
      if (!onlyOnce.val()) {
        const record: Message = {
          from: sender.name,
          uid: sender.uid,
          msgType: 'contact',
        };
        await contact.child(recipientId).child(senderId).set({ isSent: true });
        await inbox.child(recipientId).child(senderId).set(record);
        return true;
      }
    }
    return false;
  }

  async sendMatch(senderId: string, recipientId: string): Promise<boolean> {
    const doc = this.db.ref(DOC_NAME_USER);
    const inbox = this.db.ref(DOC_NAME_INBOX);
    const match = this.db.ref(DOC_NAME_MATCH);
    const ss = await doc.child(senderId).once('value');
    const rr = await doc.child(recipientId).once('value');
    if (ss.val() && rr.val()) {
      const sender = ss.val();
      const recipient = rr.val();
      const hasMatch = await match
        .child(senderId)
        .child(recipientId)
        .once('value');
      if (hasMatch) {
        const currentCount = await match.ref('matchCount').once('value');
        const senderInfo = {
          from: sender.name,
          uid: sender.uid,
          msgType: 'match',
        };
        const recipientInfo = {
          from: recipient.name,
          uid: recipient.uid,
          msgType: 'match',
        };
        await match.child(recipientId).child(senderId).set({ isMatch: true });
        await inbox.child(senderId).child(recipientId).set(recipientInfo);
        await inbox.child(recipientId).child(senderId).set(senderInfo);
        await match.ref('matchCount').set(currentCount + 1);
      } else {
        await match.child(recipientId).child(senderId).set({ isMatch: true });
      }
      return true;
    }
    return false;
  }
}

class UserError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
