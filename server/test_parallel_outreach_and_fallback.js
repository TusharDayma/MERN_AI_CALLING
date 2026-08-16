import prisma from './config/db.js';
import { launchCampaign, dispatchParallelCandidateOutreach } from './src/modules/campaigns/campaign.service.js';
import { handleInboundWhatsAppMessage } from './src/modules/twilio/twilio.service.js';
import { recordWebConsent } from './src/modules/screening/screening.service.js';
import { checkAndTriggerFallbackCalls } from './src/modules/notifications/fallback.scheduler.js';
import { CANDIDATE_STATUS, WHATSAPP_TIMEOUT_MINUTES } from './src/config/constants.js';

async function testParallelOutreachAndFallback() {
  console.log('🚀 Starting Parallel Messaging & Last-Resort Fallback Calling Test Suite...\n');

  try {
    // 0. Setup HR User & Job Role
    let hrUser = await prisma.user.findFirst({ where: { email: 'hr.parallel@example.com' } });
    if (!hrUser) {
      hrUser = await prisma.user.create({
        data: {
          name: 'HR Outreach Lead',
          username: 'hr_lead_' + Date.now(),
          email: 'hr.parallel@example.com',
          password_hash: 'mockhash',
          role: 'HR',
          credits_balance: 50
        }
      });
    } else {
      await prisma.user.update({
        where: { id: hrUser.id },
        data: { credits_balance: 50 }
      });
    }

    let jobRole = await prisma.jobRole.findFirst({ where: { title: 'Lead AI Engineer' } });
    if (!jobRole) {
      jobRole = await prisma.jobRole.create({
        data: {
          title: 'Lead AI Engineer',
          department: 'Engineering',
          description: 'Multi-modal AI pipelines & LLMs',
          created_by: hrUser.id
        }
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: 'Parallel Outreach Test Campaign ' + Date.now(),
        location: 'Bangalore, India',
        job_role_id: jobRole.id,
        created_by_hr_id: hrUser.id,
        status: 'DRAFT'
      }
    });

    // 1. Create 3 Candidates:
    // - Candidate 1: Will respond to WhatsApp (Opt-in) -> No fallback call
    // - Candidate 2: Will click Magic Link (Web consent) -> No fallback call
    // - Candidate 3: Will IGNORE BOTH Email & WhatsApp -> MUST trigger last-resort fallback call!
    const phone1 = '+919811111111';
    const phone2 = '+919822222222';
    const phone3 = '+919833333333';

    const [c1, c2, c3] = await Promise.all([
      prisma.candidate.create({
        data: {
          campaign_id: campaign.id,
          name: 'Aarav Sharma (WA Responder)',
          email: 'aarav.sharma@test.com',
          contact: phone1,
          emp_details: '4 YOE Backend',
          status: CANDIDATE_STATUS.PENDING
        }
      }),
      prisma.candidate.create({
        data: {
          campaign_id: campaign.id,
          name: 'Bhavna Patel (Email/Web Responder)',
          email: 'bhavna.patel@test.com',
          contact: phone2,
          emp_details: '6 YOE Fullstack',
          status: CANDIDATE_STATUS.PENDING
        }
      }),
      prisma.candidate.create({
        data: {
          campaign_id: campaign.id,
          name: 'Chetan Verma (Ignored Both)',
          email: 'chetan.verma@test.com',
          contact: phone3,
          emp_details: '5 YOE DevOps',
          status: CANDIDATE_STATUS.PENDING
        }
      })
    ]);

    console.log(`[TEST 1] Created 3 candidates under campaign "${campaign.name}"`);

    // 2. Launch Campaign: Verify Simultaneous Parallel Messaging (Email + WhatsApp)
    console.log('\n[TEST 2] Launching Campaign with Parallel Omnichannel Dispatch...');
    const launchResult = await launchCampaign(campaign.id);
    console.log('[TEST 2 Result]', launchResult.message);

    const postLaunchCandidates = await prisma.candidate.findMany({
      where: { campaign_id: campaign.id }
    });

    for (const c of postLaunchCandidates) {
      console.log(`  Candidate "${c.name}": Email Sent At: ${c.email_sent_at?.toISOString() || 'NONE'}, WhatsApp Sent At: ${c.whatsapp_sent_at?.toISOString() || 'NONE'}, Magic Token: ${c.magic_token ? 'YES' : 'NO'}`);
      if (!c.email_sent_at || !c.whatsapp_sent_at || !c.magic_token) {
        throw new Error(`Candidate ${c.name} was not dispatched parallel Email + WhatsApp messages!`);
      }
    }
    console.log('✅ TEST 2 PASSED: Parallel Email + WhatsApp invitations successfully dispatched to all candidates simultaneously.\n');

    // 3. Candidate 1 responds on WhatsApp -> Should NOT be called
    console.log('[TEST 3] Candidate 1 replies YES on WhatsApp...');
    await handleInboundWhatsAppMessage({
      From: phone1,
      Body: 'YES'
    });
    const c1Updated = await prisma.candidate.findUnique({ where: { id: c1.id } });
    console.log(`  Candidate 1 Status: ${c1Updated.status}, WhatsApp Status: ${c1Updated.whatsapp_status}, DPDP Consent: ${c1Updated.dpdp_consent_given}`);

    // 4. Candidate 2 starts screening from Email Magic Link -> Should NOT be called
    console.log('\n[TEST 4] Candidate 2 opens magic link and gives Web Consent...');
    const c2Fresh = await prisma.candidate.findUnique({ where: { id: c2.id } });
    await recordWebConsent(c2Fresh.magic_token, '127.0.0.1');
    const c2Updated = await prisma.candidate.findUnique({ where: { id: c2.id } });
    console.log(`  Candidate 2 Status: ${c2Updated.status}, DPDP Consent: ${c2Updated.dpdp_consent_given}`);

    // 5. Candidate 3 ignores BOTH Email & WhatsApp -> Simulate Timeout Window (e.g. 24h passed)
    console.log('\n[TEST 5] Candidate 3 ignores BOTH channels. Simulating elapsed timeout (24h backdate)...');
    const backdatedTime = new Date(Date.now() - (WHATSAPP_TIMEOUT_MINUTES + 10) * 60 * 1000);
    await prisma.candidate.update({
      where: { id: c3.id },
      data: {
        whatsapp_sent_at: backdatedTime,
        email_sent_at: backdatedTime
      }
    });

    // Run fallback scheduler check
    console.log('[TEST 5] Running Fallback Scheduler check...');
    await checkAndTriggerFallbackCalls({ bypassCallingHours: true });

    const c3PostCheck = await prisma.candidate.findUnique({ where: { id: c3.id } });
    console.log(`  Candidate 3 Post-Fallback Status: ${c3PostCheck.status}`);
    console.log(`  Candidate 3 Fallback Call At: ${c3PostCheck.fallback_call_at?.toISOString()}`);
    console.log(`  Candidate 3 Call Attempts: ${c3PostCheck.call_attempts}`);

    if (c3PostCheck.status !== CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED || c3PostCheck.call_attempts !== 1) {
      throw new Error('Candidate 3 did not receive last-resort fallback voice call!');
    }
    console.log('✅ TEST 5 PASSED: Ignored candidate correctly triggered LAST-RESORT voice call.\n');

    // 6. Verify Candidate 1 and Candidate 2 did NOT get called
    const c1Final = await prisma.candidate.findUnique({ where: { id: c1.id } });
    const c2Final = await prisma.candidate.findUnique({ where: { id: c2.id } });

    console.log('[TEST 6] Verifying engaged candidates were NOT called:');
    console.log(`  Candidate 1 Call Attempts: ${c1Final.call_attempts} (Expected: 0)`);
    console.log(`  Candidate 2 Call Attempts: ${c2Final.call_attempts} (Expected: 0)`);

    if (c1Final.call_attempts !== 0 || c2Final.call_attempts !== 0) {
      throw new Error('Engaged candidates were erroneously targeted for fallback calls!');
    }
    console.log('✅ TEST 6 PASSED: Engaged candidates were shielded from fallback calls.\n');

    // 7. Max Retries Guardrail Test
    console.log('[TEST 7] Testing Max Retries Guardrail for Candidate 3...');
    await prisma.candidate.update({
      where: { id: c3.id },
      data: {
        call_attempts: 2, // At max attempts
        whatsapp_sent_at: backdatedTime
      }
    });

    await checkAndTriggerFallbackCalls({ bypassCallingHours: true });

    const c3Expired = await prisma.candidate.findUnique({ where: { id: c3.id } });
    console.log(`  Candidate 3 Status after exceeding max calls: ${c3Expired.status} (Expected: EXPIRED)`);

    if (c3Expired.status !== CANDIDATE_STATUS.EXPIRED) {
      throw new Error('Candidate 3 did not transition to EXPIRED after max attempts!');
    }
    console.log('✅ TEST 7 PASSED: Candidate marked as EXPIRED after exceeding max call retries.\n');

    console.log('🎉 ALL PARALLEL MESSAGING & LAST-RESORT CALLING TESTS COMPLETED SUCCESSFULLY! 🚀');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testParallelOutreachAndFallback();
