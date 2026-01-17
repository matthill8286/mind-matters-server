export const typeDefs = `
  scalar JSON

  type UserData {
    assessment: JSON
    profile: JSON
    subscription: Subscription
  }

  type Subscription {
    type: String # e.g., "free", "trial", "lifetime"
    expiryDate: String
  }

  type MoodCheckIn {
    id: ID!
    createdAt: String!
    mood: String! # Great, Good, Okay, Low, Bad
    energy: Int!   # 1-5
    stress: Int!   # 0-10
    note: String
    tags: [String]
  }

  type JournalEntry {
    id: ID!
    title: String
    content: String!
    createdAt: String!
    updatedAt: String!
    mood: String
    tags: [String]
  }

  type StressKit {
    level: Int
    lastCheckIn: String
    quickPhrase: String
    triggers: [String]
    helpfulActions: [String]
    people: [String]
    notes: String
    exercises: [StressExercise]
  }

  type StressExercise {
    id: ID!
    title: String!
    completed: Boolean!
  }

  type StressHistory {
    date: String!
    exerciseId: ID!
    title: String!
  }

  type SleepEntry {
    id: ID!
    date: String!
    quality: Int! # 1-5
    duration: Float! # Hours
    note: String
  }

  type Mindfulness {
    totalMinutesToday: Int!
  }

  type MindfulnessHistory {
    date: String!
    minutes: Int!
  }

  type ChatMessage {
    id: ID!
    text: String!
    role: String! # "user" or "assistant"
    createdAt: String!
  }

  type ChatResponse {
    text: String!
  }

  type CheckoutResponse {
    url: String!
  }

  input MessageInput {
    role: String!
    content: String!
  }

  input PriceDataInput {
    unit_amount: Int!
    name: String!
  }

  input MoodCheckInInput {
    id: ID
    createdAt: String
    mood: String!
    energy: Int!
    stress: Int!
    note: String
    tags: [String]
  }

  input JournalEntryInput {
    id: ID
    title: String
    content: String!
    createdAt: String
    updatedAt: String
    mood: String
    tags: [String]
  }

  input StressKitInput {
    level: Int
    lastCheckIn: String
    exercises: [StressExerciseInput]
  }

  input StressExerciseInput {
    id: ID!
    title: String!
    completed: Boolean!
  }

  input SleepEntryInput {
    date: String!
    quality: Int!
    duration: Float!
    note: String
  }

  input SubscriptionInput {
    type: String!
    expiryDate: String
  }

  type AllData {
    moodCheckIns: [MoodCheckIn]
    journalEntries: [JournalEntry]
    stressKit: StressKit
    stressHistory: [StressHistory]
    assessment: JSON
    profile: JSON
    subscription: Subscription
    sleepEntries: [SleepEntry]
    mindfulness: Mindfulness
  }

  type Query {
    hello: String
    moodCheckIns: [MoodCheckIn]!
    journalEntries: [JournalEntry]!
    stressKit: StressKit
    stressHistory: [StressHistory]!
    assessment: JSON
    profile: JSON
    subscription: Subscription
    chatMessages(issueKey: String!): [ChatMessage]!
    sleepEntries: [SleepEntry]!
    mindfulness: Mindfulness
    mindfulnessHistory: [MindfulnessHistory]!
    
    # Aggregate query used for hydration
    getAllData: AllData
  }

  type Mutation {
    chat(issueTitle: String!, issueTags: [String], messages: [MessageInput]!): ChatResponse
    createCheckoutSession(mode: String!, price_data: PriceDataInput!, currency: String!): CheckoutResponse
    
    # Mood
    addMoodCheckIn(input: MoodCheckInInput!): MoodCheckIn
    deleteMoodCheckIn(id: ID!): Boolean

    # Journal
    upsertJournalEntry(input: JournalEntryInput!): JournalEntry
    deleteJournalEntry(id: ID!): Boolean

    # Stress
    updateStressKit(input: StressKitInput!): StressKit
    addStressCompletion(exerciseId: ID!, title: String!): StressHistory

    # User Profile & Settings
    setAssessment(input: JSON!): Boolean
    setProfile(input: JSON!): Boolean
    setSubscription(input: SubscriptionInput!): Subscription

    # Chat
    sendMessage(issueKey: String!, text: String!): ChatMessage
    clearChat(issueKey: String!): Boolean

    # Sleep & Mindfulness
    addSleepEntry(input: SleepEntryInput!): SleepEntry
    deleteSleepEntry(id: ID!): Boolean
    addMindfulMinutes(minutes: Int!): Mindfulness
  }
`;
