import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");

async function loadDB() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return {
      user: null as any,
      jobs: [
        {
          id: '1',
          title: 'Senior Frontend Engineer',
          company: 'TechFlow',
          description: 'Looking for a React expert with 5+ years of experience in high-performance web apps. Deep knowledge of TypeScript, Tailwind, and Vite is required.',
          requirements: ['React', 'TypeScript', 'Tailwind', 'Performance Optimization'],
          createdAt: Date.now() - 86400000 * 2,
        },
        {
          id: '2',
          title: 'AI Product Manager',
          company: 'DeepLogic',
          description: 'Help us define the future of LLM-powered interfaces. Requires 3+ years experience in AI/ML products and strong technical background.',
          requirements: ['LLMs', 'Roadmapping', 'User Research', 'Python'],
          createdAt: Date.now() - 86400000 * 5,
        }
      ],
      candidates: [
        {
          id: 'c1',
          jobId: '1',
          name: 'Sarah Chen',
          email: 'sarah.c@example.com',
          resumeText: 'Senior React Developer with 8 years of experience. Expert in building scalable design systems and high-performance dashboards.',
          status: 'Accepted',
          score: 94,
          scoreBreakdown: { skills: 98, experience: 90, education: 85 },
          feedback: 'Exceptional technical depth.',
          analyzedAt: Date.now() - 3600000,
          interviewStatus: 'Not Scheduled'
        }
      ] as any[]
    };
  }
}

async function saveDB(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const db = await loadDB();

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.patch("/api/candidates/:id/trash", async (req, res) => {
    const { id } = req.params;
    const cand = db.candidates.find((c: any) => c.id === id);
    if (!cand) return res.status(404).json({ error: "Not found" });
    cand.isDeleted = true;
    cand.deletedAt = Date.now();
    await saveDB(db);
    res.json(cand);
  });

  app.patch("/api/candidates/:id/restore", async (req, res) => {
    const { id } = req.params;
    const cand = db.candidates.find((c: any) => c.id === id);
    if (!cand) return res.status(404).json({ error: "Not found" });
    cand.isDeleted = false;
    cand.deletedAt = null;
    await saveDB(db);
    res.json(cand);
  });

  app.delete("/api/candidates/:id/permanent", async (req, res) => {
    const { id } = req.params;
    db.candidates = db.candidates.filter((c: any) => c.id !== id);
    await saveDB(db);
    res.status(204).end();
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password, designation } = req.body;
    if (email && password) {
      db.user = { email, designation, name: email.split('@')[0] };
      await saveDB(db);
      res.json(db.user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    res.json(db.user);
  });

  app.post("/api/auth/logout", async (req, res) => {
    db.user = null;
    await saveDB(db);
    res.status(204).end();
  });

  app.post("/api/candidates/:id/propose-slots", async (req, res) => {
    const { id } = req.params;
    const { slots } = req.body;
    const cand = db.candidates.find((c: any) => c.id === id);
    if (!cand) return res.status(404).json({ error: "Candidate not found" });
    cand.proposedSlots = slots;
    cand.interviewStatus = 'Pending Selection';
    cand.slotsProposedAt = Date.now();
    await saveDB(db);
    console.log(`[EMAIL] To: ${cand.email} | Link: /select-slot/${id}`);
    res.json({ message: "Slots proposed", candidate: cand });
  });

  app.post("/api/candidates/:id/select-slot", async (req, res) => {
    const { id } = req.params;
    const { slot } = req.body;
    const cand = db.candidates.find((c: any) => c.id === id);
    if (!cand) return res.status(404).json({ error: "Candidate not found" });
    cand.scheduledSlot = slot;
    cand.interviewStatus = 'Scheduled';
    await saveDB(db);
    res.json({ message: "Slot selected", candidate: cand });
  });

  app.post("/api/candidates/:id/share", async (req, res) => {
    const { id } = req.params;
    const { recipientEmail } = req.body;
    const cand = db.candidates.find((c: any) => c.id === id);
    if (!cand) return res.status(404).json({ error: "Candidate not found" });
    console.log(`[SHARE] To: ${recipientEmail} | Profile: ${cand.name}`);
    res.json({ message: "Profile shared" });
  });

  app.get("/api/jobs", (req, res) => res.json(db.jobs));

  app.post("/api/jobs", async (req, res) => {
    const newJob = { ...req.body, id: crypto.randomBytes(4).toString("hex"), createdAt: Date.now() };
    db.jobs.push(newJob);
    await saveDB(db);
    res.json(newJob);
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    db.jobs = db.jobs.filter((j: any) => j.id !== req.params.id);
    db.candidates = db.candidates.filter((c: any) => c.jobId !== req.params.id);
    await saveDB(db);
    res.status(204).end();
  });

  app.get("/api/candidates", (req, res) => res.json(db.candidates));

  app.patch("/api/candidates/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const cand = db.candidates.find((c: any) => c.id === id);
    if (!cand) return res.status(404).json({ error: "Not found" });
    cand.status = status;
    await saveDB(db);
    res.json(cand);
  });

  app.post("/api/apply/:jobId", async (req, res) => {
    const job = db.jobs.find((j: any) => j.id === req.params.jobId);
    if (!job) return res.status(404).end();
    const analysis = await analyzeCandidate(ai, job, req.body);
    const newCandidate = { id: crypto.randomBytes(4).toString("hex"), jobId: req.params.jobId, ...req.body, ...analysis, analyzedAt: Date.now() };
    db.candidates.push(newCandidate);
    await saveDB(db);
    res.status(201).json(newCandidate);
  });

  app.delete("/api/candidates/:id", async (req, res) => {
    db.candidates = db.candidates.filter((c: any) => c.id !== req.params.id);
    await saveDB(db);
    res.status(204).end();
  });

  // Maintenance Check
  setInterval(() => {
    const now = Date.now();
    db.candidates.forEach((cand: any) => {
      if (cand.interviewStatus === 'Pending Selection' && cand.slotsProposedAt) {
        if (now - cand.slotsProposedAt > 24 * 60 * 60 * 1000) {
          console.log(`[RE-REMINDER] To: ${cand.email}`);
        }
      }
    });
  }, 1000 * 60 * 60);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartATS Server running at http://0.0.0.0:${PORT}`);
  });
}

async function analyzeCandidate(ai: any, job: any, candidateData: { name: string, email: string, resumeText: string }) {
  const prompt = `
    Analyze resume for ${job.title}. 
    JD: ${job.description}
    Resume: ${candidateData.resumeText}
    Return JSON: { status: 'Accepted'|'Rejected'|'Review', score: 0-100, scoreBreakdown: { skills, experience, education }, feedback: string }
  `;

  try {
    const response = await ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" }).generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["Accepted", "Rejected", "Review"] },
            score: { type: Type.NUMBER },
            scoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                skills: { type: Type.NUMBER },
                experience: { type: Type.NUMBER },
                education: { type: Type.NUMBER },
              },
            },
            feedback: { type: Type.STRING },
          },
        },
      },
    });
    return JSON.parse(response.response.text());
  } catch (error) {
    console.error("AI FAIL:", error);
    return { status: "Review", score: 0, scoreBreakdown: { skills: 0, experience: 0, education: 0 }, feedback: "Fail" };
  }
}

startServer();
