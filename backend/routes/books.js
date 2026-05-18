const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const FILE = path.join(__dirname, "../data/books.json");

function read() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// GET all books
router.get("/", (req, res) => {
  res.json(read());
});

// POST — add book
router.post("/", (req, res) => {
  const books = read();
  const newBook = req.body;

  if (!newBook.code || !newBook.name) {
    return res.status(400).json({ error: "Code and name are required." });
  }
  if (books.find((b) => b.code === newBook.code)) {
    return res.status(400).json({ error: "Book code already exists." });
  }

  newBook.available = parseInt(newBook.qty) || 0;
  books.push(newBook);
  write(books);
  res.json({ message: "Book added successfully." });
});

// PUT — edit book by code
router.put("/:code", (req, res) => {
  const books = read();
  const idx = books.findIndex((b) => b.code === req.params.code);

  if (idx === -1) return res.status(404).json({ error: "Book not found." });

  const oldQty = parseInt(books[idx].qty) || 0;
  const newQty = parseInt(req.body.qty) || oldQty;
  // BUG FIX: parseInt(x) ?? y does not catch NaN; use || so NaN falls back correctly
  const oldAvail = parseInt(books[idx].available) || oldQty;
  const diff = newQty - oldQty;

  books[idx] = {
    ...books[idx],
    ...req.body,
    code: req.params.code,
    qty: newQty,
    available: Math.max(0, oldAvail + diff),
  };
  write(books);
  res.json({ message: "Book updated successfully." });
});

// DELETE — remove book by code
// BUG FIX: block deletion if book is currently issued
router.delete("/:code", (req, res) => {
  const ISSUE_FILE = path.join(__dirname, "../data/issues.json");
  let books = read();
  const before = books.length;

  // Check for active issues
  try {
    const issues = JSON.parse(fs.readFileSync(ISSUE_FILE, "utf8"));
    const hasIssue = issues.some((i) => i.bookCode === req.params.code);
    if (hasIssue) {
      return res.status(400).json({
        error:
          "Cannot delete book — it is currently issued to a member. Return the book first.",
      });
    }
  } catch (_) {
    /* If issues file unreadable, skip the check */
  }

  books = books.filter((b) => b.code !== req.params.code);
  if (books.length === before) {
    return res.status(404).json({ error: "Book not found." });
  }

  write(books);
  res.json({ message: "Book deleted successfully." });
});

module.exports = router;
