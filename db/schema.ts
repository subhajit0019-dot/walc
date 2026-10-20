import { pgTable, uuid, text, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: text("status").$type<"active" | "suspended" | "revoked">().default("active").notNull(),
    exeName: text("exe_name").notNull().default("Client.exe"),
    
    // Branding
    cheatName: text("cheat_name").notNull().default("MeowGG"),
    titlePart1: text("title_part1").notNull().default("Meow"),
    titlePart2: text("title_part2").notNull().default(".GG"),
    windowTitle: text("window_title").notNull().default("MeowGG"),
    subtitle: text("subtitle").notNull().default("Dev : Subhajit | MeowGG"),
    loadingText: text("loading_text").notNull().default("Connecting To DataBase"),
    discordInviteUrl: text("discord_invite_url").notNull().default("https://discord.gg/meowgg"),
    
    // Discord RPC
    rpcEnabled: boolean("rpc_enabled").notNull().default(true),
    rpcAppId: text("rpc_app_id").notNull().default("1561024986851057715"),
    rpcState: text("rpc_state").notNull().default("MeowGG"),
    rpcDetails: text("rpc_details").notNull().default("discord.gg/meowgg"),
    rpcLargeImage: text("rpc_large_image").notNull().default("https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHVucnVxYmliMWF1NXoyYmd3YzhobTBvZmFtbXdwaHY4MzhxdGtidCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vas3wYC3KZ9AEo01xn/giphy.gif"),
    rpcLargeText: text("rpc_large_text").notNull().default("MeowGG Community"),
    rpcSmallImage: text("rpc_small_image").notNull().default("https://cdn3.emoji.gg/emojis/5863-verified-red-animated.gif"),
    rpcSmallText: text("rpc_small_text").notNull().default("Developer : Subhajit"),
    rpcButton1Label: text("rpc_button1_label").notNull().default("<3 Buying Here !"),
    rpcButton1Url: text("rpc_button1_url").notNull().default("https://discord.gg/meowgg"),
    rpcButton2Label: text("rpc_button2_label").notNull().default("Developer"),
    rpcButton2Url: text("rpc_button2_url").notNull().default("https://discord.gg/meowgg"),

    // KeyAuth / LicenseAuth Settings
    enableAuth: boolean("enable_auth").notNull().default(true),
    authName: text("auth_name").notNull().default("all free"),
    authOwnerId: text("auth_owner_id").notNull().default("29B4YqY38s"),
    authSecret: text("auth_secret").notNull().default(""),
    authVersion: text("auth_version").notNull().default("1.0"),
    authUrl: text("auth_url").notNull().default("https://licenseauth.help/api/1.3/"),
    authPath: text("auth_path").notNull().default(""),

    // Killswitch / Maintenance
    enableMaintenanceCheck: boolean("enable_maintenance_check").notNull().default(true),
    maintenanceTitle: text("maintenance_title").notNull().default("Maintenance Notice"),
    maintenanceText: text("maintenance_text").notNull().default("EXE Under Maintenance. Contact Owner."),

    // Security & Client Key
    clientSecret: text("client_secret").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_clients_status").on(table.status),
    index("idx_clients_created_at").on(table.createdAt),
  ]
);

export const baseExes = pgTable(
  "base_exes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    version: text("version").notNull(),
    filename: text("filename").notNull(),
    fileHash: text("file_hash").notNull(),
    blobUrl: text("blob_url").notNull(),
    fileSize: integer("file_size").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_base_exes_created_at").on(table.createdAt),
  ]
);

export const checkinLogs = pgTable(
  "checkin_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    status: text("status").notNull(), // 'active', 'suspended', 'revoked', 'expired', 'invalid_signature', 'replay_detected'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_checkin_logs_client_id").on(table.clientId),
    index("idx_checkin_logs_created_at").on(table.createdAt),
  ]
);

export const clientsRelations = relations(clients, ({ many }) => ({
  logs: many(checkinLogs),
}));

export const checkinLogsRelations = relations(checkinLogs, ({ one }) => ({
  client: one(clients, {
    fields: [checkinLogs.clientId],
    references: [clients.id],
  }),
}));

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type BaseExe = typeof baseExes.$inferSelect;
export type NewBaseExe = typeof baseExes.$inferInsert;
export type CheckinLog = typeof checkinLogs.$inferSelect;
