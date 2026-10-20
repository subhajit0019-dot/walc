import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  turnstileToken: z.string().optional(),
  honeypot: z.string().max(0, "Bot detected").optional().default(""),
});

export const clientStatusEnum = z.enum(["active", "suspended", "revoked"]);

export const clientFormSchema = z.object({
  name: z.string().min(1, "Client identifier name is required").max(100),
  status: clientStatusEnum.default("active"),
  exeName: z
    .string()
    .min(1, "EXE filename is required")
    .regex(/^[a-zA-Z0-9_\-\.]+\.exe$/i, "EXE name must end with .exe and be alphanumeric"),
  
  // Branding
  cheatName: z.string().min(1, "Cheat name is required").max(64),
  titlePart1: z.string().min(1, "Title Part 1 is required").max(32),
  titlePart2: z.string().min(1, "Title Part 2 is required").max(32),
  windowTitle: z.string().min(1, "Window title is required").max(64),
  subtitle: z.string().max(128).default("Dev : Subhajit | MeowGG"),
  loadingText: z.string().max(64).default("Connecting To DataBase"),
  discordInviteUrl: z.string().url("Must be a valid Discord invite URL").or(z.string().length(0)),

  // Discord RPC
  rpcEnabled: z.boolean().default(true),
  rpcAppId: z.string().default("1561024986851057715"),
  rpcState: z.string().max(128).default("MeowGG"),
  rpcDetails: z.string().max(128).default("discord.gg/meowgg"),
  rpcLargeImage: z.string().max(512).default(""),
  rpcLargeText: z.string().max(128).default("MeowGG Community"),
  rpcSmallImage: z.string().max(512).default(""),
  rpcSmallText: z.string().max(128).default("Developer : Subhajit"),
  rpcButton1Label: z.string().max(64).default("<3 Buying Here !"),
  rpcButton1Url: z.string().url().or(z.string().length(0)).default(""),
  rpcButton2Label: z.string().max(64).default("Developer"),
  rpcButton2Url: z.string().url().or(z.string().length(0)).default(""),

  // LicenseAuth / KeyAuth
  enableAuth: z.boolean().default(true),
  authName: z.string().max(64).default("all free"),
  authOwnerId: z.string().max(64).default("29B4YqY38s"),
  authSecret: z.string().max(128).default(""),
  authVersion: z.string().max(16).default("1.0"),
  authUrl: z.string().url().or(z.string().length(0)).default("https://licenseauth.help/api/1.3/"),
  authPath: z.string().max(64).default(""),

  // Maintenance Killswitch
  enableMaintenanceCheck: z.boolean().default(true),
  maintenanceTitle: z.string().max(64).default("Maintenance Notice"),
  maintenanceText: z.string().max(256).default("EXE Under Maintenance. Contact Owner."),

  expiresAt: z.string().nullable().optional(),
});

export const clientStatusUpdateSchema = z.object({
  status: clientStatusEnum,
});

export const baseExeRegisterSchema = z.object({
  version: z.string().min(1, "Version string is required").max(32),
  filename: z.string().min(1, "Filename is required"),
  fileHash: z.string().length(64, "File hash must be a 64-char SHA-256 hex string"),
  blobUrl: z.string().url("Blob URL must be a valid URL"),
  fileSize: z.number().int().positive("File size must be positive"),
});

export const clientCheckRequestSchema = z.object({
  clientId: z.string().uuid("Invalid client UUID format"),
  timestamp: z.number().int("Timestamp must be integer unix epoch seconds"),
  nonce: z.string().min(8, "Nonce must be at least 8 characters").max(64),
  signature: z.string().min(32, "Signature is required"),
});
