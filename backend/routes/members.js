const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const FILE = path.join(__dirname, "../data/members.json");

function read() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// GET all members
router.get("/", (req, res) => {
  res.json(read());
});

// POST — add member
router.post("/", (req, res) => {
  const members = read();
  const newMember = req.body;

  if (!newMember.id || !newMember.name) {
    return res.status(400).json({ error: "ID and name are required." });
  }
  if (members.find((m) => m.id === newMember.id)) {
    return res.status(400).json({ error: "Member ID already exists." });
  }

  members.push(newMember);
  write(members);
  res.json({ message: "Member added successfully." });
});

// PUT — edit member by ID
router.put("/:id", (req, res) => {
  const members = read();
  const idx = members.findIndex((m) => m.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Member not found." });

  members[idx] = { ...members[idx], ...req.body, id: req.params.id };
  write(members);
  res.json({ message: "Member updated successfully." });
});

// DELETE — remove member by ID
// BUG FIX: block deletion if member has currently issued books
router.delete("/:id", (req, res) => {
  const ISSUE_FILE = path.join(__dirname, "../data/issues.json");
  let members = read();
  const before = members.length;

  // Check for active issues
  try {
    const issues = JSON.parse(fs.readFileSync(ISSUE_FILE, "utf8"));
    const hasIssue = issues.some((i) => i.mid === req.params.id);
    if (hasIssue) {
      return res.status(400).json({
        error:
          "Cannot delete member — they have books currently issued. Return all books first.",
      });
    }
  } catch (_) {
    /* If issues file unreadable, skip the check */
  }

  members = members.filter((m) => m.id !== req.params.id);
  if (members.length === before) {
    return res.status(404).json({ error: "Member not found." });
  }

  write(members);
  res.json({ message: "Member deleted successfully." });
});

module.exports = router;
