import { config } from '../config.js';
export async function sendOtp(phone: string, code: string) {
  if (config.OTP_PROVIDER === 'console' && process.env.NODE_ENV !== 'production') {
    console.log(`[Any Needs OTP] ${phone}: ${code}`);
    return;
  }
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_MESSAGING_SERVICE_SID: service } = config;
  if (config.OTP_PROVIDER !== 'twilio' || !sid || !token || !service) throw new Error('SMS is not configured');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, MessagingServiceSid: service, Body: `Your Any Needs login code is ${code}. Valid for 5 minutes.` }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('SMS provider rejected request');
}
