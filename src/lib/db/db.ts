import { Database } from "bun:sqlite";

// 数据库单例连接
let _db: Database | null = null;

/**
 * 初始化数据库表结构
 */
function initDb(db: Database) {
  console.log("正在初始化 SQLite 数据库表结构...");
  try {
    // 创建用户表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT DEFAULT '',
        email TEXT UNIQUE,
        role TEXT CHECK( role IN ('admin', 'user') ) NOT NULL DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建员工表
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

    // 创建车辆表
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plateNumber TEXT UNIQUE NOT NULL,
        model TEXT,
        status TEXT CHECK( status IN ('available', 'in_use', 'maintenance') ) NOT NULL DEFAULT 'available',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建预约表
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId TEXT UNIQUE NOT NULL,
        customerName TEXT NOT NULL,
        contactPhone TEXT,
        contactAddress TEXT,
        notes TEXT,
        documentCount INTEGER DEFAULT 1,
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
        assignedStaffJson TEXT,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL,
        FOREIGN KEY (lastUpdatedBy) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // 创建预约历史记录表
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
        assignedStaffJson TEXT,
        FOREIGN KEY (appointmentId) REFERENCES appointments (id) ON DELETE CASCADE,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL,
        FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // 创建客户表
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

    // 创建默认管理员账户
    const adminCheck = db.query("SELECT id FROM users WHERE username = ?").get("admin");
    if (!adminCheck) {
      db.run(`
        INSERT INTO users (username, password, role, name) 
        VALUES ('admin', 'admin123', 'admin', '管理员')
      `);
      console.log("已创建默认管理员账户：用户名 'admin'，密码 'admin123'");
    }

    // 检查数据库表是否创建成功
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("数据库表创建成功:", tables.map((t: any) => t.name).join(", "));

  } catch (error) {
    console.error("初始化数据库表结构时出错:", error);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export function getDb() {
  if (!_db) {
    console.log("正在创建新的 SQLite 数据库连接...");
    try {
      _db = new Database("appointment_dashboard.sqlite", { create: true });
      initDb(_db);
      console.log("数据库连接创建并初始化成功");
    } catch (error) {
      console.error("初始化数据库失败:", error);
      _db = null;
      throw error;
    }
  }
  return _db;
}

/**
 * 关闭数据库连接
 */
export function closeDb() {
  if (_db) {
    try {
      _db.close();
      _db = null;
      console.log("数据库连接已关闭");
    } catch (error) {
      console.error("关闭数据库连接时出错:", error);
    }
  }
}

/**
 * API 路由中安全使用数据库的辅助函数
 */
export async function withDbConnection<T>(callback: (db: Database) => Promise<T> | T): Promise<T> {
  // 构建阶段跳过数据库操作
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('构建阶段跳过数据库操作');
    return {} as T;
  }

  const db = getDb();
  try {
    return await callback(db);
  } finally {
    // SQLite 设计为保持连接打开状态，所以这里不关闭连接
  }
}

// 初始化数据库实例
let db: Database;

// 仅在开发环境且实际使用时初始化数据库
if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  try {
    console.log("正在初始化数据库...");
    db = getDb();
    console.log("数据库初始化成功，可以使用");
  } catch (error) {
    console.error("数据库初始化过程中发生严重错误:", error);
    throw new Error(
      `数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} else {
  console.log("生产环境或构建阶段跳过立即初始化数据库");
}

export { db };
export default getDb;
