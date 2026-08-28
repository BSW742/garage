import type { APIRoute } from 'astro';
import { sendPushToAll } from '../../lib/web-push';
import { sendMail } from '../../lib/mail';

/**
 * Somebody booked a time. This used to fire a push and stop, which meant the
 * booking existed only inside an app tab nobody wanted to look at — and the
 * name they typed was thrown away on the way past.
 *
 * Now it emails the details with a calendar invite attached, because the next
 * thing that happens either way is putting it in a real calendar.
 */

const WHO = 'ben@bridgepoint.co.nz';

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * A calendar invite. Folded at 75 octets and CRLF-terminated because RFC 5545
 * asks for both, and mail clients are stricter about it than they look.
 */
function invite(opts: {
  uid: string; start: Date; minutes: number; title: string; who: string; note: string;
}): string {
  const end = new Date(opts.start.getTime() + opts.minutes * 60000);
  const esc = (v: string) => String(v).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//garage.co.nz//booking//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(opts.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.note)}`,
    `ORGANIZER;CN=${esc(opts.who)}:mailto:${opts.who}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines
    .map((l) => (l.length <= 75 ? l : l.match(/.{1,74}/g)!.join('\r\n ')))
    .join('\r\n');
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { name, email, time, meetingType, startsAt, origin } = await request.json();
    if (!name || !email || !time) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const env = (locals as any)?.runtime?.env || {};
    let notified = 0;
    try { notified = await sendPushToAll(env.DB); } catch { /* the email is the real one */ }

    const kind = meetingType === 'teams' ? 'Teams call' : 'Coffee';
    const from = String(origin || '').trim();

    const lines = [
      `${name} booked a ${kind.toLowerCase()}.`,
      '',
      `  When   ${time}`,
      `  Who    ${name}`,
      `  Email  ${email}`,
      from ? `  Came from  ${from}` : '',
      '',
      'The invite is attached — open it to drop this straight in your calendar.',
      '',
      `Reply to them: mailto:${email}`,
    ].filter((l) => l !== '');

    // Only attach an invite when we know the real instant. A wrong time in
    // somebody's calendar is worse than no invite at all.
    const when = startsAt ? new Date(startsAt) : null;
    const good = when && Number.isFinite(when.getTime());

    await sendMail(env, {
      to: WHO,
      subject: `${kind} with ${name} — ${time}`,
      text: lines.join('\n'),
      attachments: good
        ? [{
            filename: 'booking.ics',
            type: 'text/calendar; method=REQUEST; charset=utf-8',
            content: invite({
              uid: `${Date.now()}-${Math.random().toString(36).slice(2)}@garage.co.nz`,
              start: when as Date,
              minutes: meetingType === 'teams' ? 30 : 45,
              title: `${kind} with ${name}`,
              who: WHO,
              note: `${name} (${email}) booked this on garage.co.nz.${from ? ' Came from ' + from : ''}`,
            }),
          }]
        : undefined,
    });

    return new Response(JSON.stringify({ success: true, notified, invited: !!good }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Booking notify error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
