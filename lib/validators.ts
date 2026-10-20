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
    .transform((val) => {
      const trimmed = val.trim();
      return trimmed.toLowerCase().endsWith(".exe") ? trimmed : `${trimmed}.exe`;
    }),
  
  // Branding
  cheatName: z.string().default("MeowGG"),
  titlePart1: z.string().default("Meow"),
  titlePart2: z.string().default(".GG"),
  windowTitle: z.string().default("MeowGG"),
  subtitle: z.string().default("Dev : Subhajit | MeowGG"),
  loadingText: z.string().default("Connecting To DataBase"),
  discordInviteUrl: z.string().default("https://discord.gg/meowgg"),

  // Discord RPC
  rpcEnabled: z.boolean().default(true),
  rpcAppId: z.string().default("1561024986851057715"),
  rpcState: z.string().default("MeowGG"),
  rpcDetails: z.string().default("discord.gg/meowgg"),
  rpcLargeImage: z.string().default(""),
  rpcLargeText: z.string().default("MeowGG Community"),
  rpcSmallImage: z.string().default(""),
  rpcSmallText: z.string().default("Developer : Subhajit"),
  rpcButton1Label: z.string().default("<3 Buying Here !"),
  rpcButton1Url: z.string().default("https://discord.gg/meowgg"),
  rpcButton2Label: z.string().default("Developer"),
  rpcButton2Url: z.string().default("https://discord.gg/meowgg"),

  // LicenseAuth / KeyAuth
  enableAuth: z.boolean().default(true),
  authName: z.string().default("all free"),
  authOwnerId: z.string().default("29B4YqY38s"),
  authSecret: z.string().default(""),
  authVersion: z.string().default("1.0"),
  authUrl: z.string().default("https://licenseauth.help/api/1.3/"),
  authPath: z.string().default(""),

  // Maintenance Killswitch
  enableMaintenanceCheck: z.boolean().default(true),
  maintenanceTitle: z.string().default("Maintenance Notice"),
  maintenanceText: z.string().default("EXE Under Maintenance. Contact Owner."),

  expiresAt: z.string().nullable().optional(),
});

export const clientStatusUpdateSchema = z.object({
  status: clientStatusEnum,
});

export const clientCheckRequestSchema = z.object({
  clientId: z.string().min(1, "Client identifier or EXE name is required"),
  timestamp: z.number().int("Timestamp must be integer unix epoch seconds"),
  nonce: z.string().min(1, "Nonce is required").max(64),
  signature: z.string().optional().default("client_handshake"),
});
