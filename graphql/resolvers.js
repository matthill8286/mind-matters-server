import Stripe from "stripe";
import fetch from "node-fetch";
import GraphQLJSON from "graphql-type-json";

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    hello: () => "Hello from GraphQL!",
    moodCheckIns: () => [],
    journalEntries: () => [],
    stressKit: () => null,
    stressHistory: () => [],
    assessment: () => null,
    profile: () => null,
    subscription: () => null,
    chatMessages: () => [],
    sleepEntries: () => [],
    mindfulness: () => ({ totalMinutesToday: 0 }),
    mindfulnessHistory: () => [],
    getAllData: () => ({
      moodCheckIns: [],
      journalEntries: [],
      stressKit: null,
      stressHistory: [],
      assessment: null,
      profile: null,
      subscription: null,
      sleepEntries: [],
      mindfulness: { totalMinutesToday: 0 },
    }),
  },
  Mutation: {
    chat: async (_, { issueTitle, issueTags, messages }) => {
      try {
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
          throw new Error(errText);
        }

        const data = await resp.json();
        const outputText =
          data.output_text ??
          data.output?.find((it) => it.type === "message")?.content?.[0]?.text ??
          "Sorry — I couldn’t generate a response.";

        return { text: outputText };
      } catch (e) {
        throw new Error(String(e));
      }
    },
    createCheckoutSession: async (_, { mode, price_data, currency }) => {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        const sessionData = {
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                  name: price_data.name,
                },
                unit_amount: price_data.unit_amount,
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
        return { url: session.url };
      } catch (e) {
        throw new Error(String(e));
      }
    },
    addMoodCheckIn: (_, { input }) => ({
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...input,
    }),
    deleteMoodCheckIn: () => true,
    upsertJournalEntry: (_, { input }) => ({
      id: input.id || Math.random().toString(36).substr(2, 9),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    }),
    deleteJournalEntry: () => true,
    updateStressKit: (_, { input }) => ({
      ...input,
      exercises: input.exercises || [],
    }),
    addStressCompletion: (_, { exerciseId, title }) => ({
      date: new Date().toISOString(),
      exerciseId,
      title,
    }),
    setAssessment: () => true,
    setProfile: () => true,
    setSubscription: (_, { input }) => ({
      type: input.type,
      expiryDate: input.expiryDate,
    }),
    sendMessage: (_, { issueKey, text }) => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      role: "user",
      createdAt: new Date().toISOString(),
    }),
    clearChat: () => true,
    addSleepEntry: (_, { input }) => ({
      id: Math.random().toString(36).substr(2, 9),
      ...input,
    }),
    deleteSleepEntry: () => true,
    addMindfulMinutes: (_, { minutes }) => ({
      totalMinutesToday: minutes,
    }),
  },
};
