import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'clawver.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      walletAddress TEXT NOT NULL,
      reputation REAL NOT NULL DEFAULT 0,
      skillsExecuted INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      ownerId TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0.0',
      inputSchema TEXT NOT NULL DEFAULT '{}',
      outputSchema TEXT NOT NULL DEFAULT '{}',
      code TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      executionCount INTEGER NOT NULL DEFAULT 0,
      avgRating REAL NOT NULL DEFAULT 0,
      timeoutMs INTEGER NOT NULL DEFAULT 5000,
      maxMemoryMb INTEGER NOT NULL DEFAULT 64,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ownerId) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      skillId TEXT NOT NULL,
      callerId TEXT NOT NULL,
      input TEXT NOT NULL DEFAULT '{}',
      output TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      validated INTEGER NOT NULL DEFAULT 0,
      executionTimeMs INTEGER,
      error TEXT,
      txSignature TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      completedAt TEXT,
      FOREIGN KEY (skillId) REFERENCES skills(id),
      FOREIGN KEY (callerId) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      skillId TEXT NOT NULL,
      input TEXT NOT NULL DEFAULT '{}',
      output TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'created',
      escrowTx TEXT,
      settleTx TEXT,
      validationResult TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (clientId) REFERENCES agents(id),
      FOREIGN KEY (providerId) REFERENCES agents(id),
      FOREIGN KEY (skillId) REFERENCES skills(id)
    );
  `);
}
