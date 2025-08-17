import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import { getSecureItem, setSecureItem } from "./secureStore";

const db = SQLite.openDatabaseSync("cryppy.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS stellar_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      public_key TEXT NOT NULL,
      alias TEXT,
      network TEXT DEFAULT 'testnet',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      stellar_account_id INTEGER,
      transaction_hash TEXT,
      type TEXT, -- 'send', 'receive', 'create'
      amount REAL,
      asset_code TEXT DEFAULT 'XLM',
      destination_address TEXT,
      source_address TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (stellar_account_id) REFERENCES stellar_accounts (id)
    );
    
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      theme TEXT DEFAULT 'auto', -- 'light', 'dark', 'auto'
      default_network TEXT DEFAULT 'testnet',
      notifications_enabled BOOLEAN DEFAULT 1,
      biometric_enabled BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  try {
    const tableInfo = db.getAllSync("PRAGMA table_info(user_preferences)") as {
      name: string;
    }[];
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes("created_at")) {
      db.runSync(`
        ALTER TABLE user_preferences 
        ADD COLUMN created_at DATETIME
      `);

      db.runSync(`
        UPDATE user_preferences 
        SET created_at = datetime('now') 
        WHERE created_at IS NULL
      `);
    }

    if (!columnNames.includes("updated_at")) {
      db.runSync(`
        ALTER TABLE user_preferences 
        ADD COLUMN updated_at DATETIME
      `);

      db.runSync(`
        UPDATE user_preferences 
        SET updated_at = datetime('now') 
        WHERE updated_at IS NULL
      `);
    }
  } catch (error: any) {
    console.warn("Migration warning:", error.message);
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = Math.random().toString(36).substring(2, 15);
  const combined = password + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return `${salt}:${hash}`;
}

async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  const combined = password + salt;
  const newHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return newHash === hash;
}

export async function registerUser(
  username: string,
  email: string,
  password: string
) {
  const passwordHash = await hashPassword(password);

  try {
    const result = db.runSync(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, passwordHash]
    );

    const now = new Date().toISOString();
    db.runSync(
      "INSERT INTO user_preferences (user_id, created_at, updated_at) VALUES (?, ?, ?)",
      [result.lastInsertRowId, now, now]
    );

    return { success: true, userId: result.lastInsertRowId };
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      if (error.message.includes("username")) {
        throw new Error("El nombre de usuario ya existe");
      }
      if (error.message.includes("email")) {
        throw new Error("El email ya está registrado");
      }
    }
    throw new Error("Error al registrar usuario");
  }
}

export async function loginUser(username: string, password: string) {
  const user = db.getFirstSync(
    "SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?",
    [username, username]
  ) as {
    id: number;
    username: string;
    email: string;
    password_hash: string;
  } | null;

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error("Contraseña incorrecta");
  }

  return { userId: user.id, username: user.username, email: user.email };
}

export async function saveWalletKeypair(
  userId: number,
  publicKey: string,
  secret: string,
  alias: string,
  network: string = "testnet"
) {
  await setSecureItem(`stellar_secret_${publicKey}`, secret);

  const result = db.runSync(
    "INSERT INTO stellar_accounts (user_id, public_key, alias, network) VALUES (?, ?, ?, ?)",
    [userId, publicKey, alias, network]
  );

  return result.lastInsertRowId;
}

export function getUserWallets(userId: number) {
  return db.getAllSync(
    "SELECT id, public_key, alias, network, is_active, created_at FROM stellar_accounts WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  ) as {
    id: number;
    public_key: string;
    alias: string;
    network: string;
    is_active: number;
    created_at: string;
  }[];
}

export async function getWalletSecret(
  publicKey: string
): Promise<string | null> {
  return await getSecureItem(`stellar_secret_${publicKey}`);
}

export function saveTransaction(
  userId: number,
  stellarAccountId: number,
  type: "send" | "receive" | "create",
  amount: number,
  destinationAddress: string | null = null,
  sourceAddress: string | null = null,
  transactionHash: string | null = null,
  assetCode: string = "XLM"
) {
  return db.runSync(
    `INSERT INTO transactions 
     (user_id, stellar_account_id, type, amount, asset_code, destination_address, source_address, transaction_hash) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      stellarAccountId,
      type,
      amount,
      assetCode,
      destinationAddress,
      sourceAddress,
      transactionHash,
    ]
  );
}

export function getUserTransactions(userId: number, limit: number = 50) {
  return db.getAllSync(
    `SELECT t.*, sa.alias, sa.public_key 
     FROM transactions t 
     JOIN stellar_accounts sa ON t.stellar_account_id = sa.id 
     WHERE t.user_id = ? 
     ORDER BY t.created_at DESC 
     LIMIT ?`,
    [userId, limit]
  ) as {
    id: number;
    type: string;
    amount: number;
    asset_code: string;
    destination_address: string;
    source_address: string;
    transaction_hash: string;
    status: string;
    created_at: string;
    alias: string;
    public_key: string;
  }[];
}

export function getUserPreferences(userId: number) {
  let prefs = db.getFirstSync(
    "SELECT * FROM user_preferences WHERE user_id = ?",
    [userId]
  ) as {
    theme: string;
    default_network: string;
    notifications_enabled: number;
    biometric_enabled: number;
  } | null;

  if (!prefs) {
    const now = new Date().toISOString();
    db.runSync(
      "INSERT INTO user_preferences (user_id, created_at, updated_at) VALUES (?, ?, ?)",
      [userId, now, now]
    );

    prefs = db.getFirstSync(
      "SELECT * FROM user_preferences WHERE user_id = ?",
      [userId]
    ) as {
      theme: string;
      default_network: string;
      notifications_enabled: number;
      biometric_enabled: number;
    } | null;
  }

  return prefs;
}

export function updateUserPreferences(
  userId: number,
  preferences: Partial<{
    theme: string;
    default_network: string;
    notifications_enabled: boolean;
    biometric_enabled: boolean;
  }>
) {
  const existingPrefs = db.getFirstSync(
    "SELECT id FROM user_preferences WHERE user_id = ?",
    [userId]
  );

  if (!existingPrefs) {
    const now = new Date().toISOString();
    db.runSync(
      "INSERT INTO user_preferences (user_id, created_at, updated_at) VALUES (?, ?, ?)",
      [userId, now, now]
    );
  }

  const sets = [];
  const values = [];

  if (preferences.theme !== undefined) {
    sets.push("theme = ?");
    values.push(preferences.theme);
  }
  if (preferences.default_network !== undefined) {
    sets.push("default_network = ?");
    values.push(preferences.default_network);
  }
  if (preferences.notifications_enabled !== undefined) {
    sets.push("notifications_enabled = ?");
    values.push(preferences.notifications_enabled ? 1 : 0);
  }
  if (preferences.biometric_enabled !== undefined) {
    sets.push("biometric_enabled = ?");
    values.push(preferences.biometric_enabled ? 1 : 0);
  }

  if (sets.length > 0) {
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());

    values.push(userId);

    try {
      db.runSync(
        `UPDATE user_preferences SET ${sets.join(", ")} WHERE user_id = ?`,
        values
      );
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      console.error(
        "SQL:",
        `UPDATE user_preferences SET ${sets.join(", ")} WHERE user_id = ?`
      );
      console.error("Values:", values);
      throw error;
    }
  }
}

export function deactivateWallet(userId: number, walletId: number) {
  return db.runSync(
    "UPDATE stellar_accounts SET is_active = 0 WHERE id = ? AND user_id = ?",
    [walletId, userId]
  );
}

export function getUserStats(userId: number) {
  const walletsCount = db.getFirstSync(
    "SELECT COUNT(*) as count FROM stellar_accounts WHERE user_id = ? AND is_active = 1",
    [userId]
  ) as { count: number };

  const transactionsCount = db.getFirstSync(
    "SELECT COUNT(*) as count FROM transactions WHERE user_id = ?",
    [userId]
  ) as { count: number };

  return {
    walletsCount: walletsCount.count,
    transactionsCount: transactionsCount.count,
  };
}

export async function deleteUserAccount(userId: number) {
  try {
    db.runSync("DELETE FROM transactions WHERE user_id = ?", [userId]);
  
    db.runSync("DELETE FROM stellar_accounts WHERE user_id = ?", [userId]);

    db.runSync("DELETE FROM user_preferences WHERE user_id = ?", [userId]);
    
    const result = db.runSync("DELETE FROM users WHERE id = ?", [userId]);
    
    if (result.changes === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return { success: true, message: 'Cuenta eliminada exitosamente' };
  } catch (error: any) {
    console.error('Error eliminando cuenta:', error);
    throw new Error('Error al eliminar la cuenta: ' + error.message);
  }
}
