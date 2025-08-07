const express = require("express");
const cors = require("cors");
const neo4j = require("neo4j-driver");

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j credentials
const uri = "bolt://3.234.230.208";
const user = "neo4j";
const password = "attacker-daughters-preparations";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// GET movies
app.get("/api/movies", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (m:Movie)
      RETURN m.title AS title, m.released AS released, m.tagline AS tagline
      ORDER BY m.released DESC
      LIMIT 10
    `);
    const movies = result.records.map(record => {
      const released = record.get("released");
      return {
        title: record.get("title"),
        released: released?.toNumber?.() ?? null,
        tagline: record.get("tagline")
      };
    });
    res.json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    await session.close();
  }
});

// POST new movie
app.post("/api/movies", async (req, res) => {
  const session = driver.session();
  const { title, tagline, released } = req.body;

  if (!title || !released) {
    return res.status(400).json({ error: "Title and released year are required" });
  }

  try {
    await session.run(
      `CREATE (m:Movie {title: $title, tagline: $tagline, released: $released})`,
      {
        title,
        tagline,
        released: neo4j.int(released) // convert to Neo4j Integer
      }
    );
    res.status(201).json({ message: "Movie created successfully" });
  } catch (error) {
    console.error("Error creating movie:", error);
    res.status(500).json({ error: "Could not create movie" });
  } finally {
    await session.close();
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
