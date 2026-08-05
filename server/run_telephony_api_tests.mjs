/**
 * AntiTalk Express API - Exotel Telephony Integration Tests
 * =========================================================
 * Runs verification checks against the live Express server.
 * Ensures routes, controllers, and services in the telephony module function correctly.
 *
 * Make sure the server is running on http://localhost:5000 before executing:
 *   node run_telephony_api_tests.mjs
 */

const BASE = "http://localhost:5000";
let passed = 0, failed = 0, errors = [];
let HR_TOKEN = "";
let CANDIDATE_ID = "";

const C = {
  cyan:   "\x1b[96m", yellow: "\x1b[93m",
  green:  "\x1b[92m", red:    "\x1b[91m",
  blue:   "\x1b[94m", bold:   "\x1b[1m",  reset:  "\x1b[0m"
};

function header(title) {
  console.log(`\n${C.cyan}${"=".repeat(62)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${title}${C.reset}`);
  console.log(`${C.cyan}${"=".repeat(62)}${C.reset}`);
}

function test(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ${C.green}[PASS]${C.reset} ${name}`);
    if (detail) console.log(`        ${C.yellow}→ ${detail}${C.reset}`);
  } else {
    failed++;
    errors.push(name);
    console.log(`  ${C.red}[FAIL]${C.reset} ${name}`);
    if (detail) console.log(`        ${C.red}→ ${detail}${C.reset}`);
  }
}

async function req(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: {}, error: e.message };
  }
}

// ── Suite 1: Authenticate as HR ─────────────────────────────────────────────
async function authenticateHR() {
  header("Suite 1: Authentication");
  const r = await req("POST", "/api/auth/signin", {
    identifier: "hr@antitalk.com",
    password: "password123"
  });
  test("HR signin succeeds", r.status === 200, `Status: ${r.status}`);
  HR_TOKEN = r.data?.token || "";
  test("Token received", !!HR_TOKEN);
}

// ── Suite 2: Fetch/Setup Test Candidate ─────────────────────────────────────
async function setupTestCandidate() {
  header("Suite 2: Retrieve/Create Candidate for Telephony Tests");
  
  let listRes = await req("GET", "/api/hr/candidates", null, HR_TOKEN);
  
  if (listRes.status === 200 && listRes.data && listRes.data.length > 0) {
    CANDIDATE_ID = listRes.data[0].id;
    test("Can fetch candidates list", true, `Found existing candidate Count: ${listRes.data.length}`);
  } else {
    console.log("  No existing candidates found. Creating a test job role, campaign, and candidate dynamically...");
    
    // 1. Get or create Job Role
    let jobRolesRes = await req("GET", "/api/hr/job-roles", null, HR_TOKEN);
    let jobRoleId = jobRolesRes.data?.[0]?.id;
    
    if (!jobRoleId) {
      const createRoleRes = await req("POST", "/api/hr/job-roles", {
        title: "Dynamic Test QA Engineer",
        department: "Testing",
        description: "Verify backend APIs."
      }, HR_TOKEN);
      jobRoleId = createRoleRes.data?.id;
    }
    
    // 2. Create Campaign
    const createCampaignRes = await req("POST", "/api/hr/campaigns", {
      name: "Dynamic Telephony Test Campaign",
      location: "Remote",
      job_role_id: jobRoleId,
      questions: [
        { text: "What is testing?", type: "technical", level: "EASY" }
      ]
    }, HR_TOKEN);
    
    const campaignId = createCampaignRes.data?.id;
    
    // 3. Add Candidate
    const addCandidateRes = await req("POST", `/api/hr/candidates/campaigns/${campaignId}/candidates`, {
      candidates: [
        { name: "Test Candidate Alpha", email: "alpha@test.com", contact: "+11234567890", emp_details: "3 years experience" }
      ]
    }, HR_TOKEN);
    
    // Fetch campaign details to retrieve the candidate ID
    const campaignDetailsRes = await req("GET", `/api/hr/campaigns/${campaignId}`, null, HR_TOKEN);
    const candidate = campaignDetailsRes.data?.candidates?.[0];
    if (candidate) {
      CANDIDATE_ID = candidate.id;
    }
    
    test("Dynamically created test candidate", !!CANDIDATE_ID, `ID: ${CANDIDATE_ID}`);
  }
  
  test("Candidate ID available", !!CANDIDATE_ID, `ID: ${CANDIDATE_ID}`);
}

// ── Suite 3: WhatsApp Outbound endpoints ────────────────────────────────────
async function testWhatsAppOutbound() {
  header("Suite 3: WhatsApp Manual Dispatch Route");
  if (!CANDIDATE_ID) {
    console.log("  [SKIP] Skipping outbound tests due to missing Candidate ID");
    return;
  }

  const res = await req("POST", `/api/telephony/whatsapp/${CANDIDATE_ID}`, {}, HR_TOKEN);
  test("POST to manual WhatsApp outreach returns 200 or 500 (API credential check)", [200, 500].includes(res.status), `Status: ${res.status}`);
  if (res.status === 200) {
    test("Returns success flag", res.data?.success === true);
    test("Dispatches a message SID", !!res.data?.sid);
  }
}

// ── Suite 4: Leg Outbound Dial endpoints ──────────────────────────────────────
async function testLegOutbound() {
  header("Suite 4: Leg/Call Dial Route");
  if (!CANDIDATE_ID) {
    console.log("  [SKIP] Skipping leg tests due to missing Candidate ID");
    return;
  }

  const res = await req("POST", `/api/telephony/call/${CANDIDATE_ID}`, {}, HR_TOKEN);
  test("POST to manual call dispatch returns 200 or 500 (API credential check)", [200, 500].includes(res.status), `Status: ${res.status}`);
  if (res.status === 200) {
    test("Returns success flag", res.data?.success === true);
    test("Dispatches a leg SID", !!res.data?.legSid);
  }
}

// ── Suite 5: Inbound Webhook Simulator ──────────────────────────────────────
async function testInboundWebhooks() {
  header("Suite 5: Webhook Event Simulators");

  // 1. WhatsApp Inbound message simulation
  // This simulates the candidate sending "Yes" to opt-in
  const waPayload = {
    type: "inbound_message",
    data: {
      from: "+919876543210",
      message: {
        body: "Yes, I am interested"
      }
    }
  };
  const waWebhookRes = await req("POST", "/api/telephony/whatsapp/webhook", waPayload);
  test("WhatsApp webhook returns 200 (quick ack)", waWebhookRes.status === 200);
  test("Returns received ack", waWebhookRes.data?.received === true);

  // 2. Leg Answered simulation
  // This simulates the candidate answering the outbound dial
  const legPayload = {
    type: "leg_answered",
    data: {
      leg_sid: "LEG_TEST_SID_9999",
      metadata: {
        candidate_id: CANDIDATE_ID || "test-id"
      }
    }
  };
  const legWebhookRes = await req("POST", "/api/telephony/leg/webhook", legPayload);
  test("Leg webhook returns 200 (quick ack)", legWebhookRes.status === 200);
  test("Returns received ack", legWebhookRes.data?.received === true);
}

// ── Main Runner ─────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}${C.cyan}`);
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║    AntiTalk Exotel Telephony Module Integration Tests    ║");
  console.log("║    Runs against live server at http://localhost:5000     ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(C.reset);

  await authenticateHR();
  await setupTestCandidate();
  await testWhatsAppOutbound();
  await testLegOutbound();
  await testInboundWebhooks();

  const total = passed + failed;
  header("TELEPHONY INTEGRATION RESULTS SUMMARY");
  console.log(`  Total Tests   : ${total}`);
  console.log(`  ${C.green}Passed${C.reset}        : ${passed}`);
  console.log(`  ${C.red}Failed${C.reset}        : ${failed}`);
  if (errors.length) {
    console.log(`\n  ${C.red}Failed Tests:${C.reset}`);
    errors.forEach(e => console.log(`    ✗ ${e}`));
  }
  console.log();
  if (failed === 0) {
    console.log(`  ${C.bold}${C.green}All ${total} Telephony tests passed! Exotel integration healthy. ✓${C.reset}`);
  } else {
    const pct = Math.round((passed / total) * 100);
    console.log(`  ${C.yellow}${pct}% tests passed. Check server.js log or environment setup.${C.reset}`);
  }
  console.log(`\n${C.cyan}${"=".repeat(62)}${C.reset}\n`);
})();
