import cors from "cors";
import express from "express";
import pool from "./db";


const app = express();

app.use(cors());

const PORT = 3000;

app.get("/api/tracts", async (req, res) => {
    const minScore = req.query.minScore;
    try {
      const result = await pool.query(`
      SELECT
        tracts."GEOID",
        tracts."Tract",
        ST_AsGeoJSON(tracts.geometry, 6, 0)::json AS geometry,
        stress_scores."Population Density",
        stress_scores."Housing Density",
        stress_scores."Avg Max Temp",
        stress_scores."Avg PM2.5 Levels",
        stress_scores."Stress Score"
      FROM tracts
      LEFT JOIN stress_scores
        ON tracts."GEOID" = stress_scores."GEOID"
        WHERE ($1::double precision IS NULL OR stress_scores."Stress Score" >= $1)
    `, [minScore]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});