import * as fs from 'fs';
import sgMail from '@sendgrid/mail';

export async function sendGroupEmail() {
  console.log(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const template = fs.readFileSync('./command/templates/welcome.html', {
    encoding: 'utf8',
  });

  const filled = template.replace('<%user_name%>', '');
  const msg = {
    to: '',
    from: 'noreply@kysa.page',
    subject: '참석축하메일',
    html: filled,
  };
  const result = await sgMail.send(msg);
  console.log(result[0].statusCode);
  console.log(result[0].headers);
}
