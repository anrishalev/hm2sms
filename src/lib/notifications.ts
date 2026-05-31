import nodemailer from 'nodemailer'

export async function sendDiscordNotification(
  webhookUrl: string,
  toNumber: string,
  fromNumber: string,
  body: string
) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `New SMS on ${toNumber}`,
          color: 0x5ba4cf,
          fields: [
            { name: 'From', value: fromNumber, inline: true },
            { name: 'Message', value: body, inline: false },
            { name: 'Time', value: new Date().toUTCString(), inline: false },
          ],
        },
      ],
    }),
  })
}

export async function sendEmailNotification(
  toEmail: string,
  toNumber: string,
  fromNumber: string,
  body: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `New SMS on ${toNumber}`,
    text: `From: ${fromNumber}\nMessage: ${body}\nReceived: ${new Date().toUTCString()}`,
  })
}
