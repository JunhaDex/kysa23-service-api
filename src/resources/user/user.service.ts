import type {
  ActionType,
  Message,
  User,
  UserAuth,
  UserCredential,
} from '@/resources/user/entities/user.entity';
import type { Page } from '@/types/general.type';
import type { Query } from 'firebase-admin/database';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { getFirebase } from '@/providers/firebase.provider';
import sharp from 'sharp';
import { getYearBorn, PAGE_SIZE, unixNow } from '@/utils/index.util';
import { ActionTypes } from '@/resources/user/entities/user.entity';
import { send } from '@sendgrid/mail';

const DOC_NAME_USER = 'user';
const DOC_NAME_INBOX = 'inbox';
const DOC_NAME_CONTACT = 'contact';
const DOC_NAME_MATCH = 'match';
const BUCKET_USER_PROFILE = 'user/profiles';

@Injectable()
export class UserService {
  private readonly db;
  private readonly bucket;
  private readonly jwt;

  constructor(jwtSvc: JwtService) {
    const app = getFirebase();
    this.db = getDatabase(app);
    this.bucket = getStorage().bucket();
    this.jwt = jwtSvc;
  }

  async update(id: string, user: User): Promise<boolean> {
    const doc = this.db.ref(DOC_NAME_USER);
    const instance = await doc.child(id).once('value');
    if (instance.val()) {
      const updateUser = instance.val();
      updateUser.bio = user.bio;
      updateUser.tweet = user.tweet;
      updateUser.mbti = user.mbti;
      updateUser.interest = user.interest;
      updateUser.ageGroup = [
        getYearBorn(user.ageGroup[0]),
        getYearBorn(user.ageGroup[1]),
      ];
      await doc.child(id).set(updateUser);
      return true;
    }
    return false;
  }

  async updateImage(id: string, file: any) {
    const doc = this.db.ref(DOC_NAME_USER);
    const instance = await doc.child(id).once('value');
    if (instance.val()) {
      // resize
      const buffer = await sharp(file.buffer)
        .resize({ width: 550, height: 550 })
        .jpeg({
          quality: 85,
        })
        .toBuffer();
      // upload
      const rename = id
        .replace(/[^\x00-\x7F]/g, '')
        .slice(0, 7)
        .concat('-', unixNow().toString());
      const location = `${BUCKET_USER_PROFILE}/${rename}.jpg`;
      await this.bucket.file(location).save(buffer);
      // set user
      const updateUser = instance.val();
      updateUser.image = location;
      await doc.child(id).set(updateUser);
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
        const payload = { uid: user.uid, name: user.name, dob: user.dob };
        const accessToken = await this.jwt.signAsync(payload);
        // TODO: update FCM
        const isFirst = !(user.image || user.bio);
        return { token: accessToken, isFirst } as UserAuth;
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
    const page = query.page ?? 1;
    const doc = this.db.ref(DOC_NAME_USER);
    const last = await this.setQuery(doc, query)
      .limitToFirst(PAGE_SIZE * page)
      .once('value');
    let pageData = [];
    if (last.val()) {
      const values = Object.values(last.val()) as User[];
      if (values.length > PAGE_SIZE * (page - 1)) {
        const shift = values.length % PAGE_SIZE;
        if (!shift) {
          pageData = values.slice(PAGE_SIZE * -1);
        } else {
          pageData = values.slice(shift * -1);
        }
      }
    }
    return {
      items: pageData,
      currentPage: 1,
      totalPage: 3,
      count: pageData.length,
    } as Page<User>;
  }

  private function;

  setQuery(
    query: any,
    options?: {
      geo?: string;
      name?: string;
      group?: string;
    },
  ): Query {
    let res = query;
    const { name, geo, group } = options ?? {};
    if (name) {
      res = res.orderByChild('name').startAt(name).endAt(`${name}\uf8ff`);
    } else if (geo) {
      res = res.orderByChild('geo').equalTo(geo);
    } else if (group) {
      res = res.orderByChild('group').equalTo(group);
    } else {
      res = res.orderByKey();
    }
    return res;
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

  async sendMatch(
    senderId: string,
    recipientId: string,
    isReveal: boolean,
  ): Promise<boolean> {
    const doc = this.db.ref(DOC_NAME_USER);
    const inbox = this.db.ref(DOC_NAME_INBOX);
    const match = this.db.ref(DOC_NAME_MATCH);
    const ss = await doc.child(senderId).once('value');
    const rr = await doc.child(recipientId).once('value');
    if (ss.val() && rr.val()) {
      const sender = ss.val();
      const recipient = rr.val();
      const hasSent = await match
        .child(senderId)
        .child(recipientId)
        .once('value');
      if (sender.sex !== recipient.sex && !hasSent.val()) {
        const hasMatch = await match
          .child(recipientId)
          .child(senderId)
          .once('value');
        const msgType: ActionType = hasMatch.val()
          ? ActionTypes.Match
          : ActionTypes.Contact;
        const message: Message = {
          from: senderId,
          to: recipientId,
          msgType,
          isReveal,
        };
        try {
          await match.child(senderId).child(recipientId).set(message);
          if (msgType === ActionTypes.Match) {
            await match.child(recipientId).child(senderId).set(message);
            inbox.child(recipientId).child(senderId).set(message);
            inbox.child(senderId).child(recipientId).set(message);
          } else {
            if (isReveal) {
              inbox.child(recipientId).child(senderId).set(message);
            }
          }
          return true;
        } catch (e) {
          return false;
        }
      }
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
