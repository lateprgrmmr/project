import massive, { ConnectionInfo } from "massive";
import dotenv from "dotenv";
dotenv.config(); //Reads .env file and makes it accessible via process.env
// psql -h localhost -p 5243 -d costmanagerdev -U costmanager -W password

declare module "massive" {
  interface Database {
    // Add any custom methods or properties here
    trace: (on: boolean, reason: string) => void;
  }
}

// const dbConnectionString = "postgres://postgres:password@localhost:5434/recipe_db";
const dbConnectionInfo: ConnectionInfo = {
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3452"),
};

let db: massive.Database | null = null;

export type Connection = massive.Database;

export const connectDb = async (): Promise<massive.Database> => {
  if (db) {
    return db;
  }
  const connInfo: Partial<ConnectionInfo> = dbConnectionInfo;
  try {
    const _db = await massive(dbConnectionInfo, {
      scripts: `${process.cwd()}/src/database/scripts`,
    });
    console.log("Connected to database");
    return _db;
  } catch (error) {
    console.error('failed to connect', error);
    throw error;
  }
};