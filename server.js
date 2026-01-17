import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import cors from "cors";
import multer from "multer";
import FormData from "form-data";
import Stripe from "stripe";
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import { print, parse } from "graphql";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.use(cors());

const yoga = createYoga({
  schema: makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: "/graphql",
});

app.use(yoga.graphqlEndpoint, yoga);

app.get("/graphql/schema", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(print(parse(typeDefs)));
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

app.post("/chat", express.json(), async (req, res) => {
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

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        instructions,
        input: messages,
        store: false,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    const outputText =
      data.output_text ??
      data.output?.find((it) => it.type === "message")?.content?.[0]?.text ??
      "Sorry — I couldn’t generate a response.";

    res.json({ text: outputText });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/create-checkout-session", express.json(), async (req, res) => {
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
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

export default app;
