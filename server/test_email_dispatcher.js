import prisma from './config/db.js';
import { verifyEmailConfiguration, sendCandidateScreeningEmail } from './src/modules/email/email.service.js';

async function testEmailDispatcher() {
  console.log('📧 Starting Free Email Dispatcher (Nodemailer / Gmail) Test...\n');

  try {
    // 1. Verify Email configuration status
    const configStatus = await verifyEmailConfiguration();
    console.log('[TEST 1] Email Configuration Status:', configStatus);

    // 2. Fetch or create a candidate
    let candidate = await prisma.candidate.findFirst({
      where: { email: { not: '' } },
      include: { campaign: true }
    });

    if (!candidate) {
      console.log('No candidate found, creating a test candidate...');
      const hr = await prisma.user.findFirst();
      const jobRole = await prisma.jobRole.findFirst();
      const campaign = await prisma.campaign.findFirst() || await prisma.campaign.create({
        data: {
          name: 'AI Screening Campaign',
          location: 'Remote',
          job_role_id: jobRole.id,
          created_by_hr_id: hr.id
        }
      });

      candidate = await prisma.candidate.create({
        data: {
          name: 'Priya Patel',
          email: 'priya.patel.test@example.com',
          contact: '+919876543210',
          emp_details: 'AI Fullstack Engineer',
          campaign_id: campaign.id
        }
      });
    }

    // 3. Dispatch Candidate Screening Email
    console.log(`\n[TEST 2] Dispatching Candidate Invitation Email for ${candidate.name} (${candidate.email})...`);
    const dispatchResult = await sendCandidateScreeningEmail(candidate.id);
    console.log('[TEST 2 Result] Dispatch Result:', dispatchResult);

    if (!dispatchResult.success) {
      throw new Error('Email dispatch failed');
    }

    // 4. Verify candidate now has a magic link token
    const updatedCandidate = await prisma.candidate.findUnique({
      where: { id: candidate.id }
    });

    console.log('\n[TEST 3] Candidate State Post-Dispatch:');
    console.log(`  Candidate: ${updatedCandidate.name}`);
    console.log(`  Email: ${updatedCandidate.email}`);
    console.log(`  Status: ${updatedCandidate.status}`);
    console.log(`  Magic Token: ${updatedCandidate.magic_token}`);
    console.log(`  Token Expires At: ${updatedCandidate.magic_token_expires_at}`);

    if (!updatedCandidate.magic_token) {
      throw new Error('Magic token was not generated for candidate!');
    }

    console.log('\n🎉 ALL EMAIL DISPATCHER TESTS PASSED SUCCESSFULLY! 🚀');

  } catch (err) {
    console.error('❌ Email test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailDispatcher();
