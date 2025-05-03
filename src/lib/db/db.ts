import { Database } from "bun:sqlite";

// Create a singleton database connection
let _db: Database | null = null;

// Initialize database schema
const initDb = (db: Database) => {
  console.log("Initializing SQLite database schema...");
  try {
    // 检查是否存在users表
    const userTableExists = db.query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = 'users'"
    ).get();

    if (userTableExists && userTableExists.count === 0) {
      // 如果表不存在，创建一个包含所有需要列的新表
      console.log("Creating users table with all required columns...");
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL, -- In a real app, store hashed passwords!
          name TEXT DEFAULT '',
          email TEXT UNIQUE,
          role TEXT CHECK( role IN ('admin', 'user') ) NOT NULL DEFAULT 'user',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      // 表已存在，检查是否有name列
      const nameColumnExists = db.query<{ count: number }, []>(
        "SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name = 'name'"
      ).get();

      // 如果name列不存在，创建一个临时表并迁移数据
      if (nameColumnExists && nameColumnExists.count === 0) {
        console.log("Adding name column to users table through table recreation...");

        // 1. 创建临时表
        db.run(`
          CREATE TABLE users_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT DEFAULT '',
            email TEXT UNIQUE,
            role TEXT CHECK( role IN ('admin', 'user') ) NOT NULL DEFAULT 'user',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // 2. 复制数据
        db.run(`
          INSERT INTO users_temp (id, username, password, role, createdAt)
          SELECT id, username, password, role, createdAt FROM users;
        `);

        // 3. 删除旧表
        db.run("DROP TABLE users;");

        // 4. 重命名临时表
        db.run("ALTER TABLE users_temp RENAME TO users;");

        console.log("Successfully migrated users table with new columns");
      } else {
        // name列已经存在，检查email列
        const emailColumnExists = db.query<{ count: number }, []>(
          "SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name = 'email'"
        ).get();

        if (emailColumnExists && emailColumnExists.count === 0) {
          console.log("Adding email column to users table through table recreation...");

          // 1. 创建临时表
          db.run(`
            CREATE TABLE users_temp (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              name TEXT DEFAULT '',
              email TEXT UNIQUE,
              role TEXT CHECK( role IN ('admin', 'user') ) NOT NULL DEFAULT 'user',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // 2. 复制数据
          db.run(`
            INSERT INTO users_temp (id, username, password, name, role, createdAt)
            SELECT id, username, password, name, role, createdAt FROM users;
          `);

          // 3. 删除旧表
          db.run("DROP TABLE users;");

          // 4. 重命名临时表
          db.run("ALTER TABLE users_temp RENAME TO users;");

          console.log("Successfully migrated users table with email column");
        }
      }

      // 更新现有用户，确保name字段有值
      db.run(`
        UPDATE users SET name = username WHERE name IS NULL OR name = ''
      `);
    }

    // Create staff table
    db.run(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT CHECK( status IN ('active', 'inactive', 'on_leave') ) NOT NULL DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plateNumber TEXT UNIQUE NOT NULL,
        model TEXT,
        status TEXT CHECK( status IN ('available', 'in_use', 'maintenance') ) NOT NULL DEFAULT 'available',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create appointments table
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT NOT NULL, -- Maybe link to customers table later? For now, keep simple.
        appointmentTime DATETIME NOT NULL,
        serviceType TEXT,
        staffId INTEGER,
        vehicleId INTEGER,
        status TEXT CHECK( status IN ('pending', 'confirmed', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL, -- Optional: Handle staff deletion
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL -- Optional: Handle vehicle deletion
      );
    `);

    // Create customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        address TEXT,
        company TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert admin user if not exists
    const adminCheck = db
      .query("SELECT id FROM users WHERE username = ?")
      .get("admin");
    if (!adminCheck) {
      // In a real app, hash this password!
      db.run(`
        INSERT INTO users (username, password, role, name) VALUES ('admin', 'admin123', 'admin', '管理员')
      `);
      console.log(
        "Created default admin user with username 'admin' and password 'admin123'",
      );
    } else {
      // 确保admin用户有name字段
      db.run(`
        UPDATE users SET name = '管理员' WHERE username = 'admin' AND (name IS NULL OR name = '')
      `);
      console.log("Admin user already exists");
    }

    // Check if tables were created
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    console.log("Database tables:", tables.map((t: any) => t.name).join(", "));

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error; // Re-throw to allow caller to handle it
  }
};

// Get the database instance - initialize if not already created
export const getDb = () => {
  if (!_db) {
    console.log("Creating new SQLite database connection...");
    try {
      _db = new Database("appointment_dashboard.sqlite", { create: true });
      // Initialize the database schema
      initDb(_db);
      console.log(
        "New database connection created and initialized successfully",
      );
    } catch (error) {
      console.error("Failed to initialize database:", error);
      _db = null; // Reset the database connection
      throw error;
    }
  }
  return _db;
};

// Initialize the database on module import
let db: Database;

try {
  console.log("Initializing database during module import...");
  db = getDb();
  console.log("Database initialized successfully and ready for use");
} catch (error) {
  console.error("Critical error during database initialization:", error);
  // In a real app, you might want to handle this error more gracefully
  throw new Error(
    `Database initialization failed: ${error instanceof Error ? error.message : String(error)}`,
  );
}

// Export the database
export { db };
export default db;
