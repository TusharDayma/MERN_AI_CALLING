import prisma from '../config/db.js';

// @desc Get HR Metrics
// @route GET /api/hr/metrics
// @access Private (HR)
export const getHRMetrics = async (req, res) => {
  try {
    const hrId = req.user.id;
    const totalCampaigns = await prisma.campaign.count({ where: { created_by_hr_id: hrId } });
    const activeCampaigns = await prisma.campaign.count({ where: { created_by_hr_id: hrId, status: 'ACTIVE' } });
    
    // Total candidates screened
    const screenedCandidates = await prisma.candidate.count({
      where: { campaign: { created_by_hr_id: hrId }, status: 'SCREENED' }
    });

    res.status(200).json({ totalCampaigns, activeCampaigns, screenedCandidates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HR metrics' });
  }
};

// @desc Get Job Roles
// @route GET /api/hr/job-roles
// @access Private (HR)
export const getJobRoles = async (req, res) => {
  try {
    const roles = await prisma.jobRole.findMany({
      orderBy: { title: 'asc' }
    });
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job roles' });
  }
};

// @desc Create Job Role
// @route POST /api/hr/job-roles
// @access Private (HR)
export const createJobRole = async (req, res) => {
  try {
    const { title, department, description } = req.body;
    const role = await prisma.jobRole.create({
      data: {
        title,
        department,
        description,
        created_by: req.user.id
      }
    });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job role' });
  }
};

// @desc Create Campaign
// @route POST /api/hr/campaigns
// @access Private (HR)
export const createCampaign = async (req, res) => {
  try {
    const { name, location, job_role_id } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        name,
        location,
        job_role_id,
        created_by_hr_id: req.user.id
      }
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

// @desc Add Candidates to Campaign (Handles manual & CSV data sent from frontend)
// @route POST /api/hr/campaigns/:id/candidates
// @access Private (HR)
export const addCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidates } = req.body; // Array of candidate objects parsed from CSV or manually added

    const created = await prisma.candidate.createMany({
      data: candidates.map(c => ({
        name: (c.name || '').trim(),
        email: (c.email || '').trim().toLowerCase(),
        contact: (c.contact || '').trim(),
        emp_details: (c.emp_details || '').trim(),
        campaign_id: id
      }))
    });

    res.status(201).json({ message: `${created.count} candidates imported successfully.` });
  } catch (err) {
    console.error('Add candidates error:', err);
    res.status(500).json({ error: 'Failed to import candidates' });
  }
};


// @desc Launch Campaign (Trigger Twilio AntiGravity calls)
// @route POST /api/hr/campaigns/:id/launch
// @access Private (HR)
import twilio from 'twilio';

export const launchCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Set campaign status to ACTIVE
    await prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // Fetch candidates
    const candidates = await prisma.candidate.findMany({ where: { campaign_id: id } });

    console.log(`[AntiGravity Engine] Launching campaign ${id}...`);
    
    // Twilio Dry Run Check
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const isDryRun = !accountSid || !authToken || accountSid.includes('placeholder') || accountSid.includes('your_twilio') || accountSid.includes('here');

    
    let twilioClient = null;
    if (!isDryRun) {
      twilioClient = twilio(accountSid, authToken);
    }

    for (const candidate of candidates) {
      if (isDryRun) {
        console.log(`[Twilio Dry Run] Simulating AI call to ${candidate.name} at ${candidate.contact}`);
        // In dry run, we just mark as SCREENED for demonstration
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { status: 'SCREENED' }
        });
      } else {
        console.log(`[Twilio] Initiating AI call to ${candidate.name} at ${candidate.contact}...`);
        // Public URL of the Express server that serves TwiML
        const twimlUrl = `${process.env.EXPRESS_PUBLIC_URL}/api/twilio/twiml?candidateId=${candidate.id}`;
        try {
          await twilioClient.calls.create({
            url: twimlUrl,
            to: candidate.contact,
            from: fromPhone
          });
        } catch (e) {
          console.error(`Twilio Error calling ${candidate.contact}:`, e);
        }
      }
    }

    res.status(200).json({ message: 'Campaign launched and calls initiated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
};

// @desc Get Candidates (Ranking view)
// @route GET /api/hr/candidates
// @access Private (HR)
export const getCandidatesRanking = async (req, res) => {
  try {
    const hrId = req.user.id;

    // Get all completed candidates for campaigns owned by this HR
    const candidates = await prisma.candidate.findMany({
      where: {
        status: 'COMPLETED',
        campaign: {
          created_by_hr_id: hrId
        }
      },
      include: {
        campaign: {
          include: {
            jobRole: true
          }
        }
      },
      orderBy: {
        ai_score: 'desc'
      }
    });

    // Parse dossier_json for SQLite which stored it as String
    const formatted = candidates.map(c => {
      let dossier = null;
      if (c.dossier_json) {
        try {
          dossier = typeof c.dossier_json === 'string' ? JSON.parse(c.dossier_json) : c.dossier_json;
        } catch (e) {
          console.error('Failed to parse dossier JSON', e);
        }
      }
      return {
        ...c,
        dossier_json: dossier
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch candidate rankings' });
  }
};

// @desc Get all campaigns for the logged-in HR
// @route GET /api/hr/campaigns
// @access Private (HR only)
export const getCampaigns = async (req, res) => {
  try {
    const hrId = req.user.id;
    const campaigns = await prisma.campaign.findMany({
      where: { created_by_hr_id: hrId },
      include: {
        jobRole: true,
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

// @desc Get campaign details and its candidates
// @route GET /api/hr/campaigns/:id
// @access Private (HR only)
export const getCampaignDetails = async (req, res) => {
  try {
    const hrId = req.user.id;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: { 
        id, 
        created_by_hr_id: hrId 
      },
      include: {
        jobRole: true,
        candidates: {
          orderBy: { ai_score: 'desc' }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Parse dossier JSON
    campaign.candidates = campaign.candidates.map(c => {
      let dossier = null;
      if (c.dossier_json) {
        try {
          dossier = typeof c.dossier_json === 'string' ? JSON.parse(c.dossier_json) : c.dossier_json;
        } catch (e) { }
      }
      return { ...c, dossier_json: dossier };
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
};

// @desc Toggle Campaign Status (ACTIVE <-> PAUSED)
// @route PATCH /api/hr/campaigns/:id/status
// @access Private (HR only)
export const toggleCampaignStatus = async (req, res) => {
  try {
    const hrId = req.user.id;
    const { id } = req.params;
    const { status } = req.body; // Expecting ACTIVE, PAUSED, etc.

    const campaign = await prisma.campaign.findFirst({
      where: { id, created_by_hr_id: hrId }
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
};

// @desc Delete Campaign and its associated candidates & questions
// @route DELETE /api/hr/campaigns/:id
// @access Private (HR only)
export const deleteCampaign = async (req, res) => {
  try {
    const hrId = req.user.id;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, created_by_hr_id: hrId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Delete associated candidates, questions, and campaign in a transaction
    await prisma.$transaction([
      prisma.candidate.deleteMany({ where: { campaign_id: id } }),
      prisma.question.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign.delete({ where: { id } })
    ]);

    res.status(200).json({ message: 'Campaign and associated data deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

// @desc Save Pre-Screening Questions for a Campaign
// @route POST /api/hr/campaigns/:id/questions
// @access Private (HR only)
export const addQuestions = async (req, res) => {
  try {
    const hrId = req.user.id;
    const { id } = req.params;
    const { questions } = req.body;

    // Verify campaign belongs to this HR
    const campaign = await prisma.campaign.findFirst({
      where: { id, created_by_hr_id: hrId }
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Replace existing questions (idempotent)
    await prisma.question.deleteMany({ where: { campaign_id: id } });

    const validQuestions = (questions || []).filter(q => q.text?.trim());

    if (validQuestions.length > 0) {
      await prisma.question.createMany({
        data: validQuestions.map(q => ({
          campaign_id: id,
          text:            q.text.trim(),
          type:            q.category || 'Pre-Screening',
          level:           'MEDIUM',
          key_criteria:    q.key_criteria?.trim()    || null,
          expected_answer: q.expected_answer?.trim() || null,
        }))
      });
    }

    res.status(201).json({ message: `${validQuestions.length} questions saved successfully.` });
  } catch (err) {
    console.error('Save questions error:', err);
    res.status(500).json({ error: 'Failed to save questions' });
  }
};
