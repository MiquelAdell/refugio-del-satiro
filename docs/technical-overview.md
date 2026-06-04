# Refugio del Sátiro — Technical Overview

This document explains how the lending system works, from the database to the
browser, and how everything fits together on the server. It's written for
someone who knows Python and has used tools like PythonAnywhere but hasn't
built a web app with login, APIs, or containers before.

We'll build the concepts layer by layer, starting from the data and working up
to the browser.

---

## 1. The database: where the data lives

### What is SQLite?

The lending system stores all its data in a **single file** called `refugio.db`.
This file is a SQLite database — think of it as an Excel workbook where each
sheet is a "table" with rows and columns, except it's designed for programs to
read and write very fast.

Unlike databases you might have heard of (PostgreSQL, MySQL), SQLite doesn't
need a separate server running. The Python code opens the file directly, reads
and writes to it, and closes it. That's it. The file lives on the server's
disk, and Docker (more on that later) makes sure it doesn't get deleted when
we update the code.

### What's inside the database?

Four tables:

| Table | What it stores |
|-------|---------------|
| **games** | The catalogue — name, image, player count, BGG rating. One row per game. |
| **members** | People in the association — name, email, password (encrypted), admin flag. |
| **loans** | Who borrowed what and when. Each row is one loan. If `returned_at` is empty, the game is still out. |
| **password_tokens** | One-time links for setting a password. Each token expires after 48 hours. |

### How does the database know its structure?

SQL migration files. These are numbered scripts (`001_initial.sql`,
`002_add_is_active.sql`, etc.) that the system runs in order when it starts.
Each script creates or modifies tables. The database keeps track of which
scripts it has already run, so it never applies the same one twice.

This is similar to how you might version a Google Sheets template — except
here the "template" is code, and applying it is automatic.

---

## 2. How a web page gets data from the database

This is where things start being different from a static website. On a static
site, the browser downloads an HTML file and that's it — all the content is
already in the file. On a dynamic site like the lending system, the page loads
in two steps:

### Step 1: The browser downloads the "app shell"

When you visit `/prestamos`, the browser downloads a single HTML file plus some
JavaScript and CSS. This is the React application — it's like a blank
container that knows *how* to display games, loans, and members, but doesn't
have the actual data yet.

### Step 2: The JavaScript asks the server for data

Once the app shell is loaded, the JavaScript code says: "OK, now I need the
list of games." It sends a request to the server:

```
GET /prestamos/api/games
```

The server (Python, running FastAPI) receives this request, opens the database
file, runs a query (`SELECT * FROM games ...`), and sends back the results as
JSON — a structured text format that JavaScript can easily parse:

```json
[
  {
    "id": 1,
    "name": "Catan",
    "thumbnail_url": "https://cf.geekdo-images.com/...",
    "status": "available"
  },
  {
    "id": 2,
    "name": "Carcassonne",
    "status": "lent",
    "borrower_display_name": "Pau"
  }
]
```

The React app takes this JSON and renders the game cards you see on screen.

### Why not just put the data in the HTML?

Because the data changes. When someone borrows a game, the next person who
loads the page needs to see it as "lent". The database is the single source of
truth, and every page load gets fresh data from it.

### Analogy with PythonAnywhere

On PythonAnywhere, your Python scripts can read and write files on the server.
This is the same idea — except instead of reading a CSV or text file, the
Python code reads a SQLite database. And instead of printing results to a
console, it sends them as JSON over HTTP to a browser.

---

## 3. Login: how the system knows who you are

### The problem

HTTP (the protocol browsers use) is **stateless**. Every request the browser
sends is independent — the server doesn't automatically remember who you are
between one click and the next. We need a mechanism to say "this request comes
from Maria, who already proved her identity 3 minutes ago."

### Step by step

#### 3a. The member enters email + password

The login page is a form. When you click "Log in", the browser sends:

```
POST /prestamos/api/login
Body: { "email": "maria@example.com", "password": "her-password" }
```

#### 3b. The server checks the password

The server looks up Maria in the `members` table by email. It finds her row,
which contains a `password_hash` — this is **not** the password itself, but a
one-way mathematical transformation of it (using an algorithm called bcrypt).

The server takes the password Maria just typed, applies the same
transformation, and checks if the result matches what's stored. If it does,
she's in. If not, the server returns an error.

> **Why store a hash instead of the password?** If someone steals the
> database, they get hashes, not passwords. You can't reverse a hash back
> into the original password (in practice). This is a standard security
> measure.

#### 3c. The server creates a token and sets a cookie

Now the server knows Maria is who she says she is. It creates a **JWT** (JSON
Web Token) — a small, signed piece of data that says "member #5 logged in at
14:30, valid until April 28th". The server signs this with a secret key that
only the server knows, so nobody can forge one.

The server sends this token back to the browser inside a **cookie** — a small
piece of data the browser stores and automatically includes in every future
request to the same website.

```
Set-Cookie: session_token=eyJhbGciOi...; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

Important properties of this cookie:

| Property | What it means |
|----------|--------------|
| `HttpOnly` | JavaScript on the page **cannot** read this cookie. Only the browser itself can send it. This prevents a type of attack called XSS. |
| `SameSite=Lax` | The cookie is only sent with requests to our site, not to other sites. This prevents a type of attack called CSRF. |
| `Max-Age=604800` | The cookie lasts 7 days (604800 seconds). After that, the member has to log in again. |

#### 3d. Subsequent requests include the cookie automatically

From now on, every time the browser makes a request to our server, it
automatically attaches the cookie. The server reads the JWT from the cookie,
verifies the signature, extracts "member #5", and knows who's asking.

```
GET /prestamos/api/members/me
Cookie: session_token=eyJhbGciOi...
→ Server: "This is Maria (member #5), she's active, here's her profile"
```

#### 3e. Logout

When Maria clicks "Log out", the browser sends a request to `/api/logout`. The
server responds with an instruction to delete the cookie:

```
Set-Cookie: session_token=; Max-Age=0
```

The browser removes the cookie. Future requests won't include it, so the
server treats Maria as anonymous again.

### Visual summary

```
┌─────────────┐                    ┌─────────────┐
│   Browser    │                    │   Server    │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  POST /login {email, password}   │
       │─────────────────────────────────>│
       │                                  │  Look up email in DB
       │                                  │  Verify password hash
       │                                  │  Create JWT
       │  200 OK + Set-Cookie: JWT        │
       │<─────────────────────────────────│
       │                                  │
       │  GET /api/games                  │
       │  Cookie: session_token=JWT       │
       │─────────────────────────────────>│
       │                                  │  Read JWT from cookie
       │                                  │  Verify signature
       │                                  │  → This is Maria
       │  200 OK + [games JSON]           │
       │<─────────────────────────────────│
```

---

## 4. How members get their password

Members don't "register" themselves. An admin imports them from a CSV file
(the member list the association already has). Once a member exists in the
database with their real email on file, there are **two ways** they can end
up with a working password — both produce the same kind of one-time link:

```
https://refugidelsatiro.cat/prestamos/set-password?token=a3f8c9d1e7...
```

**Option A — Admin onboards the member.** At import time the system generates
a unique, random, one-time link for each new member, and the admin shares it
manually (WhatsApp, email, Signal, in person, etc.). This is how members get
in on day one, before they have any credentials.

**Option B — Member self-serves a reset.** Once the member has been imported
(so the system knows their email), they can hit the "I forgot my password"
form themselves and enter their email. The server creates a fresh token and
emails the link to the registered address. This covers forgotten passwords
and any later resets, without admin involvement.

Either way, when the member clicks the link:

1. The browser shows a "Set your password" form.
2. The member types their desired password.
3. The server checks the token is valid (exists, not expired, not already used).
4. The server hashes the password and stores it in the `members` table.
5. The token is marked as "used" so it can't be reused.

This avoids the need for separate email verification — the link *is* the
verification, and only the holder of the registered address can receive it
in Option B.

---

## 5. The server: Docker and Caddy

### What's running on the server?

The lending system runs on a VPS (Virtual Private Server) — a Linux machine in
a data centre that we rent. On this machine, two programs run side by side:

| Program | Role |
|---------|------|
| **Caddy** | The "doorman". It receives all web traffic from the internet, handles HTTPS encryption (automatic, no manual certificate management), and decides where to send each request. |
| **FastAPI (Python)** | The application itself. It processes API requests, talks to the database, and serves the React frontend. |

### What is Docker?

Docker is a tool that packages an application with everything it needs to run
(Python version, libraries, built frontend files) into an isolated
"container". Think of it like a lightweight virtual machine, but much faster.

Why use it?

- **Reproducibility.** The container runs the same on my laptop, on a
  colleague's laptop, and on the server. No "it works on my machine" problems.
- **Isolation.** The app can't accidentally break the server's system files or
  other apps.
- **Easy updates.** To update, we rebuild the container and restart it. If
  something goes wrong, we can roll back to the previous version.

### Docker Compose: running multiple containers together

We use Docker Compose to define our two containers (Caddy + the app) and how
they connect:

```
┌─────────────────────────────────────────────────────┐
│ The Server (VPS)                                    │
│                                                     │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │  Caddy container     │  │  App container      │  │
│  │                      │  │                     │  │
│  │  Ports 80/443 ←──────│──│→ Port 8000          │  │
│  │  (internet-facing)   │  │  (internal only)    │  │
│  │                      │  │                     │  │
│  │  /prestamos/* ────────│──│→ FastAPI + React    │  │
│  │  / ──→ static files  │  │                     │  │
│  │  (the existing site) │  │  refugio.db 📁      │  │
│  └──────────────────────┘  └─────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key point for the future website integration:** Caddy currently serves the
root path `/` from a folder of static files (`deploy/wip/`). This is where
the existing site lives. Everything under `/prestamos/` gets forwarded to
the lending app. Both coexist on the same domain.

### Comparison with PythonAnywhere

| Concept | PythonAnywhere | Our setup |
|---------|---------------|-----------|
| Web server | PythonAnywhere provides one | Caddy (we configure it) |
| Python runtime | Provided, you pick the version | Inside a Docker container |
| Files | Directly on the server filesystem | Inside containers + persistent volumes for the DB |
| HTTPS | Automatic | Automatic (Caddy + Let's Encrypt) |
| Deploy | Upload files or `git pull` | `git push` triggers automatic deploy |

---

## 6. Automatic deployment on git push

One of the biggest quality-of-life features: when we push code to the
`development` branch on GitHub, the server updates itself automatically.

### How it works

```
Developer pushes to `development` branch on GitHub
        │
        ▼
GitHub Actions (CI/CD) detects the push
        │
        ▼
GitHub connects to our server via SSH (secure remote access)
        │
        ▼
Runs deploy/deploy.sh on the server, which:
  1. git pull          → downloads the latest code
  2. docker compose    → rebuilds containers with new code
     up -d --build
  3. refugio migrate   → applies any new database migrations
  4. refugio           → re-imports game data from BoardGameGeek
     import-games
  5. refugio           → updates game details (images, ratings, etc.)
     enrich-games
```

The whole process takes about 2 minutes. No need to SSH into the server
manually.

### What are GitHub Actions?

GitHub Actions is a built-in automation system in GitHub. You define a
"workflow" (a YAML file in `.github/workflows/`) that says "when X happens, do
Y". Ours says: "when someone pushes to `development`, SSH into the server and
run the deploy script."

---

## 7. Scripts: importing data and managing the system

The lending system has a command-line tool called `refugio` (like a terminal
command) that handles administrative tasks. These are similar to Python scripts
you might run on PythonAnywhere — they operate on the database directly.

| Command | What it does |
|---------|-------------|
| `refugio migrate` | Applies database schema changes (creates tables, adds columns). |
| `refugio import-games` | Fetches the game list from BoardGameGeek (the association's collection is registered there) and saves it to the database. |
| `refugio import-games data/file.json` | Same, but from a local JSON file instead of the BGG API. |
| `refugio enrich-games` | Goes back to BGG to fetch extra details: player count, play time, ratings, full-size images. |
| `refugio import-members members.csv` | Reads a CSV with the member list and creates accounts in the database. Generates one-time password links. |

These commands run inside the Docker container. On the server, you'd run them
like:

```bash
docker compose exec app refugio migrate
```

### Where does the game data come from?

BoardGameGeek (BGG) has a public API. The association has a BGG user called
`RefugioDelSatiro` with their collection registered. Our import script fetches
this collection via the API, parses the XML response, and saves each game to
the database. This means the association manages their collection on BGG (which
they were already doing), and the website stays in sync automatically.

---

## 8. The agentic development workflow

The lending system is developed with the help of AI coding agents — tools that
can read code, propose changes, and write implementations. Here's how this
works in practice.

### What's in the repository

```
refugio-del-satiro/
├── .claude/
│   └── CLAUDE.md          ← Instructions for the AI agent: coding conventions,
│                             architecture rules, what to do and what not to do
│
├── openspec/
│   ├── config.yaml        ← Project definition: tech stack, directory structure,
│   │                         code conventions, testing strategy
│   ├── specs/             ← Formal specifications (feature descriptions)
│   ├── designs/           ← Design documents and diagrams
│   └── changes/           ← Change proposals: each change has a description,
│                             design, list of tasks, and implementation notes
│
├── tasks/
│   ├── prd-refugio-del-satiro.md   ← Product Requirements Document:
│   │                                  user stories, requirements, decisions
│   └── lending-redesign/           ← Planning docs for future redesign
│
├── backend/               ← Python code (FastAPI, domain logic, database)
├── frontend/              ← TypeScript code (React, UI components)
├── tests/                 ← Automated tests
└── e2e/                   ← End-to-end browser tests (Playwright)
```

### How a change gets made

1. **I describe what I want** in natural language (e.g. "add a filter to show
   only available games").

2. **The agent reads the context**: `CLAUDE.md` for conventions, `openspec/`
   for architecture, existing code for patterns.

3. **The agent proposes a change** — either as an OpenSpec change proposal
   (with design and task breakdown) or directly as code, depending on
   complexity.

4. **I review and approve** (or ask for adjustments).

5. **The agent implements**, following the project's architecture (Clean
   Architecture — domain logic separate from database code, separate from API
   code).

6. **Tests are written** alongside the implementation.

7. **The code is pushed** to GitHub, which triggers the automatic deployment.

### What the site maintainer needs to know

- The `.claude/CLAUDE.md` file is like a "briefing document" for the AI. It
  describes the project's rules so the AI follows them consistently.
- The `openspec/` folder is a structured way to document what the system
  should do (specs) and how changes should be made (change proposals). It's
  both documentation and a workflow tool.
- The `tasks/prd-refugio-del-satiro.md` file is the Product Requirements
  Document — the most complete description of what the lending system should
  do, written as user stories.
- When we integrate the existing site with the lending system, we'll create
  new OpenSpec change proposals that describe what needs to change, break them
  into tasks, and implement them one by one.

---

## 9. How everything connects: the full picture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT                                   │
│                                                                      │
│  Developer + AI Agent                                                │
│       │                                                              │
│       ▼                                                              │
│  Write code, tests, specs                                            │
│       │                                                              │
│       ▼                                                              │
│  git push to `development`                                           │
│       │                                                              │
└───────┼──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     GITHUB (code hosting)                            │
│                                                                      │
│  Repository stores all code, specs, and configuration                │
│  GitHub Actions detects the push and triggers deployment             │
│       │                                                              │
└───────┼──────────────────────────────────────────────────────────────┘
        │ SSH
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        SERVER (VPS)                                   │
│                                                                      │
│  deploy.sh runs:                                                     │
│    git pull → docker compose up --build → migrate → import           │
│                                                                      │
│  ┌─────────────────────┐     ┌──────────────────────────────┐        │
│  │  Caddy              │     │  App (Docker container)      │        │
│  │                     │     │                              │        │
│  │  /  → static site   │     │  FastAPI (Python)            │        │
│  │     (the existing  │     │    ├─ API routes             │        │
│  │           site)     │     │    ├─ Domain logic            │        │
│  │                     │     │    ├─ SQLite database         │        │
│  │  /prestamos/* ──────────→  │    └─ React frontend (built) │        │
│  │                     │     │                              │        │
│  │  HTTPS (automatic)  │     │  refugio.db  📁              │        │
│  └─────────────────────┘     └──────────────────────────────┘        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (user)                               │
│                                                                      │
│  1. Loads React app (HTML + JS + CSS)                                │
│  2. React fetches data from /prestamos/api/games → gets JSON          │
│  3. Renders game cards                                               │
│  4. User logs in → gets a cookie (JWT)                               │
│  5. Cookie sent automatically with every request                     │
│  6. User borrows/returns games → POST/PATCH requests with cookie     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Glossary

| Term | Meaning |
|------|---------|
| **API** | Application Programming Interface. A set of URLs the browser can call to get or send data. Like a menu at a restaurant — each URL is a dish you can order. |
| **bcrypt** | A password hashing algorithm. Turns "my-password" into "$2b$12$LJ3..." irreversibly. |
| **CI/CD** | Continuous Integration / Continuous Deployment. Fancy term for "code changes get tested and deployed automatically." |
| **Cookie** | A small piece of data the browser stores and sends with every request to the same website. Used to remember who you are. |
| **Docker** | Tool that packages an app with all its dependencies into an isolated "container" that runs the same everywhere. |
| **Docker Compose** | Tool to define and run multiple Docker containers together (e.g., Caddy + our app). |
| **FastAPI** | A Python web framework for building APIs. Similar to Flask, but with automatic validation and documentation. |
| **GitHub Actions** | GitHub's automation system. Runs tasks (like deployment) when events happen (like a push). |
| **HTTP / HTTPS** | The protocol browsers use to talk to servers. HTTPS adds encryption (the "S" stands for Secure). |
| **JSON** | JavaScript Object Notation. A text format for structured data: `{"name": "Catan", "players": 4}`. |
| **JWT** | JSON Web Token. A signed piece of data that proves who you are without the server needing to remember. |
| **Migration** | A script that changes the database structure (creates tables, adds columns). Applied in order. |
| **React** | A JavaScript framework for building user interfaces. The browser runs it to render pages. |
| **REST API** | A style of API where each URL represents a "resource" (games, loans, members) and HTTP methods (GET, POST, PATCH) represent actions. |
| **SQLite** | A lightweight database stored in a single file. No separate server needed. |
| **SSH** | Secure Shell. A way to remotely connect to a server's terminal. Like opening a command prompt on a remote computer. |
| **VPS** | Virtual Private Server. A Linux machine in a data centre that we rent and control. |
