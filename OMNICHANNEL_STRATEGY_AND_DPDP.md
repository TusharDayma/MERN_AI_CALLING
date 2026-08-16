# Omnichannel AI Recruitment Strategy & DPDP Compliance

This document outlines the most effective real-world strategy for maximizing candidate reach and data collection, while maintaining strict compliance with India's Digital Personal Data Protection (DPDP) Act.

---

## 1. The Core Challenge
In modern recruitment, standard communication channels are failing:
- **Emails** have a ~20% open rate (often lost in spam).
- **Direct Phone Calls** from unknown numbers are increasingly blocked or ignored due to spam filters like Truecaller.
- **Forcing App Downloads** creates too much friction, causing candidates to drop off.

**The Solution:** An Omnichannel Fallback Strategy that prioritizes convenience and consent.

---

## 2. The Omnichannel Strategy: Parallel Messaging with Last-Resort Calling

To guarantee the highest possible conversion rate and minimal telecom cost, the system utilizes a high-throughput **Parallel Outreach** architecture:

### Step 1: Parallel Omnichannel Dispatch (Email + WhatsApp)
*   **The Action:** Upon campaign launch or outreach dispatch, the system simultaneously delivers personalized messages across **both Email and WhatsApp in parallel**:
    *   **Email Invitation:** Formatted HTML invite with role details, DPDP Section 12 notice, and direct 1-click **Magic Screening Link**.
    *   **WhatsApp Hook:** Instant conversational message with quick response options (`[YES]`, `[NO]`, `[DELETE]`).
*   **Why use this?** Parallel dispatch guarantees multi-device reach. Candidates who check email on desktop and candidates who live on WhatsApp on mobile are both contacted instantaneously without delay.

### Step 2: The Data Collection (Magic Web Screening Link)
*   **The Action:** The candidate clicks the Magic Link (from either Email or WhatsApp) to launch a secure, browser-based 3-minute AI voice screening session.
*   **Why use this?** Conducting voice screening in the browser over WebRTC eliminates telecom billing costs and gives candidates the flexibility to interview on their own schedule (e.g., at 10 PM) in a quiet environment.

### Step 3: Last-Resort Safety Net (Automated Voice Calls)
*   **The Action:** Telephony voice calls (via Exotel) are strictly reserved as a **LAST RESORT**. If and only if a candidate ignores **BOTH** Email and WhatsApp invitations for longer than the timeout period (e.g. 24 hours), the background scheduler dispatches an automated voice call.
*   **Guardrails:** Calling hours window (9:00 AM – 7:00 PM IST) and max retry attempts (`MAX_CALL_ATTEMPTS = 2`) prevent spamming and maintain compliance.

---

## 3. Benefits of this Architecture

1. **Maximum Conversion via Parallel Delivery:** Zero latency between email and WhatsApp outreach.
2. **Cost Optimization:** Web voice screening avoids telecom expenses. Telecom voice calls are only triggered for the small fraction of candidates who ignore both digital channels.
3. **Candidate Experience & Quality:** Candidates are not ambushed by unknown incoming calls; they choose when to complete their screening.

---

## 4. Integration with the DPDP Act (2023)

India's **Digital Personal Data Protection (DPDP) Act** mandates strict rules for how personal data (including voice recordings and interview transcripts) is collected, processed, and stored. 

This Omnichannel strategy is uniquely suited to easily integrate DPDP compliance directly into the user flow:

### A. Notice and Explicit Consent
Under the DPDP Act, you cannot process data without clear consent. 
*   **Integration:** Before sending the "Magic Link" or starting the interview, the initial WhatsApp interaction acts as your consent gateway. 
*   **Example Flow:** *"To proceed with the interview, we will record your responses for evaluation by our HR team in accordance with our Privacy Policy. Do you consent?"* `[I Consent]` `[I Decline]`
*   **Benefit:** Consent is explicitly recorded in the database against the candidate's profile *before* any voice data is captured.

### B. Purpose Limitation & Data Minimization
You must clearly state why you are collecting data and only use it for that purpose.
*   **Integration:** The Magic Web Link landing page will display a brief, plain-English notice stating: *"Your audio responses are used exclusively for evaluating your fit for the [Role] position and will not be shared with third parties."*

### C. Right to Erasure (Right to be Forgotten)
Candidates have the right to request the deletion of their personal data.
*   **Integration:** Because WhatsApp is a two-way channel, you can easily build an automated command. If a candidate ever replies with the word **"DELETE"**, the system can automatically scrub their PII (Personally Identifiable Information), voice records, and transcripts from your MongoDB database, ensuring instant compliance without manual HR intervention.

### D. Data Localization
*   **Integration:** Ensure that the MongoDB database and the AI processing instances (like the Python FastAPI server) are hosted in Indian data centers (e.g., AWS `ap-south-1` Mumbai) to comply with any future localization requirements for sensitive candidate profiles.
