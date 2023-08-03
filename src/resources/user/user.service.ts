import type {
  ActionType,
  Message,
  RelationType,
  User,
  UserAuth,
  UserCredential,
} from '@/resources/user/entities/user.entity';
import type { Page } from '@/types/general.type';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { getFirebase, sendMessage } from '@/providers/firebase.provider';
import sharp from 'sharp';
import {
  getJsonLog,
  getYearBorn,
  PAGE_SIZE,
  paginateUser,
  paginateMessage,
  unixNow,
} from '@/utils/index.util';
import {
  ActionTypes,
  RelationTypes,
} from '@/resources/user/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const DOC_NAME_USER = 'user';
const DOC_NAME_COUNTER = 'counter';
const DOC_NAME_INBOX = 'inbox';
const DOC_NAME_MATCH = 'match';
const REG_COUNT_CACHE_KEY = 'rCnt';
const MATCH_COUNT_CACHE_KEY = 'mCnt';
const BUCKET_USER_PROFILE = 'user/profiles';
const ADK = 'a2p1bmhhNzdAZ21haWwuY29t';
const NOTI_MATCH_TITLE =
  '🐰달달 알림: 매치 성공! 내가 관심있는 그 사람이 혹시??';
const NOTI_MESSAGE = '지금 바로 앱을열어 상대방을 확인해 보세요!';

@Injectable()
export class UserService {
  private readonly db;
  private readonly bucket;
  private readonly jwt;
  private readonly logger;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    jwtSvc: JwtService,
  ) {
    const app = getFirebase();
    this.db = getDatabase(app);
    this.bucket = getStorage().bucket();
    this.jwt = jwtSvc;
    this.logger = new Logger(UserService.name);
  }

  async getMe(uid: string) {
    const doc = this.db.ref(DOC_NAME_USER);
    const instance = await doc.child(uid).once('value');
    if (instance.val()) {
      return instance.val();
    }
    throw new UserError(404, 'User Not Exist');
  }

  async update(id: string, user: User): Promise<boolean> {
    const doc = this.db.ref(DOC_NAME_USER);
    const instance = await doc.child(id).once('value');
    if (instance.val()) {
      const updateUser = instance.val();
      updateUser.bio = user.bio ?? '';
      updateUser.tweet = user.tweet ?? '';
      updateUser.mbti = user.mbti ?? '';
      updateUser.interest = user.interest ?? '';
      updateUser.ageGroup = [user.ageGroup[0], user.ageGroup[1]];
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
      const buffer = await sharp(file.buffer, { failOn: 'truncated' })
        .resize({ width: 550, height: 550 }) //TODO: 이미지 사이즈 확인
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
        this.logger.log(`Logged in: ${getJsonLog(payload)}`);
        user.fcm = cred.fcm;
        await instance.child(user.uid).update(user);
        const accessToken = await this.jwt.signAsync(payload);
        const isFirst = !(user.image || user.bio);
        return { token: accessToken, isFirst } as UserAuth;
      }
      throw new UserError(403, 'Password Incorrect');
    }
    throw new UserError(404, 'User Not Exist');
  }

  async getList(
    uid: string,
    query?: {
      page: number;
      geo?: string;
      name?: string;
      group?: string;
    },
  ): Promise<Page<User>> {
    // default value
    const page = query ? (query.page && query.page > 0 ? query.page : 1) : 1;
    const doc = this.db.ref(DOC_NAME_USER);
    const me = await this.checkToken(uid);
    const oppo = me.sex === 'm' ? 'f' : 'm';
    let res: any;
    if (query.group) {
      res = await doc
        .orderByChild('group')
        .equalTo(`${oppo}${query.group}`)
        .once('value');
      delete query.group;
    } else {
      res = await doc.orderByChild('sex').equalTo(oppo).once('value');
    }
    const pageData = [];
    let totalPage = 0;
    if (res.val()) {
      const total = Object.values(res.val()) as User[];
      const userList = paginateUser(total, page, PAGE_SIZE, query);
      totalPage = Math.ceil(userList.count / PAGE_SIZE);
      pageData.push(...userList.list);
    }
    this.updateSystemCount().catch((e) => {
      this.logger.warn(`Cache Update Failed :::: ${e.message}`);
    });
    return {
      items: pageData.map((usr) => this.cleanInfo(usr)),
      currentPage: Number(page),
      totalPage,
      count: pageData.length,
    } as Page<User>;
  }

  async getSystemCount(): Promise<{
    request: number;
    match: number;
    group: number;
  }> {
    const request = Number(
      (await this.cacheManager.get(REG_COUNT_CACHE_KEY)) ?? 0,
    );
    const match = Number(
      (await this.cacheManager.get(MATCH_COUNT_CACHE_KEY)) ?? 0,
    );
    const group = 30;
    return { request, match, group };
  }

  async pushSystemCache(uid: string, rCnt: number, mCnt: number) {
    if (uid === ADK) {
      await this.cacheManager.set(REG_COUNT_CACHE_KEY, rCnt, 0);
      await this.cacheManager.set(MATCH_COUNT_CACHE_KEY, mCnt, 0);
    }
  }

  private async updateSystemCount() {
    const outBoxes = await this.db.ref(DOC_NAME_MATCH).once('value');
    const matches = await this.db
      .ref(DOC_NAME_COUNTER)
      .child('matches')
      .once('value');
    let outCount = 0;
    if (outBoxes.val() && !(matches.val() == null)) {
      for (const out of Object.values(outBoxes.val())) {
        outCount += Object.keys(out).length;
      }
      await this.pushSystemCache(ADK, outCount, Number(matches.val() ?? 0));
    }
  }

  /**
   * get single user instance
   * @param myId: my uid
   * @param reqId: target search id
   * @throws 404 User Not Exist
   */
  async getUser(
    myId: string,
    reqId: string,
  ): Promise<{
    self: User;
    data: User;
    relation: { sent: boolean; received: RelationType };
  }> {
    const doc = this.db.ref(DOC_NAME_USER);
    const me = await this.checkToken(myId);
    const instance = await doc.child(reqId).once('value');
    const mySend = await this.db
      .ref(DOC_NAME_MATCH)
      .child(myId)
      .child(reqId)
      .once('value');
    const myReceieve = await this.db
      .ref(DOC_NAME_INBOX)
      .child(myId)
      .child(reqId)
      .once('value');
    const relType = myReceieve.val()
      ? myReceieve.val().msgType === ActionTypes.Match
        ? RelationTypes.Match
        : RelationTypes.Contact
      : RelationTypes.None;
    if (instance.val()) {
      return {
        self: me,
        data: this.cleanInfo(
          instance.val(),
          relType === RelationTypes.Match ? 'contact' : 'detail',
        ),
        relation: {
          sent: !!mySend.val(),
          received: relType,
        },
      };
    }
    throw new UserError(404, 'User Not Exist');
  }

  async getInbox(
    uid: string,
    query?: {
      page?: number;
    },
  ): Promise<Page<{ user: User; message: Message }>> {
    const me = await this.checkToken(uid);
    const page = query ? (query.page && query.page > 0 ? query.page : 1) : 1;
    const matchRef = await this.db
      .ref(`${DOC_NAME_INBOX}`)
      .child(uid)
      .orderByChild('msgType')
      .equalTo('match')
      .once('value');
    const contactRef = await this.db
      .ref(`${DOC_NAME_INBOX}`)
      .child(uid)
      .orderByChild('msgType')
      .equalTo('contact')
      .once('value');
    const messages = [
      ...(matchRef.val() ? Object.entries(matchRef.val()).reverse() : []),
      ...(contactRef.val() ? Object.entries(contactRef.val()).reverse() : []),
    ];
    let lists = [];
    for (const [k, v] of messages) {
      const userRef = await this.db.ref(DOC_NAME_USER).child(k).once('value');
      lists.push({ user: this.cleanInfo(userRef.val()), message: v });
    }
    if (me.ageGroup) {
      lists = lists.filter((fullMsg: { user: User; message: Message }) => {
        const year = Number(fullMsg.user.dob.split('/')[0]);
        return (
          getYearBorn(me.ageGroup[1]) <= year &&
          getYearBorn(me.ageGroup[0]) >= year
        );
      });
    }
    const paged = paginateMessage(lists, page, PAGE_SIZE);
    const totalPage = Math.ceil(paged.count / PAGE_SIZE);
    return {
      items: paged.list,
      currentPage: Number(page),
      totalPage,
      count: paged.list.length,
    };
  }

  async getOutbox(
    uid: string,
    query?: {
      page?: number;
    },
  ): Promise<Page<{ user: User; message: Message }>> {
    await this.checkToken(uid);
    const page = query ? (query.page && query.page > 0 ? query.page : 1) : 1;
    const matchRef = await this.db
      .ref(DOC_NAME_MATCH)
      .child(uid)
      .orderByChild('msgType')
      .equalTo('match')
      .once('value');
    const contactRef = await this.db
      .ref(DOC_NAME_MATCH)
      .child(uid)
      .orderByChild('msgType')
      .equalTo('contact')
      .once('value');
    const messages = [
      ...(matchRef.val() ? Object.entries(matchRef.val()).reverse() : []),
      ...(contactRef.val() ? Object.entries(contactRef.val()).reverse() : []),
    ];
    const paged = paginateMessage(messages, page, PAGE_SIZE);
    const totalPage = Math.ceil(paged.count / PAGE_SIZE);
    const lists = [];
    for (const [k, v] of paged.list) {
      const userRef = await this.db.ref(DOC_NAME_USER).child(k).once('value');
      lists.push({ user: this.cleanInfo(userRef.val()), message: v });
    }
    return {
      items: lists,
      currentPage: Number(page),
      totalPage,
      count: lists.length,
    };
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
    const counter = this.db.ref(DOC_NAME_COUNTER);
    const inbox = this.db.ref(DOC_NAME_INBOX);
    const match = this.db.ref(DOC_NAME_MATCH);
    const me = await this.checkToken(senderId);
    this.logger.log(
      `send match request :::: sender:${senderId} (cnt:${me.count}), receiver:${recipientId}, reveal:${isReveal}`,
    );
    if (me.count <= 0) {
      throw new UserError(403, 'No More Request');
    }
    const [ss, rr] = await Promise.all([
      doc.child(senderId).once('value'),
      doc.child(recipientId).once('value'),
    ]);
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
        const message = (sid: string, rid: string): Message => {
          return {
            from: sid,
            to: rid,
            msgType,
            isReveal: msgType === ActionTypes.Match ? true : isReveal,
            sentAt: unixNow(),
          };
        };
        try {
          await match
            .child(senderId)
            .child(recipientId)
            .set(message(senderId, recipientId));
          if (msgType === ActionTypes.Match) {
            await match
              .child(recipientId)
              .child(senderId)
              .set(message(recipientId, senderId));
            inbox
              .child(recipientId)
              .child(senderId)
              .set(message(senderId, recipientId));
            inbox
              .child(senderId)
              .child(recipientId)
              .set(message(recipientId, senderId));
            this.logger.log('matched!');
            this.updateSystemCount()
              .then(async () => {
                const count = await this.getSystemCount();
                const newMatch = count.match + 1;
                await counter.child('matches').set(newMatch);
                await this.updateSystemCount();
              })
              .catch((e) => {
                this.logger.warn(`Cache Update Failed :::: ${e.message}`);
              });
            sendMessage(sender.fcm, {
              notification: {
                title: NOTI_MATCH_TITLE,
                message: NOTI_MESSAGE,
              },
            }).catch((e) => {
              this.logger.warn(`Match Noti Failed (ss) :::: ${e.message}`);
            });
            sendMessage(recipient.fcm, {
              notification: {
                title: NOTI_MATCH_TITLE,
                message: NOTI_MESSAGE,
              },
            }).catch((e) => {
              this.logger.warn(`Match Noti Failed (rr) :::: ${e.message}`);
            });
          } else {
            if (isReveal) {
              inbox
                .child(recipientId)
                .child(senderId)
                .set(message(senderId, recipientId));
              sendMessage(recipient.fcm, {
                notification: {
                  title:
                    '🐰달달 알림: 관심 도착! 나에게 관심을 표현한 사람 누구일까요?',
                  message: NOTI_MESSAGE,
                },
              }).catch((e) => {
                this.logger.warn(`SEND NOTI FAILED :::: ${e.message}`);
              });
            }
          }
          this.logger.log(
            `send match request succeed :::: sender:${senderId}, receiver:${recipientId}, reveal:${isReveal}`,
          );
        } catch (e) {
          this.logger.error(
            `send match request failed :::: sender:${senderId}, receiver:${recipientId}, reveal:${isReveal}`,
          );
          return false;
        }
        counter
          .child(senderId)
          .update({ count: --me.count })
          .then(() => {
            this.logger.log(
              `send match request callback :::: sender:${senderId} (cnt:${me.count})`,
            );
          })
          .catch(() => {
            this.logger.warn(
              `send match request callback failed :::: sender:${senderId}`,
            );
          });
        return true;
      }
    }
    return false;
  }

  private async checkToken(uid: string): Promise<User> {
    const users = this.db.ref(DOC_NAME_USER);
    const me = await users.child(uid).once('value');
    if (me.val()) {
      const count = await this.db
        .ref(DOC_NAME_COUNTER)
        .child(uid)
        .once('value');
      const self = this.cleanInfo(me.val());
      self.count = count.val() ? count.val().count : 0;
      self.ageGroup = me.val().ageGroup;
      return self as User;
    } else {
      this.logger.warning(`${uid} => invalid uid access`);
      throw new UserError(401, 'Invalid User');
    }
  }

  private cleanInfo(user: User, usage: 'detail' | 'contact' | 'list' = 'list') {
    const detail = ['contact', 'password', 'fcm'] as const;
    const contact = ['password', 'fcm'] as const;
    const list = [
      'contact',
      'password',
      'bio',
      'mbti',
      'fcm',
      'interest',
      'ageGroup',
    ] as const;
    let deletable: any;
    const cleaned: User = { ...user };
    if (usage === 'detail') {
      deletable = detail;
    } else if (usage === 'contact') {
      deletable = contact;
    } else {
      deletable = list;
    }
    for (const key of deletable) {
      delete cleaned[key];
    }
    if (usage === 'detail' && !cleaned.ageGroup) {
      cleaned.ageGroup = [20, 35];
    }
    return cleaned;
  }
}

class UserError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
