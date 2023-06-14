import * as fs from 'fs';

export async function sendGroupEmail() {
  const template = fs.readFileSync('../templates/welcome.html', {
    encoding: 'utf8',
  });
  console.log(template);
}
