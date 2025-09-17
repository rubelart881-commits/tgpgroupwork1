// আসল Firebase-এর মডিউলগুলো ইম্পোর্ট করা হচ্ছে
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  Database,
  Unsubscribe
} from "firebase/database";

// Vercel-এর Environment Variable থেকে Firebase কনফিগারেশন নেওয়া হচ্ছে
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase অ্যাপ ও ডেটাবেস ভেরিয়েবল
let app: FirebaseApp;
let database: Database;

// Firebase শুরু করার ফাংশন
function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  }
}

// এই ফাংশনটি নিশ্চিত করবে যে ডেটাবেস কানেকশন তৈরি হয়েছে
function getDbInstance(): Database {
    if (!database) {
        initializeFirebase();
    }
    return database;
}

// ডেটা টাইপগুলো (এগুলো তোমার আগের কোড থেকেই নেওয়া)
export interface MemberData {
  nickname: string;
  streak: number;
}

export interface ScoreEntry {
  score: number;
  note: string;
}

export interface ScoreData {
  [subject: string]: ScoreEntry;
}

export interface SessionData {
  members: Record<string, MemberData>;
  scores: Record<string, Record<string, ScoreData>>;
}

// আসল Firebase ব্যবহার করে নতুন সেশন তৈরি করা
export async function createSession(): Promise<string> {
  const db = getDbInstance();
  const sessionCode = generateSessionCode();
  const sessionRef = ref(db, `sessions/${sessionCode}`);
  
  await set(sessionRef, {
    members: {},
    scores: {},
  });

  return sessionCode;
}

// আসল Firebase ব্যবহার করে সেশনে জয়েন করা
export async function joinSession(sessionCode: string, userId: string, nickname: string): Promise<boolean> {
  const db = getDbInstance();
  const sessionRef = ref(db, `sessions/${sessionCode}`);
  const snapshot = await get(sessionRef);

  if (!snapshot.exists()) {
    throw new Error("Session code not found.");
  }

  const memberRef = ref(db, `sessions/${sessionCode}/members/${userId}`);
  await set(memberRef, {
    nickname,
    streak: 0,
  });
  return true;
}

// আসল Firebase থেকে লাইভ সেশন ডেটা শোনা
export function listenToSession(sessionCode: string, callback: (data: SessionData | null) => void): Unsubscribe {
  const db = getDbInstance();
  const sessionRef = ref(db, `sessions/${sessionCode}`);
  
  return onValue(sessionRef, (snapshot) => {
    const data = snapshot.val() as SessionData | null;
    callback(data);
  });
}

// আসল Firebase-এ স্কোর আপডেট করা
export async function updateScore(
  sessionCode: string,
  userId: string,
  scores: Record<string, number>,
  notes: Record<string, string>,
): Promise<void> {
  const db = getDbInstance();
  const today = new Date().toISOString().split("T")[0];

  const scoreData: ScoreData = {};
  Object.keys(scores).forEach(subject => {
    scoreData[subject] = {
      score: scores[subject],
      note: notes[subject] || "",
    };
  });
  
  const scoreRef = ref(db, `sessions/${sessionCode}/scores/${userId}/${today}`);
  await set(scoreRef, scoreData);

  // Streak calculation could be added here if needed, or handled client-side
}

// আজকের স্কোর ডেটা পাওয়া
export async function getTodayScores(sessionCode: string, userId: string): Promise<ScoreData> {
  const db = getDbInstance();
  const today = new Date().toISOString().split("T")[0];
  const scoresRef = ref(db, `sessions/${sessionCode}/scores/${userId}/${today}`);
  
  const snapshot = await get(scoresRef);
  return snapshot.val() || {};
}


// সেশন কোড জেনারেট করার ফাংশন
function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // O and 0 are removed to avoid confusion
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
