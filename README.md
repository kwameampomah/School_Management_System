# 🎓 Ghana GES School Report Manager

A complete, offline-capable school administration and report card management system built for Ghana Education Service (GES) schools. Manages students, teachers, subjects, score entry, and generates professional terminal report cards — all accessible from any device on the school's local Wi-Fi network.

---

## 📋 Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation Guide (Fresh Windows PC)](#installation-guide-fresh-windows-pc)
- [Starting the System](#starting-the-system)
- [First-Time Setup (Admin)](#first-time-setup-admin)
- [Default Login Credentials](#default-login-credentials)
- [How the System Works](#how-the-system-works)
- [Network Access (Sharing with Teachers)](#network-access-sharing-with-teachers)
- [Daily Workflow Summary](#daily-workflow-summary)
- [Backing Up Your Data](#backing-up-your-data)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Multi-Role Login** | Separate portals for Admin, Class Teachers, and Parents |
| **Score Entry** | Teachers enter subject scores per assessment component (Classwork, Homework, Exams, etc.) |
| **Report Cards** | Auto-generated A4 terminal report cards with grades, class position, class highest/lowest, and assessment breakdown |
| **Attendance Tracking** | Record Days Opened and Days Present per student per term |
| **Behavioral Traits** | Record Conduct, Attitude to Work, and Special Interest per student |
| **Teacher & Headmaster Remarks** | Add official general remarks that print on the report card |
| **Class Promotions** | Bulk promote entire classes to the next grade at year-end |
| **Audit Logs** | Every score change is logged with the editor's identity and timestamp |
| **Parent Notifications** | Send report card links to parents via simulated WhatsApp & Email dispatch |
| **Bulk Student Import** | Import students via CSV spreadsheet file |
| **LAN Network Access** | Any teacher can access the system from their phone or laptop on the school Wi-Fi |
| **Print-Ready Reports** | Report cards print cleanly on A4 paper with no sidebar or button clutter |

---

## 🖥️ System Requirements

Before installation, make sure the **server computer** (the admin office PC) meets these minimum requirements:

- **Operating System:** Windows 10 or Windows 11 (64-bit)
- **RAM:** At least 4GB
- **Storage:** At least 10GB free disk space
- **Internet:** Required only for installation. Not required for daily use.
- **Network:** Must be connected to a local Wi-Fi router if other teachers will access from their own devices.

---

## 🔧 Installation Guide (Fresh Windows PC)

Follow these steps **once** on the computer that will serve as the school's server.

### Step 1 — Install Node.js

1. Go to **https://nodejs.org** and download the **LTS version**.
2. Run the installer and click **Next** through all steps. Accept all defaults.
3. After installation, open **Command Prompt** and type:
   ```
   node --version
   ```
   You should see a version number like `v22.x.x`. This confirms it worked.

### Step 2 — Install pnpm (Package Manager)

In the same **Command Prompt**, paste this and press Enter:
```
npm install -g pnpm
```

### Step 3 — Install PostgreSQL 18 (Database)

1. Go to **https://www.postgresql.org/download/windows/** and download **PostgreSQL 18**.
2. Run the installer. When asked for a password, use: `postgres` (keep it simple for local use).
3. When asked for the port number, use: `5433` *(important — must be 5433, not the default 5432)*.
4. Complete the installation. You do **not** need to install pgAdmin.

### Step 4 — Set Up the Database

1. Open the **SQL Shell (psql)** from the Start Menu (installed with PostgreSQL).
2. Press Enter at every prompt to use defaults, then type the password `postgres`.
3. Run this command to create the database:
   ```sql
   CREATE DATABASE school_report;
   ```
4. Type `\q` and press Enter to exit.

### Step 5 — Install pnpm and Project Dependencies

1. Copy the entire `School-Report-Manager` project folder onto this PC (via USB drive or GitHub download).
2. Open **Command Prompt** and navigate into the project folder:
   ```
   cd C:\path\to\School-Report-Manager
   ```
3. Install all dependencies:
   ```
   pnpm install
   ```
   This may take a few minutes on first run.

### Step 6 — Initialize the Database Tables

Run this command once to create all required database tables:
```
pnpm --filter @workspace/api-server run db:push
```

You should see output confirming tables were created.

---

## ▶️ Starting the System

Every day when school starts, the administrator just needs to:

1. Locate the file **`start-school-manager.bat`** in the project root folder.
2. **Double-click** it.
3. Three terminal windows will open (Database, API Server, Frontend). **Leave them all open.**
4. The launcher will display the local access URL and the school network URL, e.g.:
   ```
   Local access URL:        http://localhost:3000
   School Network (LAN) URL: http://192.168.1.100:3000
   ```

> ⚠️ **Keep these terminal windows open during school hours.** Closing them will shut down the system for everyone.

At the end of the day, press any key in the launcher window to shut down cleanly.

---

## ⚙️ First-Time Setup (Admin)

After starting the system for the first time, the administrator must configure the school data in this order:

1. **Log in** at `http://localhost:3000` using the admin credentials below.
2. Go to **Academic Years** → Create the current academic year (e.g., `2025/2026`).
3. Go to **Terms** → Create the three terms (e.g., `Term 1`, `Term 2`, `Term 3`) and link them to the academic year. Mark the current term as **active**.
4. Go to **Classes** → Add every class (e.g., `Basic 1`, `Basic 2`, `JHS 1A`).
5. Go to **Subjects** → Add the subjects the school teaches (e.g., `Mathematics`, `English`, `Science`).
6. For each class, go to **Classes → [Class Name] → Subjects** to link which subjects that class studies.
7. Go to **Users** → Create teacher accounts with email and password.
8. Go to **Teacher Assignments** → Assign each teacher to their class(es) and subject(s).
9. Go to **Students** → Add students manually or use the **Bulk Import** CSV feature.
10. Go to **Assessments** → Define the components per subject (e.g., `Classwork 10%`, `Homework 10%`, `Exam 80%`).
11. Go to **Grading Scales** → Set up the grade boundaries (e.g., `80-100 → A1 — Excellent`).

Once done, teachers can log in and start entering scores immediately.

---

## 🔑 Default Login Credentials

> ⚠️ **Change these passwords immediately** after first login, especially on a computer accessible by others.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@school.gh` | `admin123` |
| Sample Teacher | `teacher@school.gh` | `teacher123` |

To create real teacher accounts, log in as admin and go to **Users → Add New User**.

---

## 🔄 How the System Works

```
Admin Sets Up → Teachers Enter Scores → Admin Publishes → Parents View Cards
```

| Stage | Who Does It | What Happens |
|---|---|---|
| **Setup** | Admin | Creates academic year, terms, classes, subjects, teachers |
| **Score Entry** | Class Teacher | Logs in, selects their class, enters scores for each student |
| **Review & Submit** | Class Teacher | Submits the class for approval when all scores are entered |
| **Approval** | Admin | Reviews and approves submitted classes |
| **Publish** | Admin | Publishes report cards — they become available for printing |
| **Print / Share** | Admin or Teacher | Prints A4 report cards or sends links to parents via WhatsApp/Email |

---

## 🌐 Network Access (Sharing with Teachers)

Once the system is running, **other teachers do not need to install anything.** They simply:

1. Connect their laptop, phone, or tablet to the **same school Wi-Fi** as the server PC.
2. Open a web browser and type the **School Network URL** shown in the launcher (e.g., `http://192.168.1.100:3000`).
3. Log in with their teacher credentials.

> 💡 **Tip:** Write the network URL on the staffroom board so teachers can always find it.

---

## 📅 Daily Workflow Summary

### Start of Term
- Activate the new Term in **Admin → Terms**.
- Verify student enrolments via **Admin → Students**.
- Confirm teacher assignments are still correct.

### During the Term
- Teachers log in daily/weekly to enter scores under **My Classes → Enter Scores**.

### End of Term
- Admin verifies score completion progress in **Report Cards** dashboard.
- Admin approves and publishes report cards class by class.
- Print all report cards using the **Print All** button.
- Use **Class Promotions** to move all students to the next grade.
- Deactivate the old term and activate the new one.

---

## 💾 Backing Up Your Data

Student grades are stored in the PostgreSQL database. It is critical to back this up regularly to prevent loss if the computer is damaged.

**Manual Backup (recommended weekly):**

1. Open **Command Prompt**.
2. Run this command (replace the path if needed):
   ```
   "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h 127.0.0.1 -p 5433 -U postgres school_report > "C:\School_Backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql"
   ```
3. Copy the generated `.sql` backup file to a **USB drive** or **Google Drive** folder.

To restore from a backup:
```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h 127.0.0.1 -p 5433 -U postgres school_report < C:\path\to\backup.sql
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| **The launcher says "Database not found"** | Make sure PostgreSQL 18 is installed and the database `school_report` was created (Step 4 above). |
| **White screen or "Cannot connect" in browser** | Wait 15 seconds for the servers to fully start up, then refresh the page. |
| **Teacher can't log in** | Go to Admin → Users and verify their email and that their account is active. Reset their password if needed. |
| **Scores are not saving** | Check that the academic term is still marked as active in Admin → Terms. |
| **Report card is blank / no subjects** | Ensure the class has subjects linked to it via Admin → Classes → Subjects, and that teacher assignments exist. |
| **Teachers on other devices can't access** | Make sure all devices are on the **same Wi-Fi network**. Check that Windows Firewall is not blocking port 3000. |
| **Firewall blocking other devices** | Open Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port → TCP → 3000 → Allow. |

---

## 📞 Support

This system was developed specifically for this school. For technical support, modifications, or new features, contact the developer who set this up.

---

*Built with Node.js, React, PostgreSQL, and TypeScript. Designed for offline-first operation on school Local Area Networks.*
