import { Command } from 'commander';
import { createAppUser } from './functions/user.func';
import * as process from 'process';
import { updateSheetInfo } from './functions/register.func';

const program = new Command();
program
  .version('1.0.0')
  .option('-sr --sync-register', 'update register sheet in drive')
  .option('-uu --update-user', 'get app users from register')
  .parse(process.argv);
// TODO: 일일 선택권 초기화
// TODO: 모바일 알림
const options = program.opts();

function cb() {
  console.log('process finished');
  process.exit(0);
}

if (options.updateUser) {
  createAppUser().then(cb);
} else if (options.syncRegister) {
  updateSheetInfo().then(cb);
}
