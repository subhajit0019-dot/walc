import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "cursed_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "default_super_secret_auth_key_replace_in_env_32chars!";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  email: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

/**
 * Creates and signs a secure JWT session token
 */
export async function createSessionToken(email: string): Promise<string> {
  const secret = getSecretKey();
  return await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret);
}

/**
 * Verifies a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies admin credentials against environment configuration
 */
export async function verifyAdminCredentials(password: string): Promise<boolean> {
  const adminHash = process.env.ADMIN_PASSWORD_HASH || "CursedAdmin2026!";

  // Support direct secret password or bcrypt hash
  if (!adminHash.startsWith("$2a$") && !adminHash.startsWith("$2b$") && !adminHash.startsWith("$2y$")) {
    return password === adminHash;
  }

  return bcrypt.compare(password, adminHash);
}

/**
 * Reads and verifies the current session from Next.js server context
 */
export async function getCurrentAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifySessionToken(token);
}

/**
 * Verifies admin session from a NextRequest in middleware or route handler
 */
export async function verifyRequestAuth(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifySessionToken(token);
}
