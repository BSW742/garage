export interface Env {
  DB: D1Database;
}

export default {
  async email(message: EmailMessage, env: Env): Promise<void> {
    // Parse email headers
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get('subject') || '(no subject)';

    // Get the raw email content
    const rawEmail = await new Response(message.raw).text();

    // Simple body extraction (basic parsing)
    let bodyText = '';
    const parts = rawEmail.split('\r\n\r\n');
    if (parts.length > 1) {
      bodyText = parts.slice(1).join('\r\n\r\n');
    }

    // Extract sender name from "Name <email@example.com>" format
    let fromName = null;
    let fromAddress = from;
    const nameMatch = from.match(/^(.+?)\s*<(.+?)>$/);
    if (nameMatch) {
      fromName = nameMatch[1].replace(/"/g, '').trim();
      fromAddress = nameMatch[2];
    }

    // Store in D1
    await env.DB.prepare(`
      INSERT INTO emails (from_address, from_name, to_address, subject, body_text, received_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      fromAddress,
      fromName,
      to,
      subject,
      bodyText.slice(0, 50000), // Limit body size
      new Date().toISOString()
    ).run();

    // Send push notification
    try {
      await fetch('https://garage.co.nz/api/booking-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fromName || fromAddress,
          email: fromAddress,
          time: 'Email received',
          meetingType: 'email'
        })
      });
    } catch (e) {
      // Ignore push errors
    }
  }
};

interface EmailMessage {
  from: string;
  to: string;
  headers: Headers;
  raw: ReadableStream;
}
