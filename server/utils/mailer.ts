import tls from "tls";
import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "mail.kydigit.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    user: process.env.SMTP_USER || "hello@kydigit.com",
    pass: process.env.SMTP_PASS || "xvWT5vBjGu4spPj",
    from: process.env.SMTP_FROM || 'Floura Bakery <hello@kydigit.com>',
  };
}

/**
 * Plain text alternative for anti-spam scoring (eliminates SpamAssassin MIME_HTML_ONLY penalty).
 */
export function renderOtpEmailText(otp: string, email: string): string {
  return `Hi Chef,

Your Floura login verification code is: ${otp}

This code is valid for 15 minutes. Use it to access your bakery command center and kitchen logs.

Account: ${email}

If you did not request this verification code, no action is needed — your account remains completely safe.

— Floura Artisan Bakery & Kitchen Command Center
https://floura.kydigit.com
`;
}

/**
 * Clean, warm, high-deliverability HTML email matching Floura's actual design system:
 * - Brand Berry: #BE185D & #DB2777
 * - Soft Cream & Rose Card: #FDFBF7 & #FDF2F8
 * - Georgia Serif typography
 * - Clean tabular layout without suspicious dark backgrounds or glowing text shadows
 */
export function renderOtpEmailHtml(otp: string, email: string): string {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Floura Login Code: ${otp}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #fbf9f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .otp-digit-box { font-size: 32px !important; letter-spacing: 6px !important; padding: 16px 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf9f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #fbf9f5; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1e4ea; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(190, 24, 93, 0.06);">
          
          <!-- Floura signature sweet-berry top accent -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #be185d 0%, #db2777 50%, #f472b6 100%); line-height: 5px; font-size: 5px;">&nbsp;</td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f8eef3;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 900; font-family: Georgia, serif; color: #831843; letter-spacing: -0.5px;">Floura</span>
                    <span style="margin-left: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 9px; border-radius: 9999px; background-color: #fce7f3; color: #be185d;">Bakery Pro</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">Sign In to Your Workspace</h1>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom: 22px; line-height: 22px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">
                      Hello Chef! Use the 6-digit one-time verification code below to securely access your recipes, inventory, and cake orders.
                    </p>
                  </td>
                </tr>

                <!-- OTP Display Box (Floura Sweet-Pink Theme) -->
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 360px; background-color: #fdf2f8; border: 2px dashed #f472b6; border-radius: 12px;">
                      <tr>
                        <td align="center" class="otp-digit-box" style="padding: 18px 16px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #9d174d;">
                          ${otp}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Detail / Validity Card -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 12px 16px; font-size: 12px; color: #475569; line-height: 18px;">
                          <strong style="color: #be185d;">⏱ Validity:</strong> Code expires in <strong>15 minutes</strong>.<br>
                          <strong style="color: #be185d;">👤 Account:</strong> ${email}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Helpful note -->
                <tr>
                  <td style="font-size: 11px; line-height: 16px; color: #94a3b8; text-align: center;">
                    If you didn't request this code, you can safely ignore this email. Your workspace remains secure.
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 32px 24px 32px; background-color: #faf5f7; border-top: 1px solid #f1e4ea;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                Floura Artisan Bakery &bull; Kitchen Command Center<br>
                &copy; ${currentYear} Floura. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends an email using pure Node.js TLS socket over SMTP SSL (port 465).
 * Formats as a high-reputation RFC 2046 multipart/alternative (text + html)
 * with strict 76-character base64 line wrapping (RFC 5322 limit: 998).
 */
export async function sendEmailViaTlsSmtp(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const config = getSmtpConfig();

  return new Promise((resolve, reject) => {
    let resolved = false;
    const finish = (err?: Error) => {
      if (resolved) return;
      resolved = true;
      if (err) {
        console.error("[SMTP Error]", err.message);
        reject(err);
      } else {
        resolve(true);
      }
    };

    const timeout = setTimeout(() => {
      finish(new Error("SMTP connection timed out"));
    }, 15000);

    const client = tls.connect(
      {
        host: config.host,
        port: config.port,
        rejectUnauthorized: false,
      },
      () => {
        // Connected to TLS SMTP server
      }
    );

    let stage = 0;
    let buffer = "";

    const cleanFrom = config.from.includes("<")
      ? config.from.match(/<([^>]+)>/)?.[1] || config.user
      : config.from.trim();

    client.on("data", (data) => {
      buffer += data.toString("utf8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line) continue;
        const code = parseInt(line.substring(0, 3), 10);
        const isMulti = line.charAt(3) === "-";
        if (isMulti) continue;

        switch (stage) {
          case 0: // Greeting
            if (code === 220) {
              stage = 1;
              client.write(`EHLO ${config.host}\r\n`);
            } else {
              finish(new Error(`Unexpected greeting: ${line}`));
            }
            break;

          case 1: // EHLO
            if (code === 250) {
              stage = 2;
              client.write("AUTH LOGIN\r\n");
            } else {
              finish(new Error(`EHLO failed: ${line}`));
            }
            break;

          case 2: // User prompt
            if (code === 334) {
              stage = 3;
              client.write(Buffer.from(config.user).toString("base64") + "\r\n");
            } else {
              finish(new Error(`AUTH LOGIN failed: ${line}`));
            }
            break;

          case 3: // Pass prompt
            if (code === 334) {
              stage = 4;
              client.write(Buffer.from(config.pass).toString("base64") + "\r\n");
            } else {
              finish(new Error(`Username rejected: ${line}`));
            }
            break;

          case 4: // Auth success
            if (code === 235) {
              stage = 5;
              client.write(`MAIL FROM:<${cleanFrom}>\r\n`);
            } else {
              finish(new Error(`Authentication rejected: ${line}`));
            }
            break;

          case 5: // MAIL FROM success
            if (code === 250) {
              stage = 6;
              client.write(`RCPT TO:<${options.to}>\r\n`);
            } else {
              finish(new Error(`MAIL FROM rejected: ${line}`));
            }
            break;

          case 6: // RCPT TO success
            if (code === 250) {
              stage = 7;
              client.write("DATA\r\n");
            } else {
              finish(new Error(`RCPT TO rejected: ${line}`));
            }
            break;

          case 7: // DATA prompt
            if (code === 354) {
              stage = 8;
              const dateStr = new Date().toUTCString();
              const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@kydigit.com>`;
              const boundary = `----=_Part_Floura_${Date.now()}_${Math.random().toString(36).substring(2)}`;
              
              // Base64 chunked lines (76 chars) to strictly comply with RFC 5322 (max 998 chars/line)
              const base64Html = Buffer.from(options.html, "utf8")
                .toString("base64")
                .match(/.{1,76}/g)
                ?.join("\r\n") || "";

              const plainText = options.text || "Your Floura verification code is provided in the HTML version.";

              // RFC 2046 multipart/alternative (Plain Text + HTML) with essential reputation headers
              const rawMessage = [
                `From: ${config.from}`,
                `To: ${options.to}`,
                `Reply-To: ${config.from}`,
                `Subject: ${options.subject}`,
                `Date: ${dateStr}`,
                `Message-ID: ${messageId}`,
                `X-Mailer: Floura Workspace Mailer 2.0`,
                `Auto-Submitted: auto-generated`,
                `X-Auto-Response-Suppress: All`,
                `MIME-Version: 1.0`,
                `Content-Type: multipart/alternative; boundary="${boundary}"`,
                ``,
                `--${boundary}`,
                `Content-Type: text/plain; charset=UTF-8`,
                `Content-Transfer-Encoding: 7bit`,
                ``,
                plainText,
                ``,
                `--${boundary}`,
                `Content-Type: text/html; charset=UTF-8`,
                `Content-Transfer-Encoding: base64`,
                ``,
                base64Html,
                ``,
                `--${boundary}--`,
                `.`,
                ``,
              ].join("\r\n");

              client.write(rawMessage);
            } else {
              finish(new Error(`DATA prompt rejected: ${line}`));
            }
            break;

          case 8: // Data accepted
            if (code === 250) {
              stage = 9;
              client.write("QUIT\r\n");
              clearTimeout(timeout);
              finish();
              client.end();
            } else {
              finish(new Error(`Message rejected: ${line}`));
            }
            break;
        }
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      finish(err);
    });

    client.on("end", () => {
      clearTimeout(timeout);
      if (!resolved && stage === 9) {
        finish();
      }
    });
  });
}

/**
 * Sends an email using the Resend HTTP API (if configured).
 */
async function sendEmailViaResend(options: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const from = process.env.RESEND_FROM || "Floura Bakery <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${options.apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Resend API returned status ${res.status}`);
  }
  return true;
}

/**
 * Primary SMTP delivery using nodemailer (guarantees RFC 5322 compliance,
 * 78-char line folding, proper boundary generation, and TLS connection management).
 */
export async function sendEmailViaNodemailer(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Keep connection pool alive and ensure strict line wrapping
    pool: false,
    maxMessages: 10,
  });

  await transporter.sendMail({
    from: config.from,
    to: options.to,
    replyTo: config.from,
    subject: options.subject,
    text: options.text,
    html: options.html,
    headers: {
      "X-Mailer": "Floura Workspace Mailer 2.0",
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
    },
  });
  return true;
}

/**
 * Sends the 6-digit OTP code to the requested email.
 * Includes both clean plain-text and Floura theme HTML as multipart/alternative.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const html = renderOtpEmailHtml(otp, email);
  const text = renderOtpEmailText(otp, email);
  const subject = `Your Floura Verification Code: ${otp}`;

  // 1. If Resend API key is provided, use Resend for instant Gmail delivery
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      await sendEmailViaResend({
        apiKey: resendApiKey,
        to: email,
        subject,
        html,
        text,
      });
      console.log(`[Mailer - Resend API] Verification email delivered to ${email} instantly.`);
      return true;
    } catch (resendErr: any) {
      console.warn(`[Mailer - Resend Error] Failed, falling back to SMTP:`, resendErr.message);
    }
  }

  // 2. Primary SMTP via Nodemailer (guarantees RFC 5322 78-char line wrapping)
  try {
    await sendEmailViaNodemailer({
      to: email,
      subject,
      html,
      text,
    });
    console.log(`[Mailer - Nodemailer SMTP] Verification email dispatched to ${email}`);
    return true;
  } catch (nmErr: any) {
    console.warn(`[Mailer Warning] Nodemailer failed, falling back to direct TLS:`, nmErr.message);
  }

  // 3. Fallback to native TLS SMTP
  try {
    await sendEmailViaTlsSmtp({
      to: email,
      subject,
      html,
      text,
    });
    console.log(`[Mailer - TLS SMTP] Multipart verification email dispatched to ${email}`);
    return true;
  } catch (err: any) {
    console.warn(`[Mailer Warning] Failed sending email to ${email}:`, err.message);
    return false;
  }
}

