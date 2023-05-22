import { getFirebase } from '../providers/firebase.provider';
import { getDatabase } from 'firebase-admin/database';
import { Register, User } from '../types/entity.type';

const DOC_NAME_REGISTER = 'test';
const DOC_NAME_USER = 'user';
const WHITELISTONLY = ['rlarlfah303@gmail.com', 'kjunha77@gmail.com'];

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
  const users = snapUser.val() ?? {};
  const target = Object.keys(registers).filter(
    (key) => !Object.keys(users).includes(key),
  );
  const userQueue = target.map((key) => registers[key]) as Register[];
  const userRes = {};
  console.log('User Queue Count: ', userQueue.length);
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
