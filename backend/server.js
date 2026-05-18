const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ── Serve all HTML/CSS/JS from the frontend folder ──────────────────────────
app.use(express.static(path.join(__dirname, "frontend")));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/members", require("./routes/members"));
app.use("/books",   require("./routes/books"));
app.use("/issues",  require("./routes/issues"));

// ── Root health check ────────────────────────────────────────────────────────
app.get("/api", (req, res) => res.send("Backend running 🚀"));

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(3000, () => console.log("Server running at http://localhost:3000"));