import { Pool } from "pg";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: "fernandabarraza",
      host: "localhost",
      database: "infra_stress",
      port: 5432,
    });

export default pool;