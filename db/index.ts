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

if (memoryClients.size === 0) {
  const defaults = [
    {
      id: "dc59568d-4517-4ad8-9b88-82df72ef3125",
      name: "Premium Client 01",
      status: "active",
      exeName: "MeowGG66.exe",
      cheatName: "MeowGG",
      titlePart1: "Meow",
      titlePart2: ".GG",
      windowTitle: "MeowGG",
      subtitle: "Dev : Subhajit | MeowGG",
      loadingText: "Connecting To DataBase",
      discordInviteUrl: "https://discord.gg/meowgg",
      rpcEnabled: true,
      rpcAppId: "1561024986851057715",
      rpcState: "MeowGG",
      rpcDetails: "discord.gg/meowgg",
      rpcLargeImage:
        "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHVucnVxYmliMWF1NXoyYmd3YzhobTBvZmFtbXdwaHY4MzhxdGtidCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vas3wYC3KZ9AEo01xn/giphy.gif",
      rpcLargeText: "MeowGG Community",
      rpcSmallImage: "https://cdn3.emoji.gg/emojis/5863-verified-red-animated.gif",
      rpcSmallText: "Developer : Subhajit",
      rpcButton1Label: "<3 Buying Here !",
      rpcButton1Url: "https://discord.gg/meowgg",
      rpcButton2Label: "Developer",
      rpcButton2Url: "https://discord.gg/meowgg",
      enableAuth: true,
      authName: "all free",
      authOwnerId: "29B4YqY38s",
      authSecret: "12daef58c7848764da498a322f6a434f5543c51801df04a9642ce05729e20767",
      authVersion: "1.0",
      authUrl: "https://licenseauth.help/api/1.3/",
      authPath: "",
      enableMaintenanceCheck: true,
      maintenanceTitle: "Maintenance Notice",
      maintenanceText: "EXE Under Maintenance. Contact Owner.",
      clientSecret: "f6c8d28a3013b5d29931efb70295da9f6e07662cbfdb85a2104470081d58296a",
      expiresAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Subhajit",
      status: "active",
      exeName: "Subhajit.exe",
      cheatName: "MeowGG",
      titlePart1: "Meow",
      titlePart2: ".GG",
      windowTitle: "MeowGG",
      subtitle: "Dev : Subhajit | MeowGG",
      loadingText: "Connecting To DataBase",
      discordInviteUrl: "https://discord.gg/meowgg",
      rpcEnabled: true,
      rpcAppId: "1561024986851057715",
      rpcState: "MeowGG",
      rpcDetails: "discord.gg/meowgg",
      rpcLargeImage:
        "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHVucnVxYmliMWF1NXoyYmd3YzhobTBvZmFtbXdwaHY4MzhxdGtidCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vas3wYC3KZ9AEo01xn/giphy.gif",
      rpcLargeText: "MeowGG Community",
      rpcSmallImage: "https://cdn3.emoji.gg/emojis/5863-verified-red-animated.gif",
      rpcSmallText: "Developer : Subhajit",
      rpcButton1Label: "<3 Buying Here !",
      rpcButton1Url: "https://discord.gg/meowgg",
      rpcButton2Label: "Developer",
      rpcButton2Url: "https://discord.gg/meowgg",
      enableAuth: true,
      authName: "all free",
      authOwnerId: "29B4YqY38s",
      authSecret: "12daef58c7848764da498a322f6a434f5543c51801df04a9642ce05729e20767",
      authVersion: "1.0",
      authUrl: "https://licenseauth.help/api/1.3/",
      authPath: "",
      enableMaintenanceCheck: true,
      maintenanceTitle: "Maintenance Notice",
      maintenanceText: "EXE Under Maintenance. Contact Owner.",
      clientSecret: "f6c8d28a3013b5d29931efb70295da9f6e07662cbfdb85a2104470081d58296a",
      expiresAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ];
  for (const d of defaults) {
    memoryClients.set(d.id, d);
  }
}

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

    // 1. Ensure clients table exists
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
        client_secret TEXT NOT NULL DEFAULT '',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // 2. Ensure all columns exist in case table was created with earlier schema
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS exe_name TEXT NOT NULL DEFAULT 'Client.exe';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS cheat_name TEXT NOT NULL DEFAULT 'MeowGG';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS title_part1 TEXT NOT NULL DEFAULT 'Meow';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS title_part2 TEXT NOT NULL DEFAULT '.GG';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS window_title TEXT NOT NULL DEFAULT 'MeowGG';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS subtitle TEXT NOT NULL DEFAULT 'Dev : Subhajit | MeowGG';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS loading_text TEXT NOT NULL DEFAULT 'Connecting To DataBase';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS discord_invite_url TEXT NOT NULL DEFAULT 'https://discord.gg/meowgg';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_enabled BOOLEAN NOT NULL DEFAULT true;`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_app_id TEXT NOT NULL DEFAULT '1561024986851057715';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_state TEXT NOT NULL DEFAULT 'MeowGG';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_details TEXT NOT NULL DEFAULT 'discord.gg/meowgg';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_large_image TEXT NOT NULL DEFAULT '';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_large_text TEXT NOT NULL DEFAULT 'MeowGG Community';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_small_image TEXT NOT NULL DEFAULT '';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_small_text TEXT NOT NULL DEFAULT 'Developer : Subhajit';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_button1_label TEXT NOT NULL DEFAULT '<3 Buying Here !';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_button1_url TEXT NOT NULL DEFAULT 'https://discord.gg/meowgg';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_button2_label TEXT NOT NULL DEFAULT 'Developer';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS rpc_button2_url TEXT NOT NULL DEFAULT 'https://discord.gg/meowgg';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS enable_auth BOOLEAN NOT NULL DEFAULT true;`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_name TEXT NOT NULL DEFAULT 'all free';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_owner_id TEXT NOT NULL DEFAULT '29B4YqY38s';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_secret TEXT NOT NULL DEFAULT '';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_version TEXT NOT NULL DEFAULT '1.0';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_url TEXT NOT NULL DEFAULT 'https://licenseauth.help/api/1.3/';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_path TEXT DEFAULT '';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS enable_maintenance_check BOOLEAN NOT NULL DEFAULT true;`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS maintenance_title TEXT NOT NULL DEFAULT 'Maintenance Notice';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS maintenance_text TEXT NOT NULL DEFAULT 'EXE Under Maintenance. Contact Owner.';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_secret TEXT NOT NULL DEFAULT '';`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;`;

    // 3. Ensure checkin_logs table exists
    await sql`
      CREATE TABLE IF NOT EXISTS checkin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL,
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
