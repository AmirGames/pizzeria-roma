import { setTimeout } from 'node:timers/promises';
export async function capturedLink(email, path, origin = 'http://127.0.0.1:8025') {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(`${origin}/api/v1/messages?limit=500`);
    if (!response.ok) throw new Error('Local mailbox unavailable');
    const inbox = await response.json();
    const messages = (inbox.messages ?? []).filter(message => message.To?.some(to => (to.Address ?? to.Email) === email)).sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created));
    for (const message of messages) {
      const detail = await (await fetch(`${origin}/api/v1/message/${message.ID}`)).json();
      const url = (detail.Text ?? '').split(/\s+/).find(word => word.startsWith('http') && word.includes(path + '#'));
      if (url) return url;
    }
    await setTimeout(100);
  }
  throw new Error('Expected local message was not captured');
}
