import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';
import { Register, User } from '../types/entity.type';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import sgMail from '@sendgrid/mail';
import process from 'process';
import { updateTimestamp } from '../providers/gdrive.provider';

const DOC_NAME_REGISTER = 'register';
const DOC_NAME_USER = 'user';
const DOC_NAME_COUNTER = 'counter';
const DAILY_COUNT = 10;
const OP_GRP = [
  '0920bear@naver.com',
  'calvinjunham@gmail.com',
  'gogipac@naver.com',
  'dlwpgus612@gmail.com',
  'dudgus8200@gmail.com',
  'et9007@naver.com',
  'khkbyoonji@naver.com',
  'jka3324@naver.com',
  'jyb3883@naver.com',
  'sehyeon5000@naver.com',
  'share1700@naver.com',
  'qhdh9438@naver.com',
  'wnsahs107@naver.com',
  'yangsandra7482@gmail.com',
] as const;

export async function createAppUser() {
  const app = await getFirebase();
  const db = getDatabase(app);
  const docRef = db.ref(DOC_NAME_REGISTER);
  const docUser = db.ref(DOC_NAME_USER);
  const [snapRef, snapUser] = await Promise.all([
    docRef.once('value'),
    docUser.once('value'),
  ]);
  const registers = snapRef.val() ?? {};
  // #### Add Custom User ####
  // const registers = {};
  // registers[btoa('test.user.m@google.com')] = {
  //   consent: 1688168263,
  //   contact: '01012341233',
  //   createdAt: 1688304189,
  //   dob: '1997/10/20',
  //   email: 'test.user.m@google.com',
  //   geo: '서울 강남',
  //   isMember: true,
  //   joins: [25, 26, 27],
  //   name: 'Test User M',
  //   sex: 'm',
  //   uid: btoa('test.user.m@google.com'),
  // };
  const users = snapUser.val() ?? {};
  const target = Object.keys(registers).filter(
    (key) => !Object.keys(users).includes(key),
  );
  const newUsrCount = target.length;
  const ans = await inquirer.prompt([
    {
      name: 'continue',
      message: `${newUsrCount} new users found. Press "Y" to continue?`,
    },
  ]);
  if (ans.continue.toLowerCase() !== 'y') {
    console.log(chalk.red('PROCESS CANCELED'));
    throw new Error('Process Canceled');
  }
  const userQueue = target.map((key) => {
    const newUser = registers[key] as Register;
    console.log(`enqueue: ${newUser.name}`);
    return newUser;
  }) as Register[];
  const userRes = {};
  console.log(chalk.green('User Queue Count: ', userQueue.length));
  userQueue.forEach((reg) => {
    const user = cleanInfo(reg) as User;
    user.password = getSixDigits();
    // set default value
    user.image = '';
    user.bio = '';
    user.tweet = '';
    user.mbti = '';
    user.interest = '';
    user.ageGroup = [];
    userRes[reg.uid] = user;
    console.log(atob(reg.uid), user.password);
  });
  await docUser.update(userRes);
  //TODO: 이메일 발송
}

export async function setDailyCount() {
  const app = await getFirebase();
  const db = getDatabase(app);
  const docUser = await db.ref(DOC_NAME_USER).once('value');
  const dailyCount = {};
  if (docUser.val()) {
    for (const uid of Object.keys(docUser.val())) {
      dailyCount[uid] = { count: DAILY_COUNT };
    }
  }
  await db.ref(DOC_NAME_COUNTER).update(dailyCount);
}

export async function resetDaily() {
  const app = await getFirebase();
  const db = getDatabase(app);
  const outBoxes = await db.ref('match').once('value');
  const inBoxes = await db.ref('inbox').once('value');
  const outs = outBoxes.val();
  const inns = inBoxes.val();
  if (outBoxes.val() && inBoxes.val()) {
    for (const out of Object.values(outs)) {
      for (const item of Object.keys(out)) {
        if (out[item].msgType === 'contact') {
          delete out[item];
        }
      }
    }
    for (const inn of Object.values(inns)) {
      for (const item of Object.keys(inn)) {
        if (inn[item].msgType === 'contact') {
          delete inn[item];
        }
      }
    }
  }
  await db.ref('match').update(outs);
  await db.ref('inbox').update(inns);
}

export async function searchMe() {
  const tg = '';
  const app = await getFirebase();
  const db = getDatabase(app);
  const outBoxes = await db.ref('match').once('value');
  const outs = outBoxes.val();
  const whos = [];
  if (outBoxes.val()) {
    for (const out of Object.values(outs)) {
      for (const item of Object.keys(out)) {
        if (item === btoa(tg)) {
          whos.push(atob(out[item].from));
          break;
        }
      }
    }
  }
  console.log({ count: whos.length, items: whos.join('\r\n') });
}

// send user pwd email
export async function sendUserPwd() {
  console.log(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const app = await getFirebase();
  const db = getDatabase(app);
  const docUser = db.ref(DOC_NAME_USER);
  const users = (await docUser.once('value')).val() ?? {};
  const opFilter = OP_GRP.map((email: string) => btoa(email));
  const uList = Object.values(users).filter((user: User) =>
    opFilter.includes(user.uid),
  ) as User[];
  const template = fs.readFileSync('./command/templates/user-password.html', {
    encoding: 'utf8',
  });
  console.log(`Emails to send: ${uList.length} email(s)`);
  // return;
  for (const user of uList) {
    let contents = template;
    Object.keys(user).forEach((key) => {
      contents = contents.replace(`<%user_${key}%>`, user[key]);
    });
    const msg = {
      to: user.email,
      from: 'noreply@kysa.page',
      subject: '[2023 KYSA] 데이팅 앱 "달달" 대회기간 중 사용 안내',
      html: contents,
    };
    try {
      const result = await sgMail.send(msg);
      if (result[0].statusCode < 299) {
        console.log(`Email sent to: ${user.email} (${user.name})`);
      } else {
        console.log(
          chalk.bgRed('DANGER: Error Code Uncommon: ', JSON.stringify(user)),
        );
      }
    } catch (e) {
      console.log(
        chalk.bgRed(`ERROR: Send Failed(${e.code}): `, JSON.stringify(user)),
      );
      console.error(JSON.stringify(e));
      throw new Error('Email Failed');
    }
  }
}

function setDummyGroup(userRes: any) {
  const GROUP_SIZE = 10;
  let mgc = 0;
  let fgc = 0;
  for (const key of Object.keys(userRes)) {
    const sex = userRes[key].sex;
    if (sex === 'm') {
      mgc++;
      userRes[key].group = `${sex}${Math.ceil(mgc / GROUP_SIZE)}`;
    } else {
      fgc++;
      userRes[key].group = `${sex}${Math.ceil(fgc / GROUP_SIZE)}`;
    }
  }
  console.log({ mgc, fgc });
}

function getSixDigits(): string {
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += Math.floor(Math.random() * 10).toString();
  }
  return pwd;
}

function cleanInfo(reg: Register): Register {
  const deletable = [
    'isMember',
    'joins',
    'consent',
    'checkIn',
    'updatedAt',
    'createdAt',
  ] as const;
  const cleaned: Register = { ...reg };
  for (const key of deletable) {
    delete cleaned[key];
  }
  return cleaned;
}
