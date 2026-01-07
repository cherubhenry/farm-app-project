# Farm App (Poultry) — Complete Build Guide
**Next.js + Google Sheets Database**

_Last updated: 2026-01-07_

---

## Table of Contents

0. [Exact Requirements](#0-exact-requirements-no-guesswork)
1. [Google Sheet Database Contract](#1-google-sheet-database-contract)
2. [Column Headers Contract](#2-column-headers-contract)
3. [System Architecture](#3-system-architecture-vercel-ready)
4. [UX Design Rules](#4-ux-design-rules-exact-behavior)
5. [Validation Rules](#5-validation-rules-client--server)
6. [Development Environment Setup](#6-development-environment-setup)
7. [Google Sheets API Setup](#7-google-sheets-api-setup)
8. [Environment Variables](#8-environment-variables-local--vercel)
9. [Codebase Structure](#9-codebase-structure-mandatory)
10. [API Contracts](#10-api-contracts-exact-payload-shapes)
11. [Backend-First Smoke Test](#11-backend-first-smoke-test-mandatory)
12. [Implement Real Validation](#12-implement-real-validation--append-logic)
13. [Build UI Pages and Components](#13-build-ui-pages-and-components)
14. [Deploy to Vercel](#14-deploy-to-vercel)

---

## 0) Exact Requirements (No Guesswork)

### 0.1 Core Purpose

This is a web app to record the **inputs and outputs** of a poultry farm.

**Key Recording Requirements:**
- At every instance/day that any **input** (feed, water, drugs/medicine) or **output** (eggs, cracked eggs) occurs, the farm must be able to record it
- **Mortality must be recorded daily**
- Recording must be possible **without prior initialization**

### 0.2 Pages (Exact)

The app has **exactly TWO pages** with this navigation flow:

#### **Page 1: Record Daily Production** (`/` - HOME PAGE)

- **Route:** `/`
- **Purpose:** First page users land on; primary data entry page
- **Key Features:**
  - Farm staff opens the app and records daily production here
  - Recording is possible **without initialization** being done first
  - Must include a button: **"Initialize Farm Rooms"** → navigates to `/init`
  - Date picker that defaults to today but allows recording for previous dates (common in farm operations)

#### **Page 2: Initialize Farm Rooms** (`/init`)

- **Route:** `/init`
- **Purpose:** Capture setup data for each poultry room
- **Setup Fields per Room:**
  - Number of birds
  - Number of feeders
  - Number of drinkers
  - Miscellaneous notes
- **Important:** No initialization needed for Egg Store / Feed Store / Sick Room
- **Must include a BIG button:** **"Proceed to Record Production"** → navigates back to `/`

### 0.3 Storage / Backend (Exact)

- **Backend:** Connects to an online **Google Sheet** (acts as database)
- **Data Organization:**
  - Each of the 6 poultry rooms writes daily records to a **different tab** (worksheet) in the same sheet
  - Egg Store, Feed Store, Sick Room each write to **their own tabs**
  - Initialization writes to **separate init tabs per room** (6 init tabs total)
- **Architecture:**
  - No authentication required
  - No user accounts
  - No caching required for v1
  - Deployed to **Vercel** (serverless)

### 0.4 Forms and Sections (Exact Functional Scope)

#### 0.4.1 Daily Production Recording Page (`/`)

This page must include **collapsed/accordion sections** for:

**Six Poultry Rooms (Room 1 – Room 6)**

Each room records daily:
- `feeds_eaten` — Number of feeds eaten (unit must be clearly stated in UI, e.g., "bags")
- `water_litres` — Litres of water drank
- `medicine_given` — Medicine/drugs administered (text)
- `eggs_produced` — Number of eggs produced
- `cracked_eggs` — Number of cracked eggs
- `mortality_count` — Number of bird deaths (daily)
- `miscellaneous` — Any additional notes

**Additional "Store/Room" Sections:**

**1) Egg Store**
- Tracks daily egg count in the store
- Fields:
  - `eggs_in_store_today` — Total eggs in store
  - `miscellaneous` — Explains why conventional daily sum doesn't match, or if eggs were purchased
- **Conditional UI:**
  - Ask: **"Were eggs purchased today?"** (boolean)
  - If **YES** → Show field for `purchased_count` (number of eggs purchased)
- **CRITICAL RULE:** `eggs_sold_today` must **NOT** exist anywhere. Do not include it in any tab, form, or logic.

**2) Feed Store**
- Tracks number of feed bags in the store
- Fields:
  - `feed_bags_in_store` — Total bags in store
  - `miscellaneous` — Additional notes
- **Conditional UI:**
  - Ask: **"Was feed brought today?"** (boolean)
  - If **YES** → Show field: **"How many bags?"** (`bags_brought_today`)

**3) Sick Room**
- Tracks number of sick birds in the sick room
- Fields:
  - `sick_birds_count` — Number of sick birds
- **Question:** **"Were they cared for today?"** (boolean: `were_they_cared_for_today`)
- Then submit

---

## 1) Google Sheet Database Contract

### 1.1 The Database Sheet

**Use this Google Sheet as the database:**

```
https://docs.google.com/spreadsheets/d/10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc/edit?usp=sharing
```

### 1.2 Tabs (Worksheets) That Must Exist

Create these tabs with **exact names** (case-sensitive):

#### **Daily Production Tabs:**
1. `Room 1`
2. `Room 2`
3. `Room 3`
4. `Room 4`
5. `Room 5`
6. `Room 6`
7. `Egg Store`
8. `Feed Store`
9. `Sick Room`

#### **Initialization Tabs:**
1. `Init - Room 1`
2. `Init - Room 2`
3. `Init - Room 3`
4. `Init - Room 4`
5. `Init - Room 5`
6. `Init - Room 6`

### 1.3 Append-Only Rule

**Critical:** This is an **append-only** system.

- ✅ **Always:** Append new rows to the end
- ❌ **Never:** Overwrite or update existing rows
- Every submission appends a new row with a fresh timestamp

---

## 2) Column Headers Contract

### Define Once, Treat as Contract

**All tabs must have headers in Row 1.** The app code must append values **in the exact header order specified below.**

### 2.1 Daily Production Tabs: `Room 1` … `Room 6`

**Headers (Row 1):**

| Column | Header Name        | Data Type | Description |
|--------|-------------------|-----------|-------------|
| 1      | `timestamp_iso`   | Text      | Server-generated ISO 8601 timestamp (e.g., `2026-01-07T14:30:00Z`) |
| 2      | `date`            | Text      | Date in YYYY-MM-DD format (from user selection) |
| 3      | `feeds_eaten`     | Integer   | Number of feed bags/units eaten (unit must be clear in UI) |
| 4      | `water_litres`    | Number    | Litres of water consumed |
| 5      | `medicine_given`  | Text      | Medicine/drugs administered |
| 6      | `eggs_produced`   | Integer   | Number of eggs produced |
| 7      | `cracked_eggs`    | Integer   | Number of cracked eggs |
| 8      | `mortality_count` | Integer   | Number of bird deaths |
| 9      | `miscellaneous`   | Text      | Additional notes |

### 2.2 Egg Store Tab: `Egg Store`

**Headers (Row 1):**

| Column | Header Name            | Data Type | Description |
|--------|------------------------|-----------|-------------|
| 1      | `timestamp_iso`        | Text      | Server-generated ISO timestamp |
| 2      | `date`                 | Text      | YYYY-MM-DD |
| 3      | `eggs_in_store_today`  | Integer   | Total eggs in store |
| 4      | `were_eggs_purchased`  | Boolean   | TRUE or FALSE |
| 5      | `purchased_count`      | Integer   | Number purchased (nullable unless `were_eggs_purchased` = TRUE) |
| 6      | `miscellaneous`        | Text      | Additional notes |

**❌ EXPLICIT RULE:** There is **NO** `eggs_sold_today` column. Do not add it anywhere.

### 2.3 Feed Store Tab: `Feed Store`

**Headers (Row 1):**

| Column | Header Name                 | Data Type | Description |
|--------|-----------------------------|-----------|-------------|
| 1      | `timestamp_iso`             | Text      | Server-generated ISO timestamp |
| 2      | `date`                      | Text      | YYYY-MM-DD |
| 3      | `feed_bags_in_store`        | Integer   | Total bags in store |
| 4      | `was_feed_brought_today`    | Boolean   | TRUE or FALSE |
| 5      | `bags_brought_today`        | Integer   | Bags brought (nullable unless `was_feed_brought_today` = TRUE) |
| 6      | `miscellaneous`             | Text      | Additional notes |

### 2.4 Sick Room Tab: `Sick Room`

**Headers (Row 1):**

| Column | Header Name                   | Data Type | Description |
|--------|-------------------------------|-----------|-------------|
| 1      | `timestamp_iso`               | Text      | Server-generated ISO timestamp |
| 2      | `date`                        | Text      | YYYY-MM-DD |
| 3      | `sick_birds_count`            | Integer   | Number of sick birds |
| 4      | `were_they_cared_for_today`   | Boolean   | TRUE or FALSE |

### 2.5 Initialization Tabs: `Init - Room 1` … `Init - Room 6`

**Headers (Row 1):**

| Column | Header Name      | Data Type | Description |
|--------|------------------|-----------|-------------|
| 1      | `timestamp_iso`  | Text      | Server-generated ISO timestamp |
| 2      | `date`           | Text      | YYYY-MM-DD for the initialization submission |
| 3      | `birds_count`    | Integer   | Number of birds in room |
| 4      | `feeders_count`  | Integer   | Number of feeders |
| 5      | `drinkers_count` | Integer   | Number of drinkers |
| 6      | `miscellaneous`  | Text      | Additional setup notes |

**Note:** Initialization is a snapshot. Re-initializing later appends a new row; no edits are made to existing rows.

---

## 3) System Architecture (Vercel-Ready)

### 3.1 Frontend (Next.js App Router)

**Framework:** Next.js 14+ with App Router

**Page Routes:**
- `/` → Record Daily Production (home page)
- `/init` → Initialize Farm Rooms

**Tech Stack:**
- TypeScript (mandatory)
- Tailwind CSS (styling)
- React 18+ (included with Next.js)

### 3.2 Backend (Serverless Functions)

**Use Next.js Route Handlers (API Routes in App Router):**

#### **API Route 1: Record Daily Data**
- **Route:** `POST /api/record-daily`
- **Purpose:** Appends daily records into:
  - `Room 1..6` tabs (for each room with data)
  - `Egg Store` tab (if egg store data provided)
  - `Feed Store` tab (if feed store data provided)
  - `Sick Room` tab (if sick room data provided)

#### **API Route 2: Initialize Rooms**
- **Route:** `POST /api/initialize`
- **Purpose:** Appends initialization records into:
  - `Init - Room 1..6` tabs (for each room being initialized)

### 3.3 Why Server Routes (Not Client-Side Google API)

**Security Reason:**
- Google service account credentials must **never** be exposed to browser clients
- Vercel runs route handlers securely on the server (Node.js runtime)
- Credentials are accessed via environment variables on the server only

**Architecture Flow:**
```
Client (Browser) → Next.js API Route (Server) → Google Sheets API
```

---

## 4) UX Design Rules (Exact Behavior)

### 4.1 Home Page `/` — Record Daily Production

#### **Top Section:**
- **Title:** `Record Daily Production`
- **Date Picker:**
  - Default to **today's date**
  - Allow recording for **previous dates** (common in farm operations)
- **Button:** `Initialize Farm Rooms`
  - Style: Prominent but secondary action
  - Action: Navigates to `/init`

#### **Form Sections (Collapsed/Accordion):**

Display these sections in collapsible accordions:
1. `Room 1`
2. `Room 2`
3. `Room 3`
4. `Room 4`
5. `Room 5`
6. `Room 6`
7. `Egg Store`
8. `Feed Store`
9. `Sick Room`

**Default State:** All sections collapsed (to reduce visual overwhelm)

#### **Submission Behavior:**
- **One "Submit Daily Record" button** at the bottom of the page
- **Partial Submission Allowed:** Users can fill only some sections and submit
- **Definition of "Filled Section":**
  - A section is considered "filled" if **at least one** of its fields contains a value
  - Server must ignore completely empty sections

#### **Append Behavior (Server-Side):**
- For each poultry room that contains entered values:
  - Append one row to that room's tab (`Room 1..6`)
- If Egg Store section has values:
  - Append one row to `Egg Store` tab
- If Feed Store section has values:
  - Append one row to `Feed Store` tab
- If Sick Room section has values:
  - Append one row to `Sick Room` tab

#### **After Submission:**
- Show success message: **"✅ Daily record saved!"**
- Clear form fields (optional, or keep for reference)
- Disable submit button while submitting (prevent double-submit)

### 4.2 Init Page `/init` — Initialize Farm Rooms

#### **Top Section:**
- **Title:** `Initialize Farm Rooms`
- **Big Button:** `Proceed to Record Production`
  - Style: Large, prominent, primary action
  - Action: Navigates back to `/`

#### **Form Sections (Collapsed/Accordion):**

Display these sections in collapsible accordions:
1. `Init - Room 1`
2. `Init - Room 2`
3. `Init - Room 3`
4. `Init - Room 4`
5. `Init - Room 5`
6. `Init - Room 6`

**Default State:** All sections collapsed

#### **Submission Behavior:**
- **One "Save Initialization" button** at the bottom
- **Partial Submission Allowed:** Users can initialize only some rooms and submit

#### **Append Behavior (Server-Side):**
- For each init-room section that contains values:
  - Append one row into its corresponding `Init - Room X` tab

#### **After Submission:**
- Show success message: **"✅ Initialization saved!"**
- Provide quick link back to `/` for immediate data entry

---

## 5) Validation Rules (Client + Server)

**Validation must exist on BOTH client and server** for security and UX.

### 5.1 General Rules

- `date` is **required** on both endpoints
  - Format: YYYY-MM-DD
  - Must be a valid date
- `timestamp_iso` is **generated on the server**
  - Client never sends it
  - Server creates it at append time using `new Date().toISOString()`

### 5.2 Numeric Fields

**Rules for all numeric fields:**
- Must be **integers** (or accepted as number then validated as integer)
- Must be **>= 0** (non-negative)
- **Empty is allowed** if that section is not being submitted
- **Null/undefined is allowed** for optional fields

**Numeric Fields:**
- `feeds_eaten`
- `water_litres`
- `eggs_produced`
- `cracked_eggs`
- `mortality_count`
- `eggs_in_store_today`
- `purchased_count`
- `feed_bags_in_store`
- `bags_brought_today`
- `sick_birds_count`
- `birds_count`
- `feeders_count`
- `drinkers_count`

### 5.3 Conditional Validation Rules

#### **Egg Store Section:**

**Rule for `purchased_count`:**
- Field: `were_eggs_purchased` (boolean: true/false)
- **If `were_eggs_purchased = true`:**
  - `purchased_count` is **required**
  - Must be integer >= 0
- **If `were_eggs_purchased = false`:**
  - `purchased_count` must be **empty/null**

**Client Behavior:**
- Only show `purchased_count` input field when `were_eggs_purchased` is checked/true

**Server Validation:**
```typescript
if (were_eggs_purchased === true && !purchased_count) {
  throw new Error("purchased_count is required when were_eggs_purchased is true");
}
if (were_eggs_purchased === false && purchased_count != null) {
  throw new Error("purchased_count must be null when were_eggs_purchased is false");
}
```

#### **Feed Store Section:**

**Rule for `bags_brought_today`:**
- Field: `was_feed_brought_today` (boolean: true/false)
- **If `was_feed_brought_today = true`:**
  - `bags_brought_today` is **required**
  - Must be integer >= 0
- **If `was_feed_brought_today = false`:**
  - `bags_brought_today` must be **empty/null**

**Client Behavior:**
- Only show `bags_brought_today` input field when `was_feed_brought_today` is checked/true

**Server Validation:**
```typescript
if (was_feed_brought_today === true && !bags_brought_today) {
  throw new Error("bags_brought_today is required when was_feed_brought_today is true");
}
if (was_feed_brought_today === false && bags_brought_today != null) {
  throw new Error("bags_brought_today must be null when was_feed_brought_today is false");
}
```

#### **Sick Room Section:**

**Rule for `were_they_cared_for_today`:**
- If Sick Room section is being submitted:
  - `were_they_cared_for_today` is **required** (must be true or false)

---

## 6) Development Environment Setup

### 6.1 Prerequisites

**Install these before starting:**

1. **Node.js LTS** (v20.x recommended)
   - Download from: https://nodejs.org/
   - Verify: `node -v` (should show v20.x.x)

2. **Git**
   - macOS: Included with Xcode Command Line Tools
   - Verify: `git --version`

3. **pnpm** (package manager)
   - Enable via Corepack (included with Node.js 20+)

**Enable pnpm:**

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

Expected output: `9.x.x` or similar

---

### 6.2 Create Next.js Project

#### 6.2.1 Create the Project

Run this command to create a new Next.js project with all required configurations:

```bash
pnpm create next-app@latest farm-app \
  --ts \
  --eslint \
  --app \
  --src-dir \
  --tailwind \
  --import-alias "@/*"
```

**Flags Explained:**
- `--ts` → TypeScript
- `--eslint` → ESLint for code quality
- `--app` → Use App Router (not Pages Router)
- `--src-dir` → Use `src/` directory structure
- `--tailwind` → Include Tailwind CSS
- `--import-alias "@/*"` → Enable `@/` import alias for cleaner imports

#### 6.2.2 Navigate and Start Dev Server

```bash
cd farm-app
pnpm dev
```

Open in browser: **http://localhost:3000**

You should see the default Next.js welcome page.

#### 6.2.3 Verify Project Structure

Confirm these directories/files exist:

```
farm-app/
├── src/
│   ├── app/              ← App Router (pages go here)
│   │   ├── page.tsx      ← Home page
│   │   ├── layout.tsx    ← Root layout
│   │   └── globals.css   ← Global styles (Tailwind)
├── public/               ← Static assets
├── tsconfig.json         ← TypeScript config
├── tailwind.config.ts    ← Tailwind config
├── package.json
└── pnpm-lock.yaml
```

---

#### 6.2.4 Create Required Folders Early

**Do not skip this step.** Create these folders now to avoid path issues later:

```bash
mkdir -p src/app/init
mkdir -p src/app/api/record-daily
mkdir -p src/app/api/initialize
mkdir -p src/components
mkdir -p src/lib
```

**Folder Structure After Creation:**

```
src/
├── app/
│   ├── api/
│   │   ├── record-daily/   ← POST /api/record-daily
│   │   └── initialize/     ← POST /api/initialize
│   ├── init/               ← /init page
│   ├── page.tsx            ← / (home)
│   └── layout.tsx
├── components/             ← React components
└── lib/                    ← Utility/helper code
```

---

### 6.3 Install Dependencies

#### 6.3.1 Required Dependencies

```bash
pnpm add googleapis zod
```

**Package Purposes:**
- `googleapis` → Google Sheets API client
- `zod` → Schema validation (shared between client and server)

#### 6.3.2 Optional Dependencies (Recommended)

```bash
pnpm add clsx
```

**Package Purpose:**
- `clsx` → Utility for constructing className strings conditionally

---

### 6.4 Dependency Management + Vercel Compatibility

#### 6.4.1 Lockfile Rules

**Critical for Vercel:**
- `pnpm-lock.yaml` must exist and be committed to Git
- **Do not use** `yarn.lock` or `package-lock.json` (causes conflicts)
- If switching from npm/yarn to pnpm:
  ```bash
  rm package-lock.json yarn.lock
  pnpm install
  ```

#### 6.4.2 Node Version Pinning

**Add this to `package.json`:**

```json
{
  "engines": {
    "node": ">=20 <21"
  }
}
```

**Verify locally:**

```bash
node -v
```

Expected output: `v20.x.x`

#### 6.4.3 Baseline Build Verification

**Test production build locally before deploying:**

```bash
pnpm build
pnpm start
```

**Expected behavior:**
- Build completes without errors
- Server starts on port 3000
- App loads at **http://localhost:3000**

**Stop the server:** Press `Ctrl+C`

**Return to dev mode:**

```bash
pnpm dev
```

---

## 7) Google Sheets API Setup

### 7.1 Create Google Cloud Project

1. Go to: **https://console.cloud.google.com/**
2. Click **"Select a project"** → **"New Project"**
3. **Project Name:** `farm-app-sheets` (or your choice)
4. Click **"Create"**
5. Wait for project to be created (10-30 seconds)
6. Select the new project from the dropdown

### 7.2 Enable Google Sheets API

1. In the project dashboard, go to: **"APIs & Services" → "Library"**
2. Search: `Google Sheets API`
3. Click on **"Google Sheets API"**
4. Click **"Enable"**
5. Wait for API to be enabled

### 7.3 Create Service Account

**What is a Service Account?**
- A special type of account for server-to-server authentication
- Does not require OAuth user consent
- Perfect for serverless functions

**Steps:**

1. Go to: **"APIs & Services" → "Credentials"**
2. Click **"Create Credentials" → "Service Account"**
3. **Service Account Details:**
   - **Service account name:** `farm-app-writer` (or your choice)
   - **Service account ID:** (auto-generated)
   - Click **"Create and Continue"**
4. **Grant Role (Optional):**
   - Skip this step (click **"Continue"**)
5. **Grant Users Access (Optional):**
   - Skip this step (click **"Done"**)

### 7.4 Create and Download Service Account Key

1. In **"Credentials"** page, find your service account
2. Click on the service account email (e.g., `farm-app-writer@farm-app-sheets.iam.gserviceaccount.com`)
3. Go to **"Keys"** tab
4. Click **"Add Key" → "Create new key"**
5. **Key type:** Select **JSON**
6. Click **"Create"**
7. A JSON file will download automatically (e.g., `farm-app-sheets-abc123.json`)

**⚠️ IMPORTANT:**
- **Do NOT commit this file to Git**
- **Do NOT share this file publicly**
- Store it securely on your local machine

### 7.5 Share Google Sheet with Service Account

**Why:** The service account needs permission to write to the Google Sheet.

**Steps:**

1. **Open the downloaded JSON key file** in a text editor
2. **Find and copy** the `client_email` field:
   ```json
   {
     "client_email": "farm-app-writer@farm-app-sheets.iam.gserviceaccount.com",
     ...
   }
   ```
3. **Open the Google Sheet:**
   ```
   https://docs.google.com/spreadsheets/d/10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc/edit
   ```
4. Click **"Share"** button (top-right)
5. **Paste the `client_email`** into the "Add people and groups" field
6. **Set permission:** **Editor**
7. **Uncheck:** "Notify people" (service accounts don't receive emails)
8. Click **"Share"** or **"Send"**

**✅ Verification:**
- The service account email should now appear in the "Share with people and groups" list

---

## 8) Environment Variables (Local + Vercel)

### 8.1 Base64 Encode Service Account JSON

**Why Base64?**
- Environment variables are strings
- JSON contains newlines and special characters that can break .env files
- Base64 encoding ensures safe storage

**Encode the JSON file:**

#### macOS / Linux:

```bash
base64 -i service-account.json | pbcopy
```

(The Base64 string is now in your clipboard)

#### Linux (without pbcopy):

```bash
base64 -w 0 service-account.json
```

(Copy the output manually)

#### Windows (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | Set-Clipboard
```

---

### 8.2 Create `.env.local` (Local Development)

**Create this file in the project root:** `farm-app/.env.local`

**⚠️ NEVER COMMIT `.env.local` TO GIT**

**File contents:**

```env
GOOGLE_SA_JSON_BASE64="PASTE_BASE64_STRING_HERE"
GOOGLE_SHEET_ID="10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc"
```

**Notes:**
- Replace `PASTE_BASE64_STRING_HERE` with the actual Base64 string from step 8.1
- The `GOOGLE_SHEET_ID` is extracted from the sheet URL:
  ```
  https://docs.google.com/spreadsheets/d/10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc/edit
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         This is the SHEET_ID
  ```

**Verify `.gitignore` includes `.env.local`:**

```bash
cat .gitignore | grep .env.local
```

Expected output: `.env.local` (or `*.local`)

---

### 8.3 Configure Vercel Environment Variables

**When deploying to Vercel, you must add these environment variables.**

#### Steps:

1. Go to your Vercel project dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in the left sidebar
4. Add **two variables:**

**Variable 1:**
- **Key:** `GOOGLE_SA_JSON_BASE64`
- **Value:** (Paste the Base64 string)
- **Environments:** Check **Production** and **Preview**

**Variable 2:**
- **Key:** `GOOGLE_SHEET_ID`
- **Value:** `10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc`
- **Environments:** Check **Production** and **Preview**

5. Click **"Save"** for each variable

**⚠️ After adding/updating env vars:**
- **Redeploy the app** for changes to take effect
- Go to **"Deployments"** tab → click **"..."** on latest deployment → **"Redeploy"**

---

## 9) Codebase Structure (Mandatory)

### 9.1 Required File Structure

**The following structure must be created. Do not remove or rename these files.**

```
farm-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                          ← Home: Record Daily Production
│   │   ├── layout.tsx                        ← Root layout (default)
│   │   ├── globals.css                       ← Global styles (default)
│   │   ├── init/
│   │   │   └── page.tsx                      ← /init: Initialize Farm Rooms
│   │   └── api/
│   │       ├── record-daily/
│   │       │   └── route.ts                  ← POST /api/record-daily
│   │       └── initialize/
│   │           └── route.ts                  ← POST /api/initialize
│   ├── components/
│   │   ├── RecordDailyForm.tsx               ← UI for daily record (main form)
│   │   ├── InitRoomsForm.tsx                 ← UI for initialization
│   │   ├── RoomAccordion.tsx                 ← Accordion building block (reusable)
│   │   └── StoreSections.tsx                 ← Egg/Feed/Sick sections (optional split)
│   └── lib/
│       ├── env.ts                            ← Env parsing + Base64 decode (server only)
│       ├── sheets.ts                         ← Google Sheets client + append helpers
│       └── schema.ts                         ← Zod schemas (shared validation)
├── .env.local                                 ← Local env vars (DO NOT COMMIT)
├── .gitignore
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

### 9.2 File Responsibilities

#### **Pages:**

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page (`/`) — Record Daily Production |
| `src/app/init/page.tsx` | Init page (`/init`) — Initialize Farm Rooms |

#### **API Routes:**

| File | Purpose |
|------|---------|
| `src/app/api/record-daily/route.ts` | POST endpoint to append daily records to Google Sheets |
| `src/app/api/initialize/route.ts` | POST endpoint to append init records to Google Sheets |

#### **Components:**

| File | Purpose |
|------|---------|
| `src/components/RecordDailyForm.tsx` | Main form for daily production recording |
| `src/components/InitRoomsForm.tsx` | Form for room initialization |
| `src/components/RoomAccordion.tsx` | Reusable accordion/collapsible component |
| `src/components/StoreSections.tsx` | (Optional) Separate component for Egg/Feed/Sick sections |

#### **Library/Utilities:**

| File | Purpose |
|------|---------|
| `src/lib/env.ts` | **Server-only:** Parse and decode environment variables |
| `src/lib/sheets.ts` | **Server-only:** Google Sheets API client and append functions |
| `src/lib/schema.ts` | **Shared:** Zod validation schemas for API payloads |

---

## 10) API Contracts (Exact Payload Shapes)

### 10.1 POST `/api/record-daily`

#### **Request JSON Example:**

```json
{
  "date": "2026-01-07",
  "rooms": {
    "Room 1": {
      "feeds_eaten": 3,
      "water_litres": 80,
      "medicine_given": "Vitamin mix",
      "eggs_produced": 120,
      "cracked_eggs": 2,
      "mortality_count": 1,
      "miscellaneous": ""
    },
    "Room 2": {
      "feeds_eaten": 2,
      "water_litres": 70,
      "medicine_given": "",
      "eggs_produced": 95,
      "cracked_eggs": 0,
      "mortality_count": 0,
      "miscellaneous": "All good"
    }
  },
  "eggStore": {
    "eggs_in_store_today": 1000,
    "were_eggs_purchased": true,
    "purchased_count": 200,
    "miscellaneous": "Purchased eggs today"
  },
  "feedStore": {
    "feed_bags_in_store": 30,
    "was_feed_brought_today": true,
    "bags_brought_today": 10,
    "miscellaneous": ""
  },
  "sickRoom": {
    "sick_birds_count": 5,
    "were_they_cared_for_today": true
  }
}
```

#### **Request Rules:**

- `date` is **required** (YYYY-MM-DD)
- `rooms` is **optional** (object where keys are room names: `"Room 1"` to `"Room 6"`)
- `eggStore`, `feedStore`, `sickRoom` are **optional**
- Only send sections that have data (partial submission allowed)

#### **Server Behavior:**

1. Validate request body using Zod schema
2. Generate `timestamp_iso` for each row: `new Date().toISOString()`
3. For each room in `rooms`:
   - Append one row to corresponding tab (`Room 1..6`)
   - Use exact column order from Section 2.1
4. If `eggStore` is present:
   - Append one row to `Egg Store` tab
   - Use exact column order from Section 2.2
5. If `feedStore` is present:
   - Append one row to `Feed Store` tab
   - Use exact column order from Section 2.3
6. If `sickRoom` is present:
   - Append one row to `Sick Room` tab
   - Use exact column order from Section 2.4

#### **Response JSON Example (Success):**

```json
{
  "ok": true,
  "appended": [
    { "tab": "Room 1", "rows": 1 },
    { "tab": "Room 2", "rows": 1 },
    { "tab": "Egg Store", "rows": 1 },
    { "tab": "Feed Store", "rows": 1 },
    { "tab": "Sick Room", "rows": 1 }
  ]
}
```

#### **Response JSON Example (Validation Error):**

```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["rooms", "Room 1", "feeds_eaten"],
      "message": "Must be a non-negative integer"
    }
  ]
}
```

**HTTP Status Codes:**
- `200 OK` — Success
- `400 Bad Request` — Validation error
- `500 Internal Server Error` — Server/API error

---

### 10.2 POST `/api/initialize`

#### **Request JSON Example:**

```json
{
  "date": "2026-01-07",
  "rooms": {
    "Room 1": {
      "birds_count": 200,
      "feeders_count": 10,
      "drinkers_count": 8,
      "miscellaneous": ""
    },
    "Room 2": {
      "birds_count": 180,
      "feeders_count": 9,
      "drinkers_count": 7,
      "miscellaneous": "New batch arrived"
    }
  }
}
```

#### **Request Rules:**

- `date` is **required** (YYYY-MM-DD)
- `rooms` is **optional** (object where keys are room names: `"Room 1"` to `"Room 6"`)
- Only send rooms that are being initialized (partial submission allowed)

#### **Server Behavior:**

1. Validate request body using Zod schema
2. Generate `timestamp_iso` for each row: `new Date().toISOString()`
3. For each room in `rooms`:
   - Append one row to corresponding init tab (`Init - Room 1..6`)
   - Use exact column order from Section 2.5

#### **Response JSON Example (Success):**

```json
{
  "ok": true,
  "appended": [
    { "tab": "Init - Room 1", "rows": 1 },
    { "tab": "Init - Room 2", "rows": 1 }
  ]
}
```

#### **Response JSON Example (Validation Error):**

```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["rooms", "Room 1", "birds_count"],
      "message": "Must be a non-negative integer"
    }
  ]
}
```

**HTTP Status Codes:**
- `200 OK` — Success
- `400 Bad Request` — Validation error
- `500 Internal Server Error` — Server/API error

---

## 11) Backend-First Smoke Test (Mandatory)

### 11.1 Why Backend-First?

**Critical Principle:** Prove the Google Sheets integration works BEFORE building the UI.

**Benefits:**
- Catch authentication issues early
- Verify sheet access and append logic
- Avoid wasting time on UI if backend is broken

---

### 11.2 Create `src/lib/env.ts` (Environment Variable Parser)

**Purpose:** Safely load and decode environment variables on the server.

**File:** `src/lib/env.ts`

```typescript
// src/lib/env.ts
// Server-only: Parse and decode environment variables
// DO NOT import this file in client components

export function getGoogleServiceAccount() {
  const base64 = process.env.GOOGLE_SA_JSON_BASE64;
  if (!base64) {
    throw new Error("GOOGLE_SA_JSON_BASE64 environment variable is not set");
  }

  // Decode Base64 to JSON string
  const jsonString = Buffer.from(base64, "base64").toString("utf-8");

  // Parse JSON
  const credentials = JSON.parse(jsonString);

  // Normalize private_key (replace literal \n with actual newlines)
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return credentials;
}

export function getGoogleSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }
  return sheetId;
}
```

**⚠️ IMPORTANT:** Never import `env.ts` in client components (components that use React hooks or `"use client"`).

---

### 11.3 Create `src/lib/sheets.ts` (Google Sheets Client)

**Purpose:** Create authenticated Google Sheets API client and helper functions.

**File:** `src/lib/sheets.ts`

```typescript
// src/lib/sheets.ts
// Server-only: Google Sheets API client

import { google } from "googleapis";
import { getGoogleServiceAccount, getGoogleSheetId } from "./env";

// Create authenticated Sheets client
export function getSheetsClient() {
  const credentials = getGoogleServiceAccount();
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// Append a row to a specific tab
export async function appendRow(tabName: string, rowValues: any[]) {
  const sheets = getSheetsClient();
  const spreadsheetId = getGoogleSheetId();

  const range = `${tabName}!A1`; // Start at A1, auto-expands to append

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED", // Interprets values (dates, numbers, formulas)
    requestBody: {
      values: [rowValues], // 2D array: [[row1], [row2], ...]
    },
  });

  return response.data;
}
```

---

### 11.4 Create Temporary Smoke Test Route

**File:** `src/app/api/record-daily/route.ts` (temporary version)

```typescript
// src/app/api/record-daily/route.ts
// TEMPORARY: Smoke test to verify Google Sheets append works

import { NextResponse } from "next/server";
import { appendRow } from "@/lib/sheets";

export async function POST(request: Request) {
  try {
    // Hardcoded test data (exact column order from Section 2.1)
    const testRow = [
      new Date().toISOString(),       // timestamp_iso
      "2026-01-07",                   // date
      5,                              // feeds_eaten
      100,                            // water_litres
      "Test medicine",                // medicine_given
      150,                            // eggs_produced
      3,                              // cracked_eggs
      1,                              // mortality_count
      "Smoke test"                    // miscellaneous
    ];

    // Append to Room 1 tab
    await appendRow("Room 1", testRow);

    return NextResponse.json({ ok: true, message: "Smoke test passed" });
  } catch (error: any) {
    console.error("Smoke test failed:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 11.5 Run the Smoke Test

#### **Step 1: Start Dev Server**

```bash
pnpm dev
```

#### **Step 2: Send Test Request**

**Using `curl`:**

```bash
curl -X POST http://localhost:3000/api/record-daily \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-07"}'
```

**Expected Response:**

```json
{"ok":true,"message":"Smoke test passed"}
```

#### **Step 3: Verify in Google Sheet**

1. Open: https://docs.google.com/spreadsheets/d/10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc/edit
2. Go to **"Room 1"** tab
3. **Verify:** A new row appeared with test data

**Example Row:**

| timestamp_iso | date | feeds_eaten | water_litres | medicine_given | eggs_produced | cracked_eggs | mortality_count | miscellaneous |
|---------------|------|-------------|--------------|----------------|---------------|--------------|-----------------|---------------|
| 2026-01-07T14:30:00.000Z | 2026-01-07 | 5 | 100 | Test medicine | 150 | 3 | 1 | Smoke test |

---

### 11.6 Troubleshooting Smoke Test

#### **Error: "GOOGLE_SA_JSON_BASE64 environment variable is not set"**

**Solution:**
- Ensure `.env.local` exists in project root
- Ensure variable is spelled correctly
- Restart dev server: `Ctrl+C`, then `pnpm dev`

#### **Error: "Requested entity was not found"**

**Solution:**
- Verify `GOOGLE_SHEET_ID` in `.env.local` matches the actual sheet ID
- Verify sheet URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

#### **Error: "The caller does not have permission"**

**Solution:**
- Open Google Sheet
- Click "Share"
- Verify the service account email (`client_email` from JSON) is listed with "Editor" access
- If not, add it again

#### **Error: "Unable to parse range: Room 1!A1"**

**Solution:**
- Open Google Sheet
- Verify a tab named **exactly** `Room 1` exists (case-sensitive)
- If missing, create it
- Add headers in Row 1 (see Section 2.1)

---

### 11.7 Success Criteria

**✅ Smoke test passes if:**
1. API returns `{"ok":true}`
2. A new row appears in the `Room 1` tab
3. Row contains test data with correct timestamp

**🎉 Proceed to next section only after smoke test passes.**

---

## 12) Implement Real Validation + Append Logic

### 12.1 Create Zod Schemas

**File:** `src/lib/schema.ts`

```typescript
// src/lib/schema.ts
// Shared validation schemas for API payloads

import { z } from "zod";

// Shared schemas
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const nonNegativeInt = z.number().int().min(0);
const optionalNonNegativeInt = nonNegativeInt.optional();

// Daily room data
const roomDailySchema = z.object({
  feeds_eaten: optionalNonNegativeInt,
  water_litres: optionalNonNegativeInt,
  medicine_given: z.string().optional(),
  eggs_produced: optionalNonNegativeInt,
  cracked_eggs: optionalNonNegativeInt,
  mortality_count: optionalNonNegativeInt,
  miscellaneous: z.string().optional(),
});

// Egg Store
const eggStoreSchema = z
  .object({
    eggs_in_store_today: optionalNonNegativeInt,
    were_eggs_purchased: z.boolean(),
    purchased_count: optionalNonNegativeInt,
    miscellaneous: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.were_eggs_purchased && !data.purchased_count) {
        return false; // purchased_count required when were_eggs_purchased is true
      }
      return true;
    },
    {
      message: "purchased_count is required when were_eggs_purchased is true",
      path: ["purchased_count"],
    }
  );

// Feed Store
const feedStoreSchema = z
  .object({
    feed_bags_in_store: optionalNonNegativeInt,
    was_feed_brought_today: z.boolean(),
    bags_brought_today: optionalNonNegativeInt,
    miscellaneous: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.was_feed_brought_today && !data.bags_brought_today) {
        return false; // bags_brought_today required when was_feed_brought_today is true
      }
      return true;
    },
    {
      message: "bags_brought_today is required when was_feed_brought_today is true",
      path: ["bags_brought_today"],
    }
  );

// Sick Room
const sickRoomSchema = z.object({
  sick_birds_count: optionalNonNegativeInt,
  were_they_cared_for_today: z.boolean(),
});

// POST /api/record-daily payload
export const recordDailySchema = z.object({
  date: dateSchema,
  rooms: z.record(z.enum(["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"]), roomDailySchema).optional(),
  eggStore: eggStoreSchema.optional(),
  feedStore: feedStoreSchema.optional(),
  sickRoom: sickRoomSchema.optional(),
});

// Initialization room data
const roomInitSchema = z.object({
  birds_count: optionalNonNegativeInt,
  feeders_count: optionalNonNegativeInt,
  drinkers_count: optionalNonNegativeInt,
  miscellaneous: z.string().optional(),
});

// POST /api/initialize payload
export const initializeSchema = z.object({
  date: dateSchema,
  rooms: z.record(z.enum(["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"]), roomInitSchema).optional(),
});

// TypeScript types (inferred from schemas)
export type RecordDailyPayload = z.infer<typeof recordDailySchema>;
export type InitializePayload = z.infer<typeof initializeSchema>;
```

---

### 12.2 Implement `POST /api/record-daily`

**File:** `src/app/api/record-daily/route.ts` (replace smoke test version)

```typescript
// src/app/api/record-daily/route.ts
// POST endpoint to record daily production data

import { NextResponse } from "next/server";
import { recordDailySchema } from "@/lib/schema";
import { appendRow } from "@/lib/sheets";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate payload
    const data = recordDailySchema.parse(body);

    const timestamp_iso = new Date().toISOString();
    const appended: { tab: string; rows: number }[] = [];

    // Append rooms (Room 1..6)
    if (data.rooms) {
      for (const [roomName, roomData] of Object.entries(data.rooms)) {
        const row = [
          timestamp_iso,
          data.date,
          roomData.feeds_eaten ?? "",
          roomData.water_litres ?? "",
          roomData.medicine_given ?? "",
          roomData.eggs_produced ?? "",
          roomData.cracked_eggs ?? "",
          roomData.mortality_count ?? "",
          roomData.miscellaneous ?? "",
        ];
        await appendRow(roomName, row);
        appended.push({ tab: roomName, rows: 1 });
      }
    }

    // Append Egg Store
    if (data.eggStore) {
      const row = [
        timestamp_iso,
        data.date,
        data.eggStore.eggs_in_store_today ?? "",
        data.eggStore.were_eggs_purchased,
        data.eggStore.purchased_count ?? "",
        data.eggStore.miscellaneous ?? "",
      ];
      await appendRow("Egg Store", row);
      appended.push({ tab: "Egg Store", rows: 1 });
    }

    // Append Feed Store
    if (data.feedStore) {
      const row = [
        timestamp_iso,
        data.date,
        data.feedStore.feed_bags_in_store ?? "",
        data.feedStore.was_feed_brought_today,
        data.feedStore.bags_brought_today ?? "",
        data.feedStore.miscellaneous ?? "",
      ];
      await appendRow("Feed Store", row);
      appended.push({ tab: "Feed Store", rows: 1 });
    }

    // Append Sick Room
    if (data.sickRoom) {
      const row = [
        timestamp_iso,
        data.date,
        data.sickRoom.sick_birds_count ?? "",
        data.sickRoom.were_they_cared_for_today,
      ];
      await appendRow("Sick Room", row);
      appended.push({ tab: "Sick Room", rows: 1 });
    }

    return NextResponse.json({ ok: true, appended });
  } catch (error: any) {
    console.error("Error in /api/record-daily:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
```

---

### 12.3 Implement `POST /api/initialize`

**File:** `src/app/api/initialize/route.ts`

```typescript
// src/app/api/initialize/route.ts
// POST endpoint to initialize farm rooms

import { NextResponse } from "next/server";
import { initializeSchema } from "@/lib/schema";
import { appendRow } from "@/lib/sheets";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate payload
    const data = initializeSchema.parse(body);

    const timestamp_iso = new Date().toISOString();
    const appended: { tab: string; rows: number }[] = [];

    // Append initialization data
    if (data.rooms) {
      for (const [roomName, roomData] of Object.entries(data.rooms)) {
        const tabName = `Init - ${roomName}`;
        const row = [
          timestamp_iso,
          data.date,
          roomData.birds_count ?? "",
          roomData.feeders_count ?? "",
          roomData.drinkers_count ?? "",
          roomData.miscellaneous ?? "",
        ];
        await appendRow(tabName, row);
        appended.push({ tab: tabName, rows: 1 });
      }
    }

    return NextResponse.json({ ok: true, appended });
  } catch (error: any) {
    console.error("Error in /api/initialize:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
```

---

### 12.4 Test Real API Endpoints

#### **Test POST /api/record-daily:**

```bash
curl -X POST http://localhost:3000/api/record-daily \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-07",
    "rooms": {
      "Room 1": {
        "feeds_eaten": 3,
        "water_litres": 80,
        "medicine_given": "Vitamin mix",
        "eggs_produced": 120,
        "cracked_eggs": 2,
        "mortality_count": 1,
        "miscellaneous": ""
      }
    },
    "eggStore": {
      "eggs_in_store_today": 1000,
      "were_eggs_purchased": true,
      "purchased_count": 200,
      "miscellaneous": ""
    }
  }'
```

**Expected Response:**

```json
{
  "ok": true,
  "appended": [
    {"tab": "Room 1", "rows": 1},
    {"tab": "Egg Store", "rows": 1}
  ]
}
```

**Verify in Google Sheet:**
- `Room 1` tab: New row with data
- `Egg Store` tab: New row with data

#### **Test POST /api/initialize:**

```bash
curl -X POST http://localhost:3000/api/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-07",
    "rooms": {
      "Room 1": {
        "birds_count": 200,
        "feeders_count": 10,
        "drinkers_count": 8,
        "miscellaneous": "Initial setup"
      }
    }
  }'
```

**Expected Response:**

```json
{
  "ok": true,
  "appended": [
    {"tab": "Init - Room 1", "rows": 1}
  ]
}
```

**Verify in Google Sheet:**
- `Init - Room 1` tab: New row with data

---

## 13) Build UI Pages and Components

### 13.1 Create Home Page: `/` (Record Daily Production)

**File:** `src/app/page.tsx`

```typescript
// src/app/page.tsx
// Home page: Record Daily Production

import Link from "next/link";
import RecordDailyForm from "@/components/RecordDailyForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Record Daily Production
          </h1>
          <Link
            href="/init"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Initialize Farm Rooms
          </Link>
        </div>

        {/* Main Form */}
        <RecordDailyForm />
      </div>
    </main>
  );
}
```

---

### 13.2 Create Init Page: `/init` (Initialize Farm Rooms)

**File:** `src/app/init/page.tsx`

```typescript
// src/app/init/page.tsx
// Initialize Farm Rooms page

import Link from "next/link";
import InitRoomsForm from "@/components/InitRoomsForm";

export default function InitPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Initialize Farm Rooms
          </h1>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            Proceed to Record Production
          </Link>
        </div>

        {/* Init Form */}
        <InitRoomsForm />
      </div>
    </main>
  );
}
```

---

### 13.3 Create Components

Due to the length and complexity of the UI components, here are the key guidelines for building them:

#### **`src/components/RecordDailyForm.tsx`:**

**Responsibilities:**
- Manage entire form state (rooms, egg store, feed store, sick room)
- Date picker (default to today)
- Accordion/collapsible sections for each room/store
- Conditional rendering for Egg Store (purchased_count) and Feed Store (bags_brought_today)
- Submit button with loading state
- Success/error messages
- Call `POST /api/record-daily`

**Key Features:**
- Use `useState` for form data
- Use `fetch` to submit to `/api/record-daily`
- Disable submit button while submitting
- Show "✅ Daily record saved!" on success
- Show error message on failure
- Only send sections that have data (filter empty sections)

#### **`src/components/InitRoomsForm.tsx`:**

**Responsibilities:**
- Manage init form state (6 rooms)
- Date picker (default to today)
- Accordion sections for each room
- Submit button with loading state
- Success/error messages
- Call `POST /api/initialize`

**Key Features:**
- Similar structure to RecordDailyForm but simpler (only room init fields)
- Only send rooms that have data

#### **`src/components/RoomAccordion.tsx`:**

**Responsibilities:**
- Reusable collapsible/accordion component
- Used by both RecordDailyForm and InitRoomsForm

**Props:**
- `title` (e.g., "Room 1")
- `children` (form fields)
- `isOpen` (boolean)
- `onToggle` (function)

**Implementation Tips:**
- Use `<details>` and `<summary>` HTML elements for native accordion
- OR: Custom implementation with state + CSS transitions

#### **`src/components/StoreSections.tsx` (Optional):**

**Responsibilities:**
- Render Egg Store, Feed Store, Sick Room sections
- Can be part of RecordDailyForm or separate component

---

### 13.4 Client-Side UX Checklist

**Must-Have Features:**

✅ **Date Picker:**
- Default to today's date
- Allow selecting previous dates
- Use native `<input type="date">` or a library like `react-datepicker`

✅ **Accordion/Collapsible Sections:**
- All sections collapsed by default
- Click to expand/collapse
- Show indicator (arrow icon) for open/closed state

✅ **Conditional Fields:**
- Egg Store: Only show `purchased_count` when "Were eggs purchased today?" is YES
- Feed Store: Only show `bags_brought_today` when "Was feed brought today?" is YES

✅ **Submit Button:**
- Disable while submitting
- Show loading indicator (spinner or text)
- Text: "Submitting..." during submission

✅ **Success Message:**
- Show "✅ Daily record saved!" or "✅ Initialization saved!"
- Auto-hide after 5 seconds OR persist until next action

✅ **Error Handling:**
- Show validation errors clearly
- Keep form data intact on error (allow retry)
- Example error display:
  ```
  ❌ Error: purchased_count is required when were_eggs_purchased is true
  ```

✅ **Input Validation (Client-Side):**
- Numeric fields: type="number", min="0"
- Date: type="date", required
- Boolean: checkboxes or toggle switches

---

## 14) Deploy to Vercel

### 14.1 Prepare for Deployment

#### **Step 1: Verify Build Works Locally**

```bash
pnpm build
```

**Expected:** Build completes without errors.

**If errors occur:**
- Fix all TypeScript errors
- Fix all linting errors
- Re-run `pnpm build` until successful

#### **Step 2: Test Production Build Locally**

```bash
pnpm start
```

**Expected:** App runs on port 3000.

**Test in browser:**
- Visit: http://localhost:3000
- Submit daily record
- Submit initialization
- Verify data appears in Google Sheet

**Stop server:** Press `Ctrl+C`

---

### 14.2 Initialize Git Repository

#### **Check if Git is already initialized:**

```bash
git status
```

**If not initialized:**

```bash
git init
git add .
git commit -m "Initial commit: Farm App"
```

#### **Verify `.gitignore`:**

Ensure these are included:

```
# .gitignore
node_modules/
.next/
out/
.env*.local
.DS_Store
```

---

### 14.3 Push to GitHub (or GitLab/Bitbucket)

#### **Create a new repository on GitHub:**

1. Go to: https://github.com/new
2. Repository name: `farm-app` (or your choice)
3. **Do NOT** initialize with README (you already have code)
4. Click "Create repository"

#### **Push code to GitHub:**

```bash
git remote add origin https://github.com/YOUR_USERNAME/farm-app.git
git branch -M main
git push -u origin main
```

---

### 14.4 Deploy to Vercel

#### **Step 1: Sign Up / Log In to Vercel**

- Go to: https://vercel.com/
- Sign up with GitHub (recommended for easy repo access)

#### **Step 2: Import Project**

1. Click **"Add New..." → "Project"**
2. Select your GitHub repository: `farm-app`
3. Click **"Import"**

#### **Step 3: Configure Project**

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (default)

**Build Settings:**
- Build Command: `pnpm build` (auto-detected)
- Output Directory: `.next` (auto-detected)
- Install Command: `pnpm install` (auto-detected)

**Node.js Version:**
- Set to `20.x` (matches your local version)

#### **Step 4: Add Environment Variables**

**Click "Environment Variables":**

Add these **two variables**:

1. **Variable 1:**
   - **Key:** `GOOGLE_SA_JSON_BASE64`
   - **Value:** (Paste the Base64 string from Section 8.1)
   - **Environments:** Production, Preview, Development (check all)

2. **Variable 2:**
   - **Key:** `GOOGLE_SHEET_ID`
   - **Value:** `10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc`
   - **Environments:** Production, Preview, Development (check all)

#### **Step 5: Deploy**

Click **"Deploy"**

**Deployment Process:**
1. Vercel clones your repo
2. Installs dependencies (`pnpm install`)
3. Runs build (`pnpm build`)
4. Deploys to production

**Wait for deployment to complete** (1-3 minutes).

---

### 14.5 Verify Production Deployment

#### **Step 1: Open Production URL**

Vercel will provide a URL like:
```
https://farm-app.vercel.app
```

#### **Step 2: Test Production App**

1. **Visit home page (`/`):**
   - Submit a daily record
   - Check success message

2. **Visit init page (`/init`):**
   - Submit initialization
   - Check success message

3. **Verify in Google Sheet:**
   - Open: https://docs.google.com/spreadsheets/d/10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc/edit
   - Check relevant tabs for new rows

#### **Step 3: Check Vercel Logs (if errors occur)**

1. Go to Vercel dashboard
2. Select your project
3. Go to **"Deployments"** tab
4. Click on latest deployment
5. Click **"Functions"** tab
6. Click on a function (e.g., `/api/record-daily`)
7. View logs

**Common Issues:**
- **Missing env vars:** Verify in Settings → Environment Variables
- **Sheet access:** Verify service account has Editor access
- **Build errors:** Check build logs in deployment details

---

### 14.6 Post-Deployment Checklist

✅ **Production URL works**  
✅ **Both pages load correctly (`/` and `/init`)**  
✅ **Daily record submission works**  
✅ **Initialization submission works**  
✅ **Data appears in correct Google Sheet tabs**  
✅ **Error handling works (test with invalid data)**  
✅ **Mobile responsive (test on phone)**  

---

## 15) Maintenance and Future Enhancements

### 15.1 Monitoring

**Recommended:**
- Set up Vercel Analytics (free tier available)
- Monitor API response times
- Set up alerts for failed deployments

### 15.2 Future Features (Out of Scope for v1)

**Potential Enhancements:**
- User authentication (multi-farm support)
- Data visualization dashboard (charts, trends)
- Export to Excel/PDF
- Mobile app (React Native / PWA)
- Offline support (local storage + sync)
- Advanced reporting (weekly/monthly summaries)
- Integration with other farm management tools

---

## 16) Troubleshooting Guide

### 16.1 Common Issues

#### **Issue: "Cannot find module '@/lib/env'"**

**Solution:**
- Verify `tsconfig.json` has paths configured:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
- Restart TypeScript server in VSCode: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

#### **Issue: "Error: GOOGLE_SA_JSON_BASE64 environment variable is not set"**

**Local:**
- Verify `.env.local` exists and contains the variable
- Restart dev server

**Vercel:**
- Go to Settings → Environment Variables
- Verify `GOOGLE_SA_JSON_BASE64` is set
- Redeploy

#### **Issue: "The caller does not have permission"**

**Solution:**
- Open Google Sheet
- Click "Share"
- Add service account email with "Editor" access

#### **Issue: Validation errors not showing in UI**

**Solution:**
- Check browser console for errors
- Ensure error state is rendered in component
- Use `console.log(error)` to debug

#### **Issue: Data not appearing in correct tab**

**Solution:**
- Verify tab names match exactly (case-sensitive)
- Check `appendRow` function is using correct tab name
- Verify column order matches Section 2 specifications

---

## 17) Final Notes

### 17.1 Key Principles Recap

1. **Append-only system:** Never update or delete existing rows
2. **Partial submissions allowed:** Users can submit only filled sections
3. **Server-side security:** Never expose Google credentials to client
4. **Validation on both sides:** Client for UX, server for security
5. **Exact column order:** Must match Section 2 specifications

### 17.2 Success Criteria

**The app is complete when:**

✅ Both pages (`/` and `/init`) work  
✅ All 6 poultry rooms can be recorded  
✅ Egg Store, Feed Store, Sick Room work correctly  
✅ Conditional fields (purchased eggs, feed brought) work  
✅ Initialization works for all 6 rooms  
✅ Data appears in correct Google Sheet tabs  
✅ Validation prevents invalid data  
✅ Deployed to Vercel and accessible online  
✅ `eggs_sold_today` does NOT exist anywhere  

---

## Appendix A: Quick Reference

### Environment Variables

```env
GOOGLE_SA_JSON_BASE64="<base64-encoded-json>"
GOOGLE_SHEET_ID="10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc"
```

### Google Sheet URL

```
https://docs.google.com/spreadsheets/d/10AkKm_D5SEdigu5JKXOYZ0Zg5obUQlTaw_yHhSPB6Zc/edit
```

### Tab Names (Exact)

**Daily:**
- `Room 1`, `Room 2`, `Room 3`, `Room 4`, `Room 5`, `Room 6`
- `Egg Store`, `Feed Store`, `Sick Room`

**Init:**
- `Init - Room 1`, `Init - Room 2`, `Init - Room 3`, `Init - Room 4`, `Init - Room 5`, `Init - Room 6`

### API Endpoints

- `POST /api/record-daily` — Record daily production
- `POST /api/initialize` — Initialize farm rooms

---

**End of Build Guide**

---

## Document Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-07 | 1.0 | Initial comprehensive build guide |

---

**For questions or issues, refer to:**
- Next.js Documentation: https://nextjs.org/docs
- Google Sheets API: https://developers.google.com/sheets/api
- Vercel Documentation: https://vercel.com/docs
- Zod Documentation: https://zod.dev/

**Happy farming! 🐔🥚**

