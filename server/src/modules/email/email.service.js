import nodemailer from 'nodemailer';
import prisma from '../../../config/db.js';
import { generateMagicToken } from '../screening/screening.service.js';
import { logDpdpAction } from '../dpdp/dpdp.service.js';
import { DPDP_ACTIONS } from '../../config/constants.js';

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Creates Nodemailer transporter for Gmail SMTP.
 */
const createTransporter = () => {
  if (emailUser && emailPass && !emailUser.includes('yourname') && !emailPass.includes('abcdefgh')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000
    });
  }
  return null;
};

/**
 * Verifies if the Gmail SMTP credentials are configured and valid.
 */
export const verifyEmailConfiguration = async () => {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'EMAIL_USER or EMAIL_PASS not set in .env. Running in Mock / Terminal Preview mode.'
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      message: `Gmail SMTP connected successfully as ${emailUser}`
    };
  } catch (error) {
    return {
      configured: false,
      error: error.message,
      message: 'Failed to authenticate with Gmail. Make sure you are using a 16-character Google App Password with 2-Step Verification enabled.'
    };
  }
};

/**
 * Generates polished, responsive HTML email template for Candidate Screening.
 */
const buildScreeningEmailHtml = ({ candidateName, jobTitle, companyName, magicLinkUrl, expiryHours = 48 }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to AI Voice Screening - ${jobTitle}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080c18; color: #e2e8f0; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; background-color: rgba(99, 102, 241, 0.15); color: #818cf8; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; border: 1px solid rgba(99, 102, 241, 0.3); margin-bottom: 16px; }
    .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }
    .paragraph { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
    .cta-container { text-align: center; margin: 32px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
    .dpdp-box { background-color: #090d1a; border: 1px solid #1e293b; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: left; }
    .dpdp-title { font-size: 12px; font-weight: 700; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .dpdp-text { font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; }
    .footer { border-top: 1px solid #1e293b; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #080c18;">
  <div class="wrapper">
    <div class="header">
      <h1>AntiTalk AI Recruiter</h1>
      <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px;">Fast, Intelligent & Bias-Free Candidate Screening</p>
    </div>
    <div class="content">
      <div class="badge">Next Step in Your Application</div>
      <div class="greeting">Hi ${candidateName},</div>
      <p class="paragraph">
        Great news! Your profile has been shortlisted for the <strong>${jobTitle}</strong> position.
      </p>
      <p class="paragraph">
        We would like to invite you to complete a brief <strong>3-minute AI voice screening</strong>. You can take this screening anytime from your smartphone or computer browser.
      </p>

      <div class="cta-container">
        <a href="${magicLinkUrl}" target="_blank" class="cta-btn">
          🎙️ Start AI Voice Screening
        </a>
      </div>

      <!-- DPDP Notice -->
      <div class="dpdp-box">
        <div class="dpdp-title">🔒 Digital Personal Data Protection (DPDP) Notice</div>
        <p class="dpdp-text">
          Your audio responses and evaluation scores are processed strictly for recruitment purposes under the DPDP Act 2023. You retain full authority over your data, including the right to permanent data erasure.
        </p>
      </div>

      <p class="paragraph" style="font-size: 12px; color: #64748b;">
        * This secure link is valid for ${expiryHours} hours.<br>
        * If you have trouble opening the button, copy and paste this link into your browser:<br>
        <span style="color: #818cf8; word-break: break-all;">${magicLinkUrl}</span>
      </p>
    </div>
    <div class="footer">
      AntiTalk Omnichannel Recruitment System · Built for Privacy & Performance
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Sends or logs a candidate screening email invitation.
 */
export const sendCandidateScreeningEmail = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      campaign: {
        include: { jobRole: true, hr: true }
      }
    }
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  // Ensure candidate has a valid magic token
  let token = candidate.magic_token;
  if (!token) {
    const generated = await generateMagicToken(candidate.id);
    token = generated.token;
  }

  const magicLinkUrl = `${frontendUrl}/screening/${token}`;
  const jobTitle = candidate.campaign?.jobRole?.title || candidate.campaign?.name || 'Position';
  const candidateName = candidate.name || 'Candidate';
  const companyName = 'AntiTalk';

  const htmlContent = buildScreeningEmailHtml({
    candidateName,
    jobTitle,
    companyName,
    magicLinkUrl
  });

  const transporter = createTransporter();

  let result;
  if (transporter && emailUser) {
    try {
      const info = await transporter.sendMail({
        from: `"AntiTalk Hiring" <${emailUser}>`,
        to: candidate.email,
        subject: `Next Step: AI Voice Screening for ${jobTitle} (${candidateName})`,
        html: htmlContent
      });

      console.log(`[Email Service] Sent screening invitation to ${candidate.email} (MessageId: ${info.messageId})`);

      await logDpdpAction({
        candidateId: candidate.id,
        candidatePhone: candidate.contact,
        action: DPDP_ACTIONS.DATA_ACCESSED,
        channel: 'EMAIL',
        details: `Screening invitation email dispatched with DPDP notice to ${candidate.email}`
      });

      result = { success: true, mode: 'SMTP', messageId: info.messageId, email: candidate.email, magicLinkUrl };
    } catch (err) {
      console.error(`[Email Service] Error sending email to ${candidate.email}:`, err.message);
      result = { success: false, mode: 'SMTP_FAILED', error: err.message, magicLinkUrl };
    }
  } else {
    // Mock / Preview Mode
    console.log(`\n=============================================================`);
    console.log(`[Email Service] [MOCK / PREVIEW MODE - Free Dispatcher]`);
    console.log(`TO: ${candidate.email}`);
    console.log(`SUBJECT: Next Step: AI Voice Screening for ${jobTitle}`);
    console.log(`MAGIC LINK URL: ${magicLinkUrl}`);
    console.log(`(Add EMAIL_USER & EMAIL_PASS in server/.env to send real Gmail emails)`);
    console.log(`=============================================================\n`);

    result = { success: true, mode: 'MOCK', magicLinkUrl, email: candidate.email };
  }

  // Update candidate email tracking timestamp in database
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      email_status: 'SENT',
      email_sent_at: new Date()
    }
  });

  return result;
};
