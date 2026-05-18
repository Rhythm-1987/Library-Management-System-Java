const API = "http://localhost:3000";

// ── In-memory cache (populated from API on page load) ────────────────────────
let members = [];
let books = [];
let issues = [];

// ── Date helpers ─────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  const p = str.split("-");
  if (p.length !== 3) return str;
  return `${p[2]}-${p[1]}-${p[0]}`;
}

function parseDate(str) {
  if (!str) return null;
  const p = str.split("-");
  if (p.length !== 3) return null;
  return new Date(`${p[2]}-${p[1]}-${p[0]}`);
}

function toInputDate(str) {
  if (!str) return "";
  const p = str.split("-");
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : str;
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Sidebar active link ───────────────────────────────────────────────────────
function setActiveLink() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === page);
  });
}

// ── Validation helpers ────────────────────────────────────────────────────────
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.classList.add("input-error");
  const err = document.getElementById(id + "-err");
  if (err) {
    err.innerText = msg;
    err.style.display = "block";
  }
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("input-error");
  const err = document.getElementById(id + "-err");
  if (err) {
    err.innerText = "";
    err.style.display = "none";
  }
}
function clearAllErrors(ids) {
  ids.forEach(clearError);
}

// BUG FIX: showMsg now sets a background colour so messages are actually visible
function showMsg(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = text;
  el.style.color = isError ? "#dc2626" : "#16a34a";
  el.style.background = isError ? "#fff1f2" : "#f0fdf4";
  el.style.border = isError ? "1px solid #fecaca" : "1px solid #bbf7d0";
  el.style.display = "block";
}

// ── Generic API helpers with error handling ───────────────────────────────────
// BUG FIX: all API calls now catch network errors instead of throwing uncaught exceptions
async function apiGet(path) {
  try {
    const res = await fetch(API + path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error("GET " + path + " failed:", e);
    return [];
  }
}
async function apiPost(path, body) {
  try {
    const res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (e) {
    console.error("POST " + path + " failed:", e);
    return { error: "Network error. Is the server running?" };
  }
}
async function apiPut(path, body) {
  try {
    const res = await fetch(API + path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (e) {
    console.error("PUT " + path + " failed:", e);
    return { error: "Network error. Is the server running?" };
  }
}
async function apiDelete(path) {
  try {
    const res = await fetch(API + path, { method: "DELETE" });
    return res.json();
  } catch (e) {
    console.error("DELETE " + path + " failed:", e);
    return { error: "Network error. Is the server running?" };
  }
}

// ── Member ID generation ──────────────────────────────────────────────────────
// BUG FIX: guard with early return so this is a no-op on pages without #mid
function generateMemberId() {
  const box = document.getElementById("mid");
  if (!box) return;
  const existing = new Set(members.map((m) => m.id));
  let num = members.length + 1;
  let id;
  do {
    id = "MEM" + String(num++).padStart(3, "0");
  } while (existing.has(id));
  box.value = id;
  box.readOnly = true;
}

// ── ADD MEMBER ────────────────────────────────────────────────────────────────
async function addMember() {
  const fields = ["mname", "maddr", "missue", "mexpiry"];
  clearAllErrors(fields);

  const id = document.getElementById("mid").value.trim();
  const name = document.getElementById("mname").value.trim();
  const addr = document.getElementById("maddr").value.trim();
  const issue = document.getElementById("missue").value;
  const expiry = document.getElementById("mexpiry").value;

  let valid = true;
  if (!name) {
    setError("mname", "Name is required.");
    valid = false;
  }
  if (!addr) {
    setError("maddr", "City is required.");
    valid = false;
  }
  if (!issue) {
    setError("missue", "Start date is required.");
    valid = false;
  }
  if (!expiry) {
    setError("mexpiry", "Expiry date is required.");
    valid = false;
  }
  if (!valid) return;
  if (expiry <= issue) {
    setError("mexpiry", "Expiry must be after start date.");
    return;
  }

  const data = await apiPost("/members", {
    id,
    name,
    addr,
    issue: formatDate(issue),
    expiry: formatDate(expiry),
    status: document.getElementById("mstatus").value,
    type: document.getElementById("mtype").value,
    amount: document.getElementById("mamount").value,
  });

  if (data.error) {
    showMsg("membermsg", "❌ " + data.error, true);
    return;
  }

  members = await apiGet("/members");
  showMsg("membermsg", "✅ Member added successfully!");
  fields.forEach((f) => (document.getElementById(f).value = ""));
  generateMemberId();
}

// ── EDIT MEMBER ───────────────────────────────────────────────────────────────
function editMember(id) {
  const m = members.find((x) => x.id === id);
  if (!m) return;
  document.getElementById("editMid").value = m.id;
  document.getElementById("editMname").value = m.name;
  document.getElementById("editMaddr").value = m.addr;
  document.getElementById("editMissue").value = toInputDate(m.issue);
  document.getElementById("editMexpiry").value = toInputDate(m.expiry);
  document.getElementById("editMstatus").value = m.status || "Active";
  document.getElementById("editMtype").value = m.type || "Student";
  document.getElementById("editMamount").value = m.amount || "100";
  document.getElementById("memberModal").style.display = "flex";
}

async function saveMemberEdit() {
  const id = document.getElementById("editMid").value;
  const name = document.getElementById("editMname").value.trim();
  const addr = document.getElementById("editMaddr").value.trim();
  const issue = document.getElementById("editMissue").value;
  const expiry = document.getElementById("editMexpiry").value;

  if (!name || !addr || !issue || !expiry) {
    alert("⚠️ Please fill in all fields.");
    return;
  }
  // BUG FIX: date validation was missing from the edit modal
  if (expiry <= issue) {
    alert("⚠️ Expiry date must be after start date.");
    return;
  }

  const data = await apiPut("/members/" + id, {
    name,
    addr,
    issue: formatDate(issue),
    expiry: formatDate(expiry),
    status: document.getElementById("editMstatus").value,
    type: document.getElementById("editMtype").value,
    amount: document.getElementById("editMamount").value,
  });
  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  members = await apiGet("/members");
  closeModal("memberModal");
  loadMembersTable(members);
}

// ── DELETE MEMBER ─────────────────────────────────────────────────────────────
async function deleteMember(id) {
  if (!confirm(`Delete member ${id}? This cannot be undone.`)) return;
  const data = await apiDelete("/members/" + id);
  if (data.error) {
    alert("❌ " + data.error);
    return;
  }
  members = await apiGet("/members");
  loadMembersTable(members);
}

// ── RENDER / LOAD MEMBERS ─────────────────────────────────────────────────────
function renderMemberRows(list) {
  if (!list.length)
    return `<tr><td colspan="9" style="text-align:center;color:#64748b;padding:20px">No members found.</td></tr>`;
  return list
    .map(
      (m) => `
    <tr>
      <td>${m.id}</td>
      <td>${m.name}</td>
      <td>${m.addr}</td>
      <td>${m.issue}</td>
      <td>${m.expiry}</td>
      <td><span class="badge badge-${(m.status || "active").toLowerCase()}">${m.status || "—"}</span></td>
      <td>${m.type || "—"}</td>
      <td>₹${m.amount || "—"}</td>
      <td class="action-btns">
        <button class="btn-edit"   onclick="editMember('${m.id}')">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteMember('${m.id}')">🗑️ Delete</button>
      </td>
    </tr>`,
    )
    .join("");
}

function loadMembersTable(list) {
  const t = document.getElementById("memberTable");
  if (t) t.innerHTML = renderMemberRows(list);
}

// BUG FIX: removed stray generateMemberId() call — it served no purpose here
// and would silently fail (now guarded, but still wrong semantically)
async function loadMembers() {
  members = await apiGet("/members");
  loadMembersTable(members);
}

function searchMembers(text) {
  const q = text.toLowerCase();
  loadMembersTable(
    members.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    ),
  );
}

// ── EXPORT MEMBERS CSV ────────────────────────────────────────────────────────
function exportMembersCSV() {
  if (!members.length) {
    alert("No data to export.");
    return;
  }
  const rows = [
    ["ID", "Name", "City", "Issue Date", "Expiry", "Status", "Type", "Amount"],
  ];
  members.forEach((m) =>
    rows.push([
      m.id,
      m.name,
      m.addr,
      m.issue,
      m.expiry,
      m.status || "",
      m.type || "",
      m.amount || "",
    ]),
  );
  downloadCSV(rows, "members.csv");
}

// ── Book code generation ──────────────────────────────────────────────────────
// BUG FIX: guard with early return so this is a no-op on pages without #bcode
function generateBookCode() {
  const box = document.getElementById("bcode");
  if (!box) return;
  const existing = new Set(books.map((b) => b.code));
  let num = books.length + 1;
  let code;
  do {
    code = "BOOK" + String(num++).padStart(3, "0");
  } while (existing.has(code));
  box.value = code;
  box.readOnly = true;
}

// ── ADD BOOK ──────────────────────────────────────────────────────────────────
async function addBook() {
  const fields = ["bname", "bauthor", "barrival", "brack", "bqty"];
  clearAllErrors(fields);

  const code = document.getElementById("bcode").value.trim();
  const name = document.getElementById("bname").value.trim();
  const author = document.getElementById("bauthor").value.trim();
  const arrival = document.getElementById("barrival").value;
  const rack = document.getElementById("brack").value.trim();
  const qty = parseInt(document.getElementById("bqty").value);

  let valid = true;
  if (!name) {
    setError("bname", "Book name is required.");
    valid = false;
  }
  if (!author) {
    setError("bauthor", "Author is required.");
    valid = false;
  }
  if (!arrival) {
    setError("barrival", "Arrival date is required.");
    valid = false;
  }
  if (!rack) {
    setError("brack", "Rack number is required.");
    valid = false;
  }
  if (isNaN(qty) || qty < 1) {
    setError("bqty", "Enter a valid quantity (min 1).");
    valid = false;
  }
  if (!valid) return;

  const data = await apiPost("/books", {
    code,
    name,
    author,
    rack,
    qty,
    arrival: formatDate(arrival),
  });
  if (data.error) {
    showMsg("bookmsg", "❌ " + data.error, true);
    return;
  }

  books = await apiGet("/books");
  showMsg("bookmsg", "✅ Book added successfully!");
  fields.forEach((f) => (document.getElementById(f).value = ""));
  generateBookCode();
}

// ── EDIT BOOK ─────────────────────────────────────────────────────────────────
function editBook(code) {
  const b = books.find((x) => x.code === code);
  if (!b) return;
  document.getElementById("editBcode").value = b.code;
  document.getElementById("editBname").value = b.name;
  document.getElementById("editBauthor").value = b.author;
  document.getElementById("editBrack").value = b.rack;
  document.getElementById("editBarrival").value = toInputDate(b.arrival);
  document.getElementById("editBqty").value = b.qty;
  document.getElementById("bookModal").style.display = "flex";
}

async function saveBookEdit() {
  const code = document.getElementById("editBcode").value;
  const name = document.getElementById("editBname").value.trim();
  const author = document.getElementById("editBauthor").value.trim();
  const rack = document.getElementById("editBrack").value.trim();
  const arrival = document.getElementById("editBarrival").value;
  const qty = parseInt(document.getElementById("editBqty").value);

  if (!name || !author || !rack || !arrival || isNaN(qty) || qty < 1) {
    alert("⚠️ Please fill in all fields correctly.");
    return;
  }
  const data = await apiPut("/books/" + code, {
    name,
    author,
    rack,
    qty,
    arrival: formatDate(arrival),
  });
  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  books = await apiGet("/books");
  closeModal("bookModal");
  loadBooksTable(books);
}

// ── DELETE BOOK ───────────────────────────────────────────────────────────────
async function deleteBook(code) {
  if (!confirm(`Delete book ${code}? This cannot be undone.`)) return;
  const data = await apiDelete("/books/" + code);
  if (data.error) {
    alert("❌ " + data.error);
    return;
  }
  books = await apiGet("/books");
  loadBooksTable(books);
}

// ── RENDER / LOAD BOOKS ───────────────────────────────────────────────────────
function renderBookRows(list) {
  if (!list.length)
    return `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px">No books found.</td></tr>`;
  return list
    .map((b) => {
      const avail = b.available !== undefined ? b.available : parseInt(b.qty);
      const style =
        avail === 0
          ? "color:red;font-weight:600"
          : avail <= 2
            ? "color:orange;font-weight:600"
            : "";
      return `
    <tr>
      <td>${b.code}</td>
      <td>${b.name}</td>
      <td>${b.author}</td>
      <td>${b.rack}</td>
      <td>${b.arrival}</td>
      <td style="${style}">${avail} / ${b.qty}</td>
      <td class="action-btns">
        <button class="btn-edit"   onclick="editBook('${b.code}')">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteBook('${b.code}')">🗑️ Delete</button>
      </td>
    </tr>`;
    })
    .join("");
}

function loadBooksTable(list) {
  const t = document.getElementById("bookTable");
  if (t) t.innerHTML = renderBookRows(list);
}

// BUG FIX: removed stray generateBookCode() call — same issue as loadMembers
async function loadBooks() {
  books = await apiGet("/books");
  loadBooksTable(books);
}

function searchBooks(text) {
  const q = text.toLowerCase();
  loadBooksTable(
    books.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q),
    ),
  );
}

// ── EXPORT BOOKS CSV ──────────────────────────────────────────────────────────
function exportBooksCSV() {
  if (!books.length) {
    alert("No data to export.");
    return;
  }
  const rows = [
    ["Code", "Name", "Author", "Rack", "Arrival", "Total Qty", "Available"],
  ];
  books.forEach((b) =>
    rows.push([
      b.code,
      b.name,
      b.author,
      b.rack,
      b.arrival,
      b.qty,
      b.available !== undefined ? b.available : b.qty,
    ]),
  );
  downloadCSV(rows, "books.csv");
}

// ── ISSUE BOOK ────────────────────────────────────────────────────────────────
async function issueBook() {
  const fields = ["issueMid", "issueBookCode", "issueDate", "returnDate"];
  clearAllErrors(fields);

  const mid = document.getElementById("issueMid").value.trim().toUpperCase();
  const bookCode = document
    .getElementById("issueBookCode")
    .value.trim()
    .toUpperCase();
  const issueDate = document.getElementById("issueDate").value;
  const returnDate = document.getElementById("returnDate").value;

  let valid = true;
  if (!mid) {
    setError("issueMid", "Member ID is required.");
    valid = false;
  }
  if (!bookCode) {
    setError("issueBookCode", "Book Code is required.");
    valid = false;
  }
  if (!issueDate) {
    setError("issueDate", "Issue date is required.");
    valid = false;
  }
  if (!returnDate) {
    setError("returnDate", "Return date is required.");
    valid = false;
  }
  if (!valid) return;
  if (returnDate <= issueDate) {
    setError("returnDate", "Return date must be after issue date.");
    return;
  }

  const data = await apiPost("/issues", {
    mid,
    bookCode,
    issueDate: formatDate(issueDate),
    returnDate: formatDate(returnDate),
  });

  if (data.error) {
    showMsg("issuemsg", "❌ " + data.error, true);
    return;
  }

  books = await apiGet("/books");
  showMsg("issuemsg", "✅ " + data.message);
  fields.forEach((f) => (document.getElementById(f).value = ""));
}

// ── RETURN BOOK ───────────────────────────────────────────────────────────────
async function returnBook() {
  const fields = ["returnMid", "returnBookCode"];
  clearAllErrors(fields);

  const mid = document.getElementById("returnMid").value.trim().toUpperCase();
  const bookCode = document
    .getElementById("returnBookCode")
    .value.trim()
    .toUpperCase();

  let valid = true;
  if (!mid) {
    setError("returnMid", "Member ID is required.");
    valid = false;
  }
  if (!bookCode) {
    setError("returnBookCode", "Book Code is required.");
    valid = false;
  }
  if (!valid) return;

  const data = await apiPost("/issues/return", { mid, bookCode });
  if (data.error) {
    showMsg("returnmsg", "❌ " + data.error, true);
    return;
  }

  books = await apiGet("/books");
  showMsg("returnmsg", "✅ " + data.message);
  fields.forEach((f) => (document.getElementById(f).value = ""));
}

// ── ISSUE HISTORY ─────────────────────────────────────────────────────────────
async function loadIssues() {
  const table = document.getElementById("issueTable");
  if (!table) return;
  issues = await apiGet("/issues");
  const now = today();

  if (!issues.length) {
    table.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px">No issues recorded.</td></tr>`;
    return;
  }
  table.innerHTML = issues
    .map((i) => {
      const retDate = parseDate(i.returnDate);
      const overdue = retDate && retDate < now;
      return `<tr${overdue ? ' class="overdue-row"' : ""}>
      <td>${i.mid}</td>
      <td>${i.bookCode}</td>
      <td>${i.bookName || "—"}</td>
      <td>${i.issueDate}</td>
      <td>${i.returnDate}${overdue ? ' <span class="badge badge-blocked">Overdue</span>' : ""}</td>
    </tr>`;
    })
    .join("");
}

// ── EXPORT ISSUES CSV ─────────────────────────────────────────────────────────
function exportIssuesCSV() {
  if (!issues.length) {
    alert("No data to export.");
    return;
  }
  const rows = [
    ["Member ID", "Book Code", "Book Name", "Issue Date", "Return Date"],
  ];
  issues.forEach((i) =>
    rows.push([i.mid, i.bookCode, i.bookName || "", i.issueDate, i.returnDate]),
  );
  downloadCSV(rows, "issues.csv");
}

// ── DASHBOARD STATS ───────────────────────────────────────────────────────────
async function loadStats() {
  const [m, b, i] = await Promise.all([
    apiGet("/members"),
    apiGet("/books"),
    apiGet("/issues"),
  ]);
  members = m;
  books = b;
  issues = i;
  const el = (id) => document.getElementById(id);
  if (el("statMembers")) el("statMembers").innerText = members.length;
  if (el("statBooks")) el("statBooks").innerText = books.length;
  if (el("statIssues")) el("statIssues").innerText = issues.length;
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
async function loadReports() {
  const [m, b, i] = await Promise.all([
    apiGet("/members"),
    apiGet("/books"),
    apiGet("/issues"),
  ]);
  members = m;
  books = b;
  issues = i;
  const now = today();
  const el = (id) => document.getElementById(id);

  const totalRevenue = members.reduce(
    (sum, m) => sum + parseInt(m.amount || 0),
    0,
  );
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const overdueList = issues.filter((i) => {
    const d = parseDate(i.returnDate);
    return d && d < now;
  });

  if (el("rTotalMembers")) el("rTotalMembers").innerText = members.length;
  if (el("rActiveMembers")) el("rActiveMembers").innerText = activeMembers;
  if (el("rTotalBooks")) el("rTotalBooks").innerText = books.length;
  if (el("rIssuedBooks")) el("rIssuedBooks").innerText = issues.length;
  if (el("rOverdue")) el("rOverdue").innerText = overdueList.length;
  if (el("rRevenue")) el("rRevenue").innerText = "₹" + totalRevenue;

  // Overdue table
  const overdueTable = el("overdueTable");
  if (overdueTable) {
    overdueTable.innerHTML = !overdueList.length
      ? `<tr><td colspan="4" style="text-align:center;color:#64748b;padding:16px">No overdue books 🎉</td></tr>`
      : overdueList
          .map((i) => {
            const d = parseDate(i.returnDate);
            const daysLate = Math.floor((now - d) / 86400000);
            // BUG FIX: added overdue-row class so styling is applied in reports too
            return `<tr class="overdue-row">
            <td>${i.mid}</td>
            <td>${i.bookName || i.bookCode}</td>
            <td>${i.returnDate}</td>
            <td>${daysLate} day(s) — <strong>₹${daysLate * 2}</strong></td>
          </tr>`;
          })
          .join("");
  }

  // Expiring memberships
  const expiringTable = el("expiringTable");
  if (expiringTable) {
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 30);
    const expiring = members.filter((m) => {
      const d = parseDate(m.expiry);
      return d && d >= now && d <= soon;
    });
    expiringTable.innerHTML = !expiring.length
      ? `<tr><td colspan="4" style="text-align:center;color:#64748b;padding:16px">No memberships expiring in 30 days.</td></tr>`
      : expiring
          .map((m) => {
            const daysLeft = Math.floor((parseDate(m.expiry) - now) / 86400000);
            return `<tr><td>${m.id}</td><td>${m.name}</td><td>${m.expiry}</td><td>${daysLeft} day(s)</td></tr>`;
          })
          .join("");
  }

  // Top 5 most issued books
  const bookCount = {};
  issues.forEach((i) => {
    const key = i.bookName || i.bookCode;
    bookCount[key] = (bookCount[key] || 0) + 1;
  });
  const popularTable = el("popularTable");
  if (popularTable) {
    const sorted = Object.entries(bookCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    popularTable.innerHTML = !sorted.length
      ? `<tr><td colspan="2" style="text-align:center;color:#64748b;padding:16px">No issue data yet.</td></tr>`
      : sorted
          .map(([name, count]) => `<tr><td>${name}</td><td>${count}</td></tr>`)
          .join("");
  }
}

// ── CSV download util ─────────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = "none";
}
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop"))
    e.target.style.display = "none";
});

// ── Single unified window.onload ──────────────────────────────────────────────
// BUG FIX: All body onload= attributes removed from HTML. This single handler
// replaces them all, eliminating double-execution on every page that had both.
// Pages are detected by unique element IDs so only the right logic runs.
window.onload = async function () {
  setActiveLink();

  if (document.getElementById("statMembers")) {
    await loadStats();
    return;
  }
  if (document.getElementById("rTotalMembers")) {
    await loadReports();
    return;
  }
  if (document.getElementById("memberTable")) {
    await loadMembers();
    return;
  }
  if (document.getElementById("bookTable")) {
    await loadBooks();
    return;
  }
  if (document.getElementById("issueTable")) {
    await loadIssues();
    return;
  }

  // Add-member page
  if (document.getElementById("mid")) {
    members = await apiGet("/members");
    generateMemberId();
  }
  // Add-book page
  if (document.getElementById("bcode")) {
    books = await apiGet("/books");
    generateBookCode();
  }
};
