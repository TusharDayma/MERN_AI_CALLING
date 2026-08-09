import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING SECURITY TESTS ---');

  // 1. Test Rate Limiting on Signin
  console.log('\n[1] Testing Rate Limiting on /api/auth/signin');
  let rateLimited = false;
  for(let i = 0; i < 15; i++) {
    const res = await fetch(`${BASE_URL}/auth/signin`, { method: 'POST', body: JSON.stringify({}), headers: {'Content-Type': 'application/json'} });
    if(res.status === 429) {
      rateLimited = true;
      console.log(`  -> Hit rate limit (429) at attempt ${i+1}`);
      break;
    }
  }
  if(!rateLimited) console.log('  -> Failed to trigger rate limit (or limit is > 15)');

  // 2. Test Strict Input Validation (CSV Import)
  console.log('\n[2] Testing Strict Input Validation on CSV Import');
  const dummyCampaignId = 'test-id';
  // Send invalid email and phone
  const badData = { candidates: [{ name: 'J', email: 'invalid-email', contact: '123' }] };
  const resBadInput = await fetch(`${BASE_URL}/hr/campaigns/${dummyCampaignId}/candidates`, {
    method: 'POST',
    body: JSON.stringify(badData),
    headers: { 'Content-Type': 'application/json' }
  });
  const badJson = await resBadInput.json();
  if(resBadInput.status === 400 && badJson.details) {
    console.log('  -> Successfully blocked invalid data (400 Bad Request):');
    console.log(`     Error 1: ${badJson.details[0]?.message}`);
    console.log(`     Error 2: ${badJson.details[1]?.message}`);
    console.log(`     Error 3: ${badJson.details[2]?.message}`);
  } else {
    console.log(`  -> Unexpected response: ${resBadInput.status}`, badJson);
  }

  // 3. Test Exotel Webhook Security
  console.log('\n[3] Testing Exotel Webhook HMAC Security');
  const exotelPayload = { CallSid: '12345' };
  const exotelPayloadStr = JSON.stringify(exotelPayload);
  const fakeToken = 'wrong-token';
  const realToken = process.env.EXOTEL_AUTH_TOKEN || '';
  
  // No signature
  const resNoSig = await fetch(`${BASE_URL}/telephony/whatsapp/webhook`, { method: 'POST', body: exotelPayloadStr, headers: { 'Content-Type': 'application/json' } });
  console.log(`  -> No signature: ${resNoSig.status} (Expected 401)`);
  
  // Bad signature
  const badSig = crypto.createHmac('sha256', fakeToken).update(exotelPayloadStr).digest('hex');
  const resBadSig = await fetch(`${BASE_URL}/telephony/whatsapp/webhook`, { method: 'POST', body: exotelPayloadStr, headers: { 'Content-Type': 'application/json', 'x-exotel-signature': badSig } });
  console.log(`  -> Bad signature: ${resBadSig.status} (Expected 401)`);
  
  if(realToken) {
    const goodSig = crypto.createHmac('sha256', realToken).update(exotelPayloadStr).digest('hex');
    const resGoodSig = await fetch(`${BASE_URL}/telephony/whatsapp/webhook`, { method: 'POST', body: exotelPayloadStr, headers: { 'Content-Type': 'application/json', 'x-exotel-signature': goodSig } });
    console.log(`  -> Good signature: ${resGoodSig.status} (Expected 200/404/etc, but NOT 401)`);
  }

  // 4. Test Internal Webhook Secret
  console.log('\n[4] Testing Internal Webhook Secret Check');
  const internalPayload = { candidate_id: 'test' };
  
  // No secret
  const resNoSecret = await fetch(`${BASE_URL}/webhooks/call-completed`, { method: 'POST', body: JSON.stringify(internalPayload), headers: { 'Content-Type': 'application/json' } });
  console.log(`  -> No internal secret: ${resNoSecret.status} (Expected 403)`);
  
  // Bad secret
  const resBadSecret = await fetch(`${BASE_URL}/webhooks/call-completed`, { method: 'POST', body: JSON.stringify(internalPayload), headers: { 'Content-Type': 'application/json', 'x-internal-webhook-secret': 'wrong' } });
  console.log(`  -> Bad internal secret: ${resBadSecret.status} (Expected 403)`);

  const realSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  if(realSecret) {
    const resGoodSecret = await fetch(`${BASE_URL}/webhooks/call-completed`, { method: 'POST', body: JSON.stringify(internalPayload), headers: { 'Content-Type': 'application/json', 'x-internal-webhook-secret': realSecret } });
    console.log(`  -> Good internal secret: ${resGoodSecret.status} (Expected 200)`);
  } else {
    console.log(`  -> Skipping Good internal secret test: INTERNAL_WEBHOOK_SECRET is not set in process.env`);
  }

  console.log('\n--- TESTS COMPLETED ---');
}

runTests().catch(console.error);
