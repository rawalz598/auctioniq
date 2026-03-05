// src/lib/authLocal.ts
// MVP local auth (browser-only). Later replace with Supabase Auth.

export type LocalUser = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

const USERS_KEY = "auctioniq_users_v1";
const SESSION_KEY = "auctioniq_session_v1";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const hashArray = Array.from(new Uint8Array(buf));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function loadUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessionEmail(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function setSessionEmail(email: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizeEmail(email) }));
}

export async function createUser(email: string, password: string) {
  const e = normalizeEmail(email);
  if (!e) throw new Error("Email is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const users = loadUsers();
  if (users.some((u) => u.email === e)) {
    throw new Error("That email already has an account. Please log in.");
  }

  const passwordHash = await sha256(password);
  const user: LocalUser = { email: e, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);

  // auto-login after sign up
  setSessionEmail(e);
  return user;
}

export async function loginUser(email: string, password: string) {
  const e = normalizeEmail(email);
  const users = loadUsers();
  const user = users.find((u) => u.email === e);
  if (!user) throw new Error("No account found for that email.");

  const passwordHash = await sha256(password);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Incorrect password.");
  }

  setSessionEmail(e);
  return user;
}
