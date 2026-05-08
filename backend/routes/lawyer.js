const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");

const router = express.Router();

dotenv.config();

router.use(cors());
router.use(express.json());

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// ✅ Check DB connection
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

// ✅ Fetch all lawyers
router.get("/lawyers", (req, res) => {

  const { specialization, city, language } = req.query;

  let query = "SELECT * FROM Lawyer WHERE 1=1";
  const params = [];

  if (specialization && specialization !== "All Specialties") {
    query += " AND specialization LIKE ?";
    params.push(`%${specialization}%`);
  }

  if (city && city !== "") {
    query += " AND city LIKE ?";
    params.push(`%${city.toLowerCase()}%`);
  }

  if (language && language !== "Any Language") {
    query += " AND FIND_IN_SET(?, languages)";
    params.push(language);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});


// ✅ Fetch lawyer by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM Lawyer WHERE lawyer_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching lawyer:", err);
      res.status(500).json({ error: "Database error" });
    } else if (results.length === 0) {
      res.status(404).json({ message: "Lawyer not found" });
    } else {
      res.json(results[0]);
    }
  });
});

module.exports = router;
