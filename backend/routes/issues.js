const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const ISSUE_FILE = path.join(__dirname, "../data/issues.json");
const BOOK_FILE = path.join(__dirname, "../data/books.json");
const MEM_FILE = path.join(__dirname, "../data/members.json");

function readIssues() {
  return JSON.parse(fs.readFileSync(ISSUE_FILE, "utf8"));
}
function readBooks() {
  return JSON.parse(fs.readFileSync(BOOK_FILE, "utf8"));
}
function readMembers() {
  return JSON.parse(fs.readFileSync(MEM_FILE, "utf8"));
}
function writeIssues(d) {
  fs.writeFileSync(ISSUE_FILE, JSON.stringify(d, null, 2));
}
function writeBooks(d) {
  fs.writeFileSync(BOOK_FILE, JSON.stringify(d, null, 2));
}

// GET all issues
router.get("/", (req, res) => {
  res.json(readIssues());
});

// POST /issues/return  ← MUST be before POST "/" so Express matches it first
router.post("/return", (req, res) => {
  const issues = readIssues();
  const books = readBooks();
  const { mid, bookCode } = req.body;

  if (!mid || !bookCode) {
    return res
      .status(400)
      .json({ error: "Member ID and Book Code are required." });
  }

  const idx = issues.findIndex((i) => i.mid === mid && i.bookCode === bookCode);
  if (idx === -1) {
    return res.status(404).json({ error: "No matching issue record found." });
  }

  // Restore available count
  const book = books.find((b) => b.code === bookCode);
  if (book) {
    // BUG FIX: parseInt can return NaN; use || fallback, not ?? (NaN ?? x === NaN)
    book.available = (parseInt(book.available) || 0) + 1;
    writeBooks(books);
  }

  issues.splice(idx, 1);
  writeIssues(issues);
  res.json({ message: "Book returned successfully." });
});

// POST /issues — issue a book
router.post("/", (req, res) => {
  const issues = readIssues();
  const books = readBooks();
  const members = readMembers();
  const { mid, bookCode, issueDate, returnDate } = req.body;

  if (!mid || !bookCode || !issueDate || !returnDate) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Validate member
  const member = members.find((m) => m.id === mid);
  if (!member) return res.status(404).json({ error: "Member ID not found." });
  if (member.status === "Blocked")
    return res.status(403).json({ error: "Member is blocked." });

  // Validate membership expiry
  // BUG FIX: reject issue if membership has expired
  if (member.expiry) {
    const parts = member.expiry.split("-"); // DD-MM-YYYY
    const expiry =
      parts.length === 3
        ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        : null;
    if (expiry && expiry < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res
        .status(403)
        .json({ error: "Member's membership has expired." });
    }
  }

  // Validate book & stock
  const book = books.find((b) => b.code === bookCode);
  if (!book) return res.status(404).json({ error: "Book code not found." });

  // BUG FIX: parseInt(book.available) ?? ... uses ?? which does NOT catch NaN;
  // use || instead so NaN falls back correctly
  const avail = parseInt(book.available) || parseInt(book.qty) || 0;
  if (avail < 1) return res.status(400).json({ error: "No copies available." });

  // Check not already issued to this member
  if (issues.find((i) => i.mid === mid && i.bookCode === bookCode)) {
    return res
      .status(400)
      .json({ error: "This book is already issued to this member." });
  }

  // Decrement available
  book.available = avail - 1;
  writeBooks(books);

  issues.push({ mid, bookCode, bookName: book.name, issueDate, returnDate });
  writeIssues(issues);
  res.json({
    message: `"${book.name}" issued to ${member.name} successfully.`,
  });
});

module.exports = router;
