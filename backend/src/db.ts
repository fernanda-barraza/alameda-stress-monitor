import { Pool } from "pg";

const pool = new Pool({
  user: "fernandabarraza",
  host: "localhost",
  database: "infra_stress",
  port: 5432,
});

export default pool;