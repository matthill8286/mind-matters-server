// @ts-nocheck
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import FormData from "form-data";
import Stripe from "stripe";
import fetch from "node-fetch";
import { Request } from "express-serve-static-core";
import {prisma} from "./lib/prisma";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper to get userId (in a real app, this would come from JWT/Session)
const getUserId = (req: Request<{}, any, any, Record<string, any>>) => req.headers['x-user-id'] || 'default-user';

app.use(cors());
app.use(express.json());

// 3.1 User Profile & Assessment
app.get("/profile", async (req, res) => {
  const userId = getUserId(req);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  res.json(profile?.data || {});
});

app.post("/profile", async (req, res) => {
  const userId = getUserId(req);
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      data: req.body,
    },
    create: {
      userId,
      data: req.body,
    },
  });
  res.json(profile.data);
});

app.put("/profile", async (req, res) => {
  const userId = getUserId(req);
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      data: req.body,
    },
    create: {
      userId,
      data: req.body,
    },
  });
  res.json(profile.data);
});

app.get("/assessment", async (req, res) => {
  const userId = getUserId(req);
  const assessment = await prisma.assessment.findUnique({ where: { userId } });
  res.json(assessment?.data || {});
});

app.post("/assessment", async (req, res) => {
  const userId = getUserId(req);
  await prisma.assessment.upsert({
    where: { userId },
    update: { data: req.body },
    create: { userId, data: req.body },
  });
  res.json({ success: true });
});

// 3.2 Activity Tracking
// Mood
app.get("/mood", async (req, res) => {
  const userId = getUserId(req);
  const moods = await prisma.mood.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(moods.map(m => ({ id: m.id, createdAt: m.createdAt, ...m.data })));
});

app.post("/mood", async (req, res) => {
  const userId = getUserId(req);
  const mood = await prisma.mood.create({
    data: {
      userId,
      data: req.body
    }
  });
  res.json({ id: mood.id, createdAt: mood.createdAt, ...(mood.data ?? {}) });
});

app.delete("/mood/:id", async (req, res) => {
  const userId = getUserId(req);
  try {
    await prisma.mood.delete({
      where: { id: req.params.id, userId }
    });
    res.sendStatus(204);
  } catch (e) {
    res.sendStatus(404);
  }
});

// Journaling
app.get("/journal", async (req, res) => {
  const userId = getUserId(req);
  const journals = await prisma.journal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(journals.map(j => ({ id: j.id, createdAt: j.createdAt, updatedAt: j.updatedAt, ...j.data })));
});

app.post("/journal", async (req, res) => {
  const userId = getUserId(req);
  const journal = await prisma.journal.create({
    data: {
      userId,
      data: req.body
    }
  });
  res.json({ id: journal.id, createdAt: journal.createdAt, updatedAt: journal.updatedAt, ...journal.data });
});

app.put("/journal/:id", async (req, res) => {
  const userId = getUserId(req);
  try {
    const journal = await prisma.journal.update({
      where: { id: req.params.id, userId },
      data: { data: req.body }
    });
    res.json({ id: journal.id, createdAt: journal.createdAt, updatedAt: journal.updatedAt, ...journal.data });
  } catch (e) {
    res.status(404).json({ error: "Journal entry not found" });
  }
});

app.delete("/journal/:id", async (req, res) => {
  const userId = getUserId(req);
  try {
    await prisma.journal.delete({
      where: { id: req.params.id, userId }
    });
    res.sendStatus(204);
  } catch (e) {
    res.sendStatus(404);
  }
});

// Stress Management
app.get("/stress/kit", async (req, res) => {
  const userId = getUserId(req);
  const kit = await prisma.stressKit.findUnique({ where: { userId } });
  const defaultKit = { triggers: [], helpfulActions: [], people: [] };
  res.json(kit?.data || defaultKit);
});

app.put("/stress/kit", async (req, res) => {
  const userId = getUserId(req);
  const kit = await prisma.stressKit.upsert({
    where: { userId },
    update: { data: req.body },
    create: { userId, data: req.body }
  });
  res.json(kit.data);
});

app.get("/stress/history", async (req, res) => {
  const userId = getUserId(req);
  const history = await prisma.stressHistory.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });
  res.json(history.map(h => ({ ...h.data, date: h.date })));
});

app.post("/stress/history", async (req, res) => {
  const userId = getUserId(req);
  const entry = await prisma.stressHistory.create({
    data: {
      userId,
      data: req.body
    }
  });
  res.json({ ...entry.data, date: entry.date });
});

// Mindfulness
app.get("/mindfulness", async (req, res) => {
  const userId = getUserId(req);
  const mindfulness = await prisma.mindfulness.findMany({
    where: { userId },
    orderBy: { dateISO: 'desc' }
  });
  res.json(mindfulness.map(m => ({ id: m.id, dateISO: m.dateISO, ...m.data })));
});

app.post("/mindfulness", async (req, res) => {
  const userId = getUserId(req);
  const entry = await prisma.mindfulness.create({
    data: {
      userId,
      data: req.body
    }
  });
  res.json({ id: entry.id, dateISO: entry.dateISO, ...entry.data });
});

// Sleep
app.get("/sleep", async (req, res) => {
  const userId = getUserId(req);
  const sleep = await prisma.sleep.findMany({
    where: { userId },
    orderBy: { createdAtISO: 'desc' }
  });
  res.json(sleep.map(s => ({ id: s.id, createdAtISO: s.createdAtISO, ...s.data })));
});

app.post("/sleep", async (req, res) => {
  const userId = getUserId(req);
  const entry = await prisma.sleep.create({
    data: {
      userId,
      data: req.body
    }
  });
  res.json({ id: entry.id, createdAtISO: entry.createdAtISO, ...entry.data });
});

app.delete("/sleep/:id", async (req, res) => {
  const userId = getUserId(req);
  try {
    await prisma.sleep.delete({
      where: { id: req.params.id, userId }
    });
    res.sendStatus(204);
  } catch (e) {
    res.sendStatus(404);
  }
});

// 3.3 Chat History Management
app.get("/chat/history/:issueKey", async (req, res) => {
  const userId = getUserId(req);
  const { issueKey } = req.params;
  const history = await prisma.chatHistory.findFirst({
    where: { userId, issueKey }
  });
  res.json(history?.messages || []);
});

app.post("/chat/history/:issueKey", async (req, res) => {
  const userId = getUserId(req);
  const { issueKey } = req.params;
  const message = req.body;

  const existing = await prisma.chatHistory.findFirst({
    where: { userId, issueKey }
  });

  if (existing) {
    const updatedMessages = [...(existing.messages || []), message];
    await prisma.chatHistory.update({
      where: { id: existing.id },
      data: { messages: updatedMessages }
    });
  } else {
    await prisma.chatHistory.create({
      data: {
        userId,
        issueKey,
        messages: [message]
      }
    });
  }
  res.json(message);
});

app.delete("/chat/history/:issueKey", async (req, res) => {
  const userId = getUserId(req);
  const { issueKey } = req.params;
  await prisma.chatHistory.deleteMany({
    where: { userId, issueKey }
  });
  res.sendStatus(204);
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "audio.m4a",
      contentType: req.file.mimetype || "application/octet-stream",
    });
    form.append("model", "whisper-1");

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    res.json({ text: data.text ?? "" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { issueTitle, issueTags, messages } = req.body;

    if (!issueTitle || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const instructions = `
You are a supportive mental-health coaching assistant.
User selected: "${issueTitle}".
Relevant tags: ${Array.isArray(issueTags) ? issueTags.join(", ") : ""}

Provide practical, compassionate coping steps. Avoid diagnosis.
If self-harm intent is present, encourage immediate local emergency help / crisis resources.
`.trim();

    const formattedMessages = [
      { role: "system", content: instructions },
      ...messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: formattedMessages,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    const outputText =
      data.choices?.[0]?.message?.content ??
      "Sorry — I couldn’t generate a response.";

    res.json({ text: outputText });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { mode, price_data, currency } = req.body;

    if (!mode || !["payment", "subscription"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Use 'payment' or 'subscription'." });
    }

    if (!price_data || !price_data.unit_amount || !price_data.name) {
      return res.status(400).json({ error: "Missing required price_data (unit_amount, name)." });
    }

    if (!currency) {
      return res.status(400).json({ error: "Missing required currency." });
    }

    const sessionData = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: price_data.name,
            },
            unit_amount: price_data.unit_amount ?? 1,
          },
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    };

    if (mode === "subscription") {
      sessionData.line_items[0].price_data.recurring = { interval: "month" };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8787;
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export default app;
