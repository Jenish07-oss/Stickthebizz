import { resend } from "../config/resend";
import { env } from "../config/env";

export class EmailService {
  /**
   * Dispatches branded 6-digit OTP verification email via Resend
   */
  static async sendOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; id?: string }> {
    const cleanEmail = toEmail.trim().toLowerCase();

    // If Resend API key is not set (e.g. fresh local dev), log for testing
    if (!resend || !env.RESEND_API_KEY) {
      console.log(`\n======================================================`);
      console.log(`📩 [DEV EMAIL SIMULATION] To: ${cleanEmail}`);
      console.log(`🔑 Verification Code: ${otpCode}`);
      console.log(`⏳ Valid for 5 minutes (IST)`);
      console.log(`======================================================\n`);
      return { success: true, id: "simulated-dev-id" };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your StickTheBizz Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F5EBDD; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #413333;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5EBDD; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 32px rgba(16, 43, 76, 0.08); border: 1px solid #E5D9C8;">
                <!-- Header -->
                <tr>
                  <td align="center" style="background-color: #102B4C; padding: 32px 24px;">
                    <div style="display: inline-block; width: 44px; height: 44px; background-color: #EE634A; border-radius: 14px; text-align: center; line-height: 44px; color: #FFFFFF; font-weight: 800; font-size: 18px; margin-bottom: 12px;">
                      SB
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                      StickTheBizz Loyalty
                    </h1>
                    <p style="margin: 6px 0 0; color: rgba(255, 255, 255, 0.7); font-size: 12px;">
                      Instant Counter Check-in &amp; Stamp Passes
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 36px 32px; text-align: center;">
                    <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #413333;">
                      Your 6-Digit Verification Code
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #FBF7F0; border: 2px dashed #EE634A; border-radius: 18px; padding: 18px 24px; margin: 0 auto 20px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #102B4C;">
                        ${otpCode}
                      </span>
                    </div>

                    <p style="margin: 0 0 20px; font-size: 12px; color: #766565; line-height: 1.5;">
                      Enter this code on your mobile device to access your digital pass.<br />
                      This code is valid for <strong>5 minutes</strong>.
                    </p>

                    <div style="border-top: 1px solid #F0E6D8; padding-top: 20px;">
                      <p style="margin: 0; font-size: 11px; color: #9A8A8A; line-height: 1.4;">
                        If you did not request this code at a shop counter, you can safely ignore this email. Never share this code with anyone.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #FBF7F0; padding: 16px 24px; border-top: 1px solid #E5D9C8;">
                    <p style="margin: 0; font-size: 10px; color: #9A8A8A; font-weight: 600;">
                      StickTheBizz.in • QR Loyalty for Bharat • DPDP 2023 Compliant
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      const response = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: cleanEmail,
        subject: `${otpCode} is your StickTheBizz verification code`,
        html: htmlContent,
      });

      if (response.error) {
        console.error("Resend delivery error:", response.error);
        return { success: false };
      }

      return { success: true, id: response.data?.id };
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      return { success: false };
    }
  }
}

