import prisma from './config/db.js';
import { handleInboundWhatsAppMessage, sendInitialWhatsAppInvite } from './src/modules/twilio/twilio.service.js';
import { getSessionByToken, recordWebConsent, submitWebScreeningSession } from './src/modules/screening/screening.service.js';
import { executeRightToErasure, getDpdpAuditTrail } from './src/modules/dpdp/dpdp.service.js';
import { CANDIDATE_STATUS, CONSENT_STATUS } from './src/config/constants.js';

async function runOmnichannelDpdpTests() {
  console.log('🧪 Starting Omnichannel AI Recruitment & DPDP Compliance Test Suite...\n');

  try {
    // 0. Ensure an HR user & Campaign exist for testing
    let hrUser = await prisma.user.findFirst({ where: { email: 'hr.test@example.com' } });
    if (!hrUser) {
      hrUser = await prisma.user.create({
        data: {
          name: 'Test HR Manager',
          username: 'hr_test_' + Date.now(),
          email: 'hr.test@example.com',
          password_hash: 'mockhash',
          role: 'HR'
        }
      });
    }

    let jobRole = await prisma.jobRole.findFirst({ where: { title: 'Senior AI Engineer' } });
    if (!jobRole) {
      jobRole = await prisma.jobRole.create({
        data: {
          title: 'Senior AI Engineer',
          department: 'Engineering',
          description: 'Build agentic voice systems with Python and Node.js',
          created_by: hrUser.id
        }
      });
    }

    let campaign = await prisma.campaign.findFirst({ where: { name: 'Test Omnichannel Campaign' } });
    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          name: 'Test Omnichannel Campaign',
          location: 'Remote, India',
          job_role_id: jobRole.id,
          created_by_hr_id: hrUser.id,
          status: 'ACTIVE'
        }
      });

      // Add a test question
      await prisma.question.create({
        data: {
          campaign_id: campaign.id,
          text: 'Explain how you would design a low-latency WebRTC audio streaming pipeline.',
          type: 'Technical Architecture',
          level: 'HARD'
        }
      });
    }

    // 1. Create a Test Candidate
    const testPhone = '+919988776655';
    let candidate = await prisma.candidate.create({
      data: {
        campaign_id: campaign.id,
        name: 'Rohan Sharma',
        email: 'rohan.sharma.test@example.com',
        contact: testPhone,
        emp_details: '5 YOE Fullstack AI Dev',
        status: CANDIDATE_STATUS.PENDING
      }
    });
    console.log(`[TEST 1] Candidate Created: ${candidate.name} (${candidate.id})`);

    // 2. Step 1: Dispatch Initial WhatsApp Hook with DPDP Notice
    await sendInitialWhatsAppInvite(candidate.id);
    candidate = await prisma.candidate.findUnique({ where: { id: candidate.id } });
    console.log(`[TEST 2] Step 1 WhatsApp Invite Dispatched -> Status: ${candidate.status}, SentAt: ${candidate.whatsapp_sent_at}`);
    if (candidate.status !== CANDIDATE_STATUS.WHATSAPP_SENT) throw new Error('WhatsApp status mismatch');

    // 3. Step 1 FAQ / Query Bot
    const faqReply = await handleInboundWhatsAppMessage({
      From: testPhone,
      Body: 'What is the salary range and work location for this role?'
    });
    console.log(`[TEST 3] Candidate Query / FAQ Handling -> Action: ${faqReply.action}`);
    if (faqReply.action !== 'FAQ_RESPONSE_SENT') throw new Error('FAQ handler failed');

    // 4. Step 2: Candidate Provides Consent via WhatsApp -> Magic Link Generated
    const consentReply = await handleInboundWhatsAppMessage({
      From: testPhone,
      Body: 'Yes, I consent to the voice screening'
    });
    console.log(`[TEST 4] Candidate WhatsApp Consent -> Action: ${consentReply.action}, Link: ${consentReply.magicLinkUrl}`);
    if (consentReply.action !== 'MAGIC_LINK_SENT') throw new Error('Magic link generation failed');

    candidate = await prisma.candidate.findUnique({ where: { id: candidate.id } });
    console.log(`[TEST 4.1] Candidate DPDP Consent Recorded: ${candidate.dpdp_consent_given} via ${candidate.dpdp_consent_channel}`);
    if (!candidate.dpdp_consent_given || !candidate.magic_token) throw new Error('Consent flag or token missing');

    // 5. Step 2: Magic Link Access on Browser
    const sessionData = await getSessionByToken(candidate.magic_token);
    console.log(`[TEST 5] Candidate Session Fetched via Magic Link -> Role: ${sessionData.session.jobTitle}, Questions: ${sessionData.session.questions.length}`);
    if (!sessionData.session || sessionData.session.questions.length === 0) throw new Error('Session fetch failed');

    // 6. Record Web Consent & Start Interview
    await recordWebConsent(candidate.magic_token, '127.0.0.1');
    candidate = await prisma.candidate.findUnique({ where: { id: candidate.id } });
    console.log(`[TEST 6] Interview In Progress -> Status: ${candidate.status}`);
    if (candidate.status !== CANDIDATE_STATUS.INTERVIEW_IN_PROGRESS) throw new Error('Interview status mismatch');

    // 7. Submit Web Voice Screening Results
    const submitResult = await submitWebScreeningSession(candidate.magic_token, {
      transcript: [
        { question: 'Explain how you would design a low-latency WebRTC pipeline.', answer: 'I would use Opus codec, Fast Audio VAD, and bidirectional WebSockets.' }
      ],
      ai_score: 92
    });
    console.log(`[TEST 7] Web Voice Screening Submitted -> Final Score: ${submitResult.candidate.ai_score}, Status: ${submitResult.candidate.status}`);
    if (submitResult.candidate.status !== CANDIDATE_STATUS.COMPLETED || submitResult.candidate.ai_score !== 92) throw new Error('Submission scoring failed');

    // 8. DPDP Section 12: Candidate Requests Right to Erasure ("DELETE")
    const erasureReply = await handleInboundWhatsAppMessage({
      From: testPhone,
      Body: 'DELETE'
    });
    console.log(`[TEST 8] DPDP Right to Erasure Requested -> Action: ${erasureReply.action}`);
    if (erasureReply.action !== 'DPDP_ERASURE_COMPLETED') throw new Error('DPDP erasure failed');

    // Verify PII is wiped in SQLite DB
    const erasedCandidate = await prisma.candidate.findUnique({ where: { id: candidate.id } });
    console.log(`[TEST 8.1] Candidate Verification Post-Erasure:`);
    console.log(`  Name: ${erasedCandidate.name}`);
    console.log(`  Email: ${erasedCandidate.email}`);
    console.log(`  Contact: ${erasedCandidate.contact}`);
    console.log(`  Status: ${erasedCandidate.status}`);
    console.log(`  Dossier: ${erasedCandidate.dossier_json}`);
    
    if (erasedCandidate.status !== CANDIDATE_STATUS.DATA_ERASED_DPDP || erasedCandidate.name !== 'Anonymized Candidate') {
      throw new Error('Candidate PII was not properly anonymized!');
    }

    // 9. Verify DPDP Audit Trail
    const auditLogs = await getDpdpAuditTrail({ limit: 10 });
    console.log(`\n[TEST 9] DPDP Immutable Audit Logs (${auditLogs.length} entries recorded):`);
    auditLogs.slice(0, 3).forEach(log => {
      console.log(`  - [${log.action}] Channel: ${log.channel} | Timestamp: ${log.timestamp.toISOString()}`);
    });

    console.log('\n🎉 ALL 9 OMNICHANNEL & DPDP COMPLIANCE TESTS PASSED SUCCESSFULLY! 🚀');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOmnichannelDpdpTests();
