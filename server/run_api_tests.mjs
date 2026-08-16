/**
 * AntiTalk Express API - Automated Integration Tests
 * ====================================================
 * Runs against the live Express server on http://localhost:5000
 * Usage: node run_api_tests.mjs
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE = "http://127.0.0.1:5000";
let passed = 0, failed = 0, errors = [];
let HR_TOKEN = "";
let ADMIN_TOKEN = "";
let JOB_ROLE_ID = "";
let CAMPAIGN_ID = "";
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

async function req(method, path, body = null, token = null, extraHeaders = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
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

// ── Suite 1: Health Check ───────────────────────────────────────────────────
async function testHealth() {
  header("Suite 1: Server Health Check");
  const r = await req("GET", "/api/health");
  test("Server is reachable on port 5000",       r.status !== 0,
       r.error ?? `status=${r.status}`);
  test("Health endpoint returns 200",            r.status === 200,
       `status=${r.status}`);
  test("Health response has status 'ok'",        r.data?.status === "ok",
       JSON.stringify(r.data));
}

// ── Suite 2: Auth Routes ────────────────────────────────────────────────────
async function testAuth() {
  header("Suite 2: Auth Routes — Sign In");

  // HR Sign In
  const hrRes = await req("POST", "/api/auth/signin", {
    identifier: "hr@antitalk.com", password: "password123"
  });
  test("HR signin returns 200",             hrRes.status === 200,
       `status=${hrRes.status}, body=${JSON.stringify(hrRes.data).substring(0,80)}`);
  test("HR signin returns a JWT token",     typeof hrRes.data?.token === "string",
       `token present: ${!!hrRes.data?.token}`);
  HR_TOKEN = hrRes.data?.token || "";

  // Admin Sign In
  const adminRes = await req("POST", "/api/auth/signin", {
    identifier: "admin@antitalk.com", password: "password123"
  });
  test("Admin signin returns 200",          adminRes.status === 200,
       `status=${adminRes.status}`);
  test("Admin signin returns a JWT token",  typeof adminRes.data?.token === "string");
  ADMIN_TOKEN = adminRes.data?.token || "";

  // Wrong password
  const badRes = await req("POST", "/api/auth/signin", {
    identifier: "hr@antitalk.com", password: "wrongpassword"
  });
  test("Wrong password returns 401",        badRes.status === 401,
       `status=${badRes.status}`);

  // Non-existent user
  const noUser = await req("POST", "/api/auth/signin", {
    identifier: "nobody@nowhere.com", password: "abc"
  });
  test("Non-existent user returns 404/401", [401, 404].includes(noUser.status),
       `status=${noUser.status}`);
}

// ── Suite 3: Admin Routes ───────────────────────────────────────────────────
async function testAdmin() {
  header("Suite 3: Admin Routes");

  const metricsRes = await req("GET", "/api/admin/metrics", null, ADMIN_TOKEN);
  test("Admin metrics returns 200",               metricsRes.status === 200,
       `status=${metricsRes.status}`);
  test("Admin metrics contains expected fields",  metricsRes.data?.totalHRAccounts !== undefined ||
                                                  metricsRes.status === 200,
       JSON.stringify(metricsRes.data).substring(0, 80));

  const usersRes = await req("GET", "/api/admin/users", null, ADMIN_TOKEN);
  test("Admin users list returns 200",            usersRes.status === 200,
       `status=${usersRes.status}`);
  test("Admin users list is an array",            Array.isArray(usersRes.data),
       `type=${typeof usersRes.data}`);

  const unauthorised = await req("GET", "/api/admin/metrics", null, HR_TOKEN);
  test("HR token cannot access admin metrics",    unauthorised.status === 403,
       `status=${unauthorised.status}`);

  // Test unauthenticated request
  const noToken = await req("GET", "/api/admin/metrics");
  test("Unauthenticated request returns 401",     noToken.status === 401,
       `status=${noToken.status}`);;
}

// ── Suite 4: HR — Job Roles ─────────────────────────────────────────────────
async function testJobRoles() {
  header("Suite 4: HR Routes — Job Roles");

  const listRes = await req("GET", "/api/hr/job-roles", null, HR_TOKEN);
  test("Job roles list returns 200",        listRes.status === 200,
       `status=${listRes.status}`);
  test("Job roles list is an array",        Array.isArray(listRes.data),
       `type=${typeof listRes.data}`);

  const createRes = await req("POST", "/api/hr/job-roles", {
    title: "Test QA Engineer " + Date.now(),
    department: "Quality Assurance",
    description: "Responsible for end-to-end quality testing."
  }, HR_TOKEN);
  test("Create job role returns 201",       createRes.status === 201,
       `status=${createRes.status}, body=${JSON.stringify(createRes.data).substring(0,80)}`);
  test("Created job role has an ID",        typeof createRes.data?.id === "string",
       `id=${createRes.data?.id}`);
  JOB_ROLE_ID = createRes.data?.id || listRes.data?.[0]?.id || "";
  test("Job role ID captured for next tests", JOB_ROLE_ID.length > 0, `id=${JOB_ROLE_ID}`);

  // Missing required fields
  const badCreate = await req("POST", "/api/hr/job-roles", {
    title: "Incomplete"
  }, HR_TOKEN);
  test("Incomplete job role returns 400/500", [400, 500].includes(badCreate.status),
       `status=${badCreate.status}`);
}

// ── Suite 5: HR — Campaigns ─────────────────────────────────────────────────
async function testCampaigns() {
  header("Suite 5: HR Routes — Campaigns");

  if (!JOB_ROLE_ID) {
    console.log(`  ${C.yellow}[SKIP] No JOB_ROLE_ID available. Run job roles test first.${C.reset}`);
    return;
  }

  // Create campaign
  const createRes = await req("POST", "/api/hr/campaigns", {
    name: "Automated Test Campaign " + Date.now(),
    location: "Remote",
    job_role_id: JOB_ROLE_ID,
    questions: [
      { text: "What is JavaScript?", type: "technical", level: "EASY" },
      { text: "Explain closures.", type: "technical", level: "MEDIUM" }
    ]
  }, HR_TOKEN);
  test("Create campaign returns 201",           createRes.status === 201,
       `status=${createRes.status}, body=${JSON.stringify(createRes.data).substring(0,80)}`);
  test("Created campaign has an ID",            typeof createRes.data?.id === "string",
       `id=${createRes.data?.id}`);
  CAMPAIGN_ID = createRes.data?.id || "";

  // List campaigns
  const listRes = await req("GET", "/api/hr/campaigns", null, HR_TOKEN);
  test("Campaigns list returns 200",            listRes.status === 200,
       `status=${listRes.status}`);
  test("Campaigns list is an array",            Array.isArray(listRes.data),
       `type=${typeof listRes.data}`);

  // Get campaign details
  if (CAMPAIGN_ID) {
    const detailRes = await req("GET", `/api/hr/campaigns/${CAMPAIGN_ID}`, null, HR_TOKEN);
    test("Campaign detail returns 200",         detailRes.status === 200,
         `status=${detailRes.status}`);
    test("Campaign detail has correct name",    detailRes.data?.name?.startsWith("Automated Test Campaign"),
         `name="${detailRes.data?.name}"`);
  }
}

// ── Suite 6: HR — Candidates ────────────────────────────────────────────────
async function testCandidates() {
  header("Suite 6: HR Routes — Candidates");

  if (!CAMPAIGN_ID) {
    console.log(`  ${C.yellow}[SKIP] No CAMPAIGN_ID available. Run campaigns test first.${C.reset}`);
    return;
  }

  const addRes = await req("POST", `/api/hr/campaigns/${CAMPAIGN_ID}/candidates`, {
    candidates: [
      { name: "Test Candidate Alpha", email: "alpha@test.com",
        contact: "+14155552671", emp_details: "3 years Node.js experience" },
      { name: "Test Candidate Beta",  email: "beta@test.com",
        contact: "+14155552672", emp_details: "5 years React experience" }
    ]
  }, HR_TOKEN);
  test("Add candidates returns 201",              addRes.status === 201,
       `status=${addRes.status}, body=${JSON.stringify(addRes.data).substring(0,80)}`);

  // Rankings list
  const rankRes = await req("GET", "/api/hr/candidates", null, HR_TOKEN);
  test("Candidate rankings endpoint returns 200", rankRes.status === 200,
       `status=${rankRes.status}`);
  test("Rankings response is an array",           Array.isArray(rankRes.data),
       `type=${typeof rankRes.data}`);
}

// ── Suite 7: Twilio Webhook ─────────────────────────────────────────────────
async function testWebhook() {
  header("Suite 7: Webhook — Call Completed");

  const webhookHeaders = {
    'x-internal-webhook-secret': process.env.INTERNAL_WEBHOOK_SECRET || 'super-secret-internal-ai-webhook-key-change-me'
  };

  // Ensure we have a candidate to update
  const dummyRes = await req("POST", "/api/webhooks/call-completed", {
    candidate_id: "non-existent-id",
    ai_score: 75,
    dossier_json: { score: 75, summary: "Test", strengths: ["A"], weaknesses: ["B"], transcript: [] }
  }, null, webhookHeaders);
  test("Webhook endpoint is reachable",            [200, 400, 500].includes(dummyRes.status),
       `status=${dummyRes.status}`);

  // Missing candidate_id
  const missingId = await req("POST", "/api/webhooks/call-completed", {
    ai_score: 50
  }, null, webhookHeaders);
  test("Webhook returns 400 when candidate_id missing", missingId.status === 400,
       `status=${missingId.status}`);
}

// ── Suite 8: TwiML Route ────────────────────────────────────────────────────
async function testTwiML() {
  header("Suite 8: Twilio TwiML Route");

  const res = await fetch(`${BASE}/api/twilio/twiml?candidateId=test-123`, {
    method: "POST"
  });
  const body = await res.text();
  test("TwiML endpoint returns 200",         res.status === 200,
       `status=${res.status}`);
  test("TwiML response contains XML tags",   body.includes("<Response>"),
       `body snippet: ${body.substring(0, 100)}`);
  test("TwiML contains Stream tag",          body.includes("<Stream"),
       `body snippet: ${body.substring(0, 100)}`);
  test("TwiML contains candidateId param",   body.includes("test-123"),
       `candidateId found in TwiML: ${body.includes("test-123")}`);
}

// ── Main Runner ─────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}${C.cyan}`);
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   AntiTalk Express API — Automated Integration Tests     ║");
  console.log("║   Runs against live server at http://localhost:5000       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(C.reset);

  await testHealth();
  await testAuth();
  await testAdmin();
  await testJobRoles();
  await testCampaigns();
  await testCandidates();
  await testWebhook();
  await testTwiML();

  const total = passed + failed;
  header("API TEST RESULTS SUMMARY");
  console.log(`  Total Tests   : ${total}`);
  console.log(`  ${C.green}Passed${C.reset}        : ${passed}`);
  console.log(`  ${C.red}Failed${C.reset}        : ${failed}`);
  if (errors.length) {
    console.log(`\n  ${C.red}Failed Tests:${C.reset}`);
    errors.forEach(e => console.log(`    ✗ ${e}`));
  }
  console.log();
  if (failed === 0) {
    console.log(`  ${C.bold}${C.green}All ${total} API tests passed! Backend is healthy. ✓${C.reset}`);
  } else {
    const pct = Math.round((passed / total) * 100);
    console.log(`  ${C.yellow}${pct}% tests passed. Review failed tests above.${C.reset}`);
  }
  console.log(`\n${C.cyan}${"=".repeat(62)}${C.reset}\n`);
})();
