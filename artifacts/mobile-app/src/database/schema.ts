// Native SQLite Schema for System B (React Native Expo)
export const INIT_SQLITE_SCHEMA = `
-- Students (synced from server)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  studentIdNumber TEXT NOT NULL,
  classId TEXT NOT NULL,
  className TEXT,
  gender TEXT,
  guardianName TEXT,
  guardianPhone TEXT,
  lastUpdated INTEGER,
  syncedAt INTEGER
);

-- Attendance marks (local database + queue)
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  classId TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  daysOpened INTEGER DEFAULT 65,
  daysPresent INTEGER DEFAULT 65,
  conduct TEXT DEFAULT 'Good',
  attitude TEXT DEFAULT 'Attentive',
  interest TEXT DEFAULT 'High',
  teacherRemarks TEXT,
  localId TEXT UNIQUE,
  serverId TEXT,
  syncStatus TEXT DEFAULT 'pending',
  createdAt INTEGER,
  syncedAt INTEGER,
  FOREIGN KEY(studentId) REFERENCES students(id)
);

-- Sync Queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  recordId TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  retries INTEGER DEFAULT 0,
  createdAt INTEGER
);

-- Conflict Log
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recordId TEXT NOT NULL,
  type TEXT NOT NULL,
  localData TEXT,
  serverData TEXT,
  resolvedAt INTEGER,
  resolution TEXT
);
`;
