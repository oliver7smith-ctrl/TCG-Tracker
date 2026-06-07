
// SMS alerts via Twilio
// If TWILIO credentials are not set, SMS alerts are silently skipped.

export async function sendSms(to: string, message: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.log("[SMS] Skipped — Twilio not configured")
    return
  }

  // Lazy import so build succeeds even if twilio is not installed
  const twilio = (await import("twilio")).default
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  await client.messages.create({
    body: message.slice(0, 160),
    from: process.env.TWILIO_FROM_NUMBER,
    to,
  })
}
