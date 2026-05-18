# 📚 Library Management System

A full-stack digital library portal for managing members, books, issue/return transactions, and reports. Built with vanilla HTML/CSS/JS on the frontend and Node.js + Express on the backend, with JSON file-based storage.

---

## ✨ Features

- **Dashboard** — live stats (total members, books, active issues)
- **Member Management** — add, edit, delete members with auto-generated IDs
- **Book Management** — add, edit, delete books with auto-generated codes and live availability tracking
- **Issue & Return** — issue books to members with date validation; return flow restores stock automatically
- **Issue History** — full transaction log with overdue highlighting
- **Reports** — overdue books with fines (₹2/day), expiring memberships (30-day window), top 5 most-issued books, revenue summary
- **CSV Export** — export members, books, and issue history
- **Search** — live search on members and books tables

---

## 🗂️ Project Structure

```
├── frontend/
│   ├── index.html           # Dashboard
│   ├── add-member.html
│   ├── view-members.html
│   ├── add-book.html
│   ├── view-books.html
│   ├── issue-book.html
│   ├── return-book.html
│   ├── issue-history.html
│   ├── reports.html
│   ├── script.js            # All frontend logic
│   └── style.css
│
└── backend/
    ├── server.js            # Express entry point
    ├── package.json
    ├── package-lock.json
    ├── node_modules/
    ├── routes/
    │   ├── members.js       # CRUD for members
    │   ├── books.js         # CRUD for books
    │   └── issues.js        # Issue / return logic
    └── data/
        ├── members.json     # Persistent member records
        ├── books.json       # Persistent book records
        └── issues.json      # Persistent issue records
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/library-management-system.git
cd library-management-system

# 2. Install backend dependencies
cd backend
npm install

# 3. Start the server
npm start
```

The server starts at **http://localhost:3000**.

### Viewing the App

Open your browser and go to:

```
http://localhost:3000
```

The frontend is served as static files from the `frontend/` folder by Express — no separate dev server needed.

---

## 🔌 API Endpoints

All endpoints are prefixed at `http://localhost:3000`.

### Members — `/members`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/members` | Get all members |
| POST | `/members` | Add a new member |
| PUT | `/members/:id` | Update a member |
| DELETE | `/members/:id` | Delete a member (blocked if books are issued) |

### Books — `/books`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/books` | Get all books |
| POST | `/books` | Add a new book |
| PUT | `/books/:code` | Update a book |
| DELETE | `/books/:code` | Delete a book (blocked if currently issued) |

### Issues — `/issues`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/issues` | Get all issue records |
| POST | `/issues` | Issue a book to a member |
| POST | `/issues/return` | Return an issued book |

---

## 💾 Data Storage

Data is stored as JSON files in `backend/data/`. No database setup is required.

**Sample member record:**
```json
{
  "id": "MEM001",
  "name": "Rhythm Bhojani",
  "addr": "Virar",
  "issue": "01-03-2026",
  "expiry": "01-08-2026",
  "status": "Active",
  "type": "Student",
  "amount": "500"
}
```

**Sample book record:**
```json
{
  "code": "BOOK001",
  "name": "The Hidden Hindu",
  "author": "Akshat Gupta",
  "rack": "R1-A",
  "arrival": "26-03-2026",
  "qty": 4,
  "available": 3
}
```

Dates are stored and displayed as `DD-MM-YYYY`.

---

## 🛡️ Business Rules

- A **Blocked** member cannot borrow books
- A member with an **expired membership** cannot borrow books
- A book with **zero available copies** cannot be issued
- A member cannot be issued the **same book twice** simultaneously
- A **member cannot be deleted** while they have books currently issued
- A **book cannot be deleted** while it is currently issued to someone
- Late return fine is **₹2 per day** overdue

---

## 🏷️ Membership Tiers

| Tier | Price |
|------|-------|
| Basic | ₹100 |
| Standard | ₹300 |
| Premium | ₹500 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express 5 |
| Storage | JSON flat files |
| Styling | Custom CSS (no framework) |

---

## 📄 License

This project is open-source and available under the MIT License.

## ✍🏼 Author

Developed by Rhythm Bhojani

GitHub Profile:  
https://github.com/Rhythm-1987

Repository Link:  
https://github.com/Rhythm-1987/Library-Management-System-Java
