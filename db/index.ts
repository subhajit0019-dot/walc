import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Global in-memory storage fallback
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: ReturnType<typeof drizzle> | undefined;
  // eslint-disable-next-line no-var
  var __memoryClients: Map<string, any> | undefined;
  // eslint-disable-next-line no-var
  var __memoryLogs: any[] | undefined;
}

export const memoryClients = global.__memoryClients || new Map<string, any>();
export const memoryLogs = global.__memoryLogs || [];

if (process.env.NODE_ENV !== "production") {
  global.__memoryClients = memoryClients;
  global.__memoryLogs = memoryLogs;
}

function createDatabaseConnection() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://placeholder:placeholder@ep-placeholder.us-east-1.aws.neon.tech/neondb?sslmode=require";

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = global.__dbInstance || createDatabaseConnection();

if (process.env.NODE_ENV !== "production") {
  global.__dbInstance = db;
}

let tablesInitialized = false;

/**
 * Automatically creates all required database tables if they do not exist
 */
export async function ensureTablesExist() {
  if (tablesInitialized) return;
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString || connectionString.includes("placeholder")) {
    return;
  }

  try {
    const sql = neon(connectionString);
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        exe_name TEXT NOT NULL DEFAULT 'Client.exe',
        cheat_name TEXT NOT NULL DEFAULT 'MeowGG',
        title_part1 TEXT NOT NULL DEFAULT 'Meow',
        title_part2 TEXT NOT NULL DEFAULT '.GG',
        window_title TEXT NOT NULL DEFAULT 'MeowGG',
        subtitle TEXT NOT NULL DEFAULT 'Dev : Subhajit | MeowGG',
        loading_text TEXT NOT NULL DEFAULT 'Connecting To DataBase',
        discord_invite_url TEXT NOT NULL DEFAULT 'https://discord.gg/meowgg',
        rpc_enabled BOOLEAN NOT NULL DEFAULT true,
        rpc_app_id TEXT NOT NULL DEFAULT '1561024986851057715',
        rpc_state TEXT NOT NULL DEFAULT 'MeowGG',
        rpc_details TEXT NOT NULL DEFAULT 'discord.gg/meowgg',
        rpc_large_image TEXT NOT NULL DEFAULT '',
        rpc_large_text TEXT NOT NULL DEFAULT 'MeowGG Community',
        rpc_small_image TEXT NOT NULL DEFAULT '',
        rpc_small_text TEXT NOT NULL DEFAULT 'Developer : Subhajit',
        rpc_button1_label TEXT NOT NULL DEFAULT '<3 Buying Here !',
        rpc_button1_url TEXT NOT NULL DEFAULT 'https://discord.gg/meowgg',
        rpc_button2_label TEXT NOT NULL DEFAULT 'Developer',
        rpc_button2_url TEXT NOT NULL DEFAULT 'https://discord.gg/meowgg',
        enable_auth BOOLEAN NOT NULL DEFAULT true,
        auth_name TEXT NOT NULL DEFAULT 'all free',
        auth_owner_id TEXT NOT NULL DEFAULT '29B4YqY38s',
        auth_secret TEXT NOT NULL DEFAULT '',
        auth_version TEXT NOT NULL DEFAULT '1.0',
        auth_url TEXT NOT NULL DEFAULT 'https://licenseauth.help/api/1.3/',
        auth_path TEXT DEFAULT '',
        enable_maintenance_check BOOLEAN NOT NULL DEFAULT true,
        maintenance_title TEXT NOT NULL DEFAULT 'Maintenance Notice',
        maintenance_text TEXT NOT NULL DEFAULT 'EXE Under Maintenance. Contact Owner.',
        client_secret TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS checkin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    tablesInitialized = true;
  } catch (err) {
    console.warn("Auto-create tables skipped/deferred:", err);
  }
}
