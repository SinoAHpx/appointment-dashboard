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
        phone TEXT NOT NULL,
        email TEXT,
        position TEXT,
        status TEXT CHECK( status IN ('active', 'inactive', 'on_leave') ) NOT NULL DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 检查staff表中是否存在phone字段
    const phoneColumnExists = db.query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM pragma_table_info('staff') WHERE name = 'phone'"
    ).get();

    // 如果phone列不存在，则进行表迁移
    if (phoneColumnExists && phoneColumnExists.count === 0) {
      console.log("Migrating staff table to add new columns...");

      // 1. 创建临时表
      db.run(`
        CREATE TABLE staff_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          position TEXT,
          status TEXT CHECK( status IN ('active', 'inactive', 'on_leave') ) NOT NULL DEFAULT 'active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. 从老表中复制数据，设置默认电话号码
      db.run(`
        INSERT INTO staff_temp (
          id, name, phone, status, createdAt
        )
        SELECT 
          id, name, '未设置', status, createdAt
        FROM staff;
      `);

      // 3. 删除旧表
      db.run("DROP TABLE staff;");

      // 4. 重命名临时表
      db.run("ALTER TABLE staff_temp RENAME TO staff;");

      console.log("Successfully migrated staff table with new columns");
    }

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
        appointmentId TEXT UNIQUE NOT NULL, -- 预约唯一标识码
        customerName TEXT NOT NULL, -- Maybe link to customers table later? For now, keep simple.
        contactPhone TEXT,  -- 联系电话
        contactAddress TEXT,  -- 联系地址
        notes TEXT,  -- 备注信息
        documentCount INTEGER DEFAULT 1,  -- 文件数量
        appointmentTime DATETIME NOT NULL,
        serviceType TEXT,
        staffId INTEGER,
        vehicleId INTEGER,
        status TEXT CHECK( status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
        estimatedCompletionTime DATETIME,  -- 预计完成时间
        processingNotes TEXT,  -- 处理备注
        lastUpdatedBy INTEGER,  -- 最后更新用户ID
        lastUpdatedAt DATETIME,  -- 最后更新时间
        createdBy INTEGER,  -- 创建者用户ID
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL, -- Optional: Handle staff deletion
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL, -- Optional: Handle vehicle deletion
        FOREIGN KEY (lastUpdatedBy) REFERENCES users (id) ON DELETE SET NULL, -- Optional: Handle user deletion
        FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL -- Optional: Handle user deletion
      );
    `);

    // 检查appointments表中是否存在appointmentId列
    const appointmentIdColumnExists = db.query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM pragma_table_info('appointments') WHERE name = 'appointmentId'"
    ).get();

    // 如果appointmentId列不存在，则进行表迁移
    if (appointmentIdColumnExists && appointmentIdColumnExists.count === 0) {
      console.log("Migrating appointments table to add new columns...");

      // 1. 创建临时表
      db.run(`
        CREATE TABLE appointments_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          appointmentId TEXT UNIQUE NOT NULL,
          customerName TEXT NOT NULL,
          contactPhone TEXT,  -- 联系电话
          contactAddress TEXT,  -- 联系地址
          notes TEXT,  -- 备注信息
          documentCount INTEGER DEFAULT 1,  -- 文件数量
          appointmentTime DATETIME NOT NULL,
          serviceType TEXT,
          staffId INTEGER,
          vehicleId INTEGER,
          status TEXT CHECK( status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
          estimatedCompletionTime DATETIME,
          processingNotes TEXT,
          lastUpdatedBy INTEGER,
          lastUpdatedAt DATETIME,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL,
          FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL,
          FOREIGN KEY (lastUpdatedBy) REFERENCES users (id) ON DELETE SET NULL,
          FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
        );
      `);

      // 2. 从老表中复制数据并生成唯一ID
      db.run(`
        INSERT INTO appointments_temp (
          id, customerName, appointmentTime, serviceType, staffId, vehicleId, status, createdAt
        )
        SELECT 
          id, customerName, appointmentTime, serviceType, staffId, vehicleId, 
          CASE 
            WHEN status = 'pending' THEN 'pending'
            WHEN status = 'confirmed' THEN 'confirmed'
            WHEN status = 'completed' THEN 'completed'
            WHEN status = 'cancelled' THEN 'cancelled'
            ELSE 'pending'
          END as status,
          createdAt 
        FROM appointments;
      `);

      // 3. 为每条记录生成唯一的appointmentId
      const appointmentIds = db.query<{ id: number }, []>(
        "SELECT id FROM appointments_temp"
      ).all();

      const generateUniqueId = (id: number) => {
        const prefix = 'APT';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${id}-${timestamp}-${random}`;
      };

      for (const { id } of appointmentIds) {
        const uniqueId = generateUniqueId(id);
        db.run(
          "UPDATE appointments_temp SET appointmentId = ? WHERE id = ?",
          [uniqueId, id]
        );
      }

      // 4. 删除旧表
      db.run("DROP TABLE appointments;");

      // 5. 重命名临时表
      db.run("ALTER TABLE appointments_temp RENAME TO appointments;");

      console.log("Successfully migrated appointments table with new columns");
    }

    // 检查appointments表中是否存在createdBy列
    const createdByColumnExists = db.query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM pragma_table_info('appointments') WHERE name = 'createdBy'"
    ).get();

    // 如果createdBy列不存在，则进行表迁移添加该列
    if (createdByColumnExists && createdByColumnExists.count === 0) {
      console.log("Migrating appointments table to add createdBy column...");

      // 1. 创建临时表，包含所有现有列和新的createdBy列
      db.run(`
        CREATE TABLE appointments_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          appointmentId TEXT UNIQUE NOT NULL,
          customerName TEXT NOT NULL,
          contactPhone TEXT,  -- 联系电话
          contactAddress TEXT,  -- 联系地址
          notes TEXT,  -- 备注信息
          documentCount INTEGER DEFAULT 1,  -- 文件数量
          appointmentTime DATETIME NOT NULL,
          serviceType TEXT,
          staffId INTEGER,
          vehicleId INTEGER,
          status TEXT CHECK( status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
          estimatedCompletionTime DATETIME,
          processingNotes TEXT,
          lastUpdatedBy INTEGER,
          lastUpdatedAt DATETIME,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL,
          FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL,
          FOREIGN KEY (lastUpdatedBy) REFERENCES users (id) ON DELETE SET NULL,
          FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
        );
      `);

      // 2. 从旧表复制数据到新表，设置createdBy为1（管理员ID）
      db.run(`
        INSERT INTO appointments_temp (
          id, appointmentId, customerName, appointmentTime, serviceType, staffId, vehicleId, 
          status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt
        )
        SELECT 
          id, appointmentId, customerName, appointmentTime, serviceType, staffId, vehicleId, 
          status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, 1, createdAt
        FROM appointments;
      `);

      // 3. 删除旧表
      db.run("DROP TABLE appointments;");

      // 4. 重命名临时表
      db.run("ALTER TABLE appointments_temp RENAME TO appointments;");

      console.log("Successfully migrated appointments table with createdBy column");
    }

    // Create appointment history table for tracking status changes
    db.run(`
      CREATE TABLE IF NOT EXISTS appointment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        status TEXT NOT NULL,
        staffId INTEGER,
        vehicleId INTEGER,
        notes TEXT,
        updatedBy INTEGER NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (appointmentId) REFERENCES appointments (id) ON DELETE CASCADE,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL,
        FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
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

// Close the database connection
export const closeDb = () => {
  if (_db) {
    try {
      _db.close();
      _db = null;
      console.log("Database connection closed successfully");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
};

// Helper to safely use database in API routes
export const withDbConnection = async <T>(callback: (db: Database) => Promise<T> | T): Promise<T> => {
  // During build, return mock data to avoid database operations
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Skipping database operation during build');
    return {} as T;
  }

  const db = getDb();
  try {
    return await callback(db);
  } finally {
    // We don't actually close the connection here since SQLite is designed to be kept open
    // But we could if we wanted to enforce strict connection management
    // closeDb();
  }
};

// Initialize the database on module import
let db: Database;

// Only initialize database in development and when actually used
if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
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
} else {
  // In production or during build, we'll initialize lazily on first actual use
  console.log("Skipping immediate database initialization during build/production");
}

// Export the database getter function instead of the instance directly
export { db };
export default getDb; // Export the getter function as default
