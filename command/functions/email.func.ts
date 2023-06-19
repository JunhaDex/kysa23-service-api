import * as fs from 'fs';
import sgMail from '@sendgrid/mail';
import { getSheet } from '../providers/gdrive.provider';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as process from 'process';

const COLUMN_ORDER = [
  'name',
  'uid',
  'dob',
  'geo',
  'sex',
  'email',
  'contact',
  'joins',
  'consent',
  'createdAt',
] as const;

export async function sendGroupEmail() {
  console.log(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const REGIDX = 0;
  const formData = (await getSheet(REGIDX + 14)).filter(
    (row: any[]) => !!row[0],
  );
  const ans = await inquirer.prompt([
    {
      name: 'continue',
      message: `got ${formData.length} emails. Press "Y" to continue?`,
    },
  ]);
  if (ans.continue.toLowerCase() !== 'y') {
    console.log(chalk.red('PROCESS CANCELED'));
    throw new Error('Process Canceled');
  }
  for (const row of formData) {
    row[7] = row[7].split(',').map((day: string) => Number(day));
    row[8] = row[8];
    const obj = {
      user_name: row[0],
      user_phone: row[6] ?? '-',
      user_joins: `8월 ${row[7].join(', ')}일 (총 ${row[7].length}일)`,
      user_reg: row[8],
    };
    let template = fs.readFileSync('./command/templates/welcome.html', {
      encoding: 'utf8',
    });
    for (const key of Object.keys(obj)) {
      template = template.replace(`<%${key}%>`, obj[key]);
    }
    const msg = {
      to: '',
      from: 'noreply@kysa.page',
      subject: '[2023 KYSA] 전국 청년대회에 등록해 주셔서 감사합니다.',
      html: template,
    };
    const result = await sgMail.send(msg);
    console.log(result[0].statusCode);
  }
}
