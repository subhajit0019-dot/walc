import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Cache connections across hot reloads in serverless / development
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: ReturnType<typeof drizzle> | undefined;
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
