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
        phone TEXT UNIQUE,
        role TEXT CHECK( role IN ('admin', 'user', 'waste_disposal_merchant') ) NOT NULL DEFAULT 'user',
        isGovUser BOOLEAN NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 为已存在的users表添加审核相关字段（如果不存在的话）
    try {
      db.run(`ALTER TABLE users ADD COLUMN approvalStatus TEXT CHECK( approvalStatus IN ('pending', 'approved', 'rejected') ) DEFAULT 'approved'`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    try {
      db.run(`ALTER TABLE users ADD COLUMN approvedBy INTEGER`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    try {
      db.run(`ALTER TABLE users ADD COLUMN approvedAt DATETIME`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    try {
      db.run(`ALTER TABLE users ADD COLUMN rejectionReason TEXT`);
    } catch (e) {
      // 字段已存在，忽略错误
    }

    // 为用户表添加计费模式字段
    try {
      db.run(`ALTER TABLE users ADD COLUMN billingType TEXT CHECK( billingType IN ('yearly', 'per_service') ) DEFAULT 'per_service'`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    try {
      db.run(`ALTER TABLE users ADD COLUMN contractStartDate DATETIME`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    try {
      db.run(`ALTER TABLE users ADD COLUMN contractEndDate DATETIME`);
    } catch (e) {
      // 字段已存在，忽略错误
    }

    // 更新用户角色约束以支持尾料处置商
    try {
      // SQLite 不支持直接修改 CHECK 约束，所以我们需要重建表
      // 但为了安全起见，我们先检查是否已经有尾料处置商用户
      const wasteDisposalUsers = db.query("SELECT COUNT(*) as count FROM users WHERE role = 'waste_disposal_merchant'").get() as { count: number };
      if (wasteDisposalUsers.count === 0) {
        // 如果没有尾料处置商用户，我们可以安全地重建表
        db.run(`
          CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT DEFAULT '',
            phone TEXT UNIQUE,
            role TEXT CHECK( role IN ('admin', 'user', 'waste_disposal_merchant') ) NOT NULL DEFAULT 'user',
            isGovUser BOOLEAN NOT NULL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            approvalStatus TEXT CHECK( approvalStatus IN ('pending', 'approved', 'rejected') ) DEFAULT 'approved',
            approvedBy INTEGER,
            approvedAt DATETIME,
            rejectionReason TEXT,
            billingType TEXT CHECK( billingType IN ('yearly', 'per_service') ) DEFAULT 'per_service',
            contractStartDate DATETIME,
            contractEndDate DATETIME
          );
        `);

        // 复制数据
        db.run(`
          INSERT INTO users_new SELECT * FROM users;
        `);

        // 删除旧表并重命名新表
        db.run(`DROP TABLE users;`);
        db.run(`ALTER TABLE users_new RENAME TO users;`);
      }
    } catch (e) {
      // 如果更新失败，记录错误但不中断程序
      console.warn("更新用户角色约束失败，但系统仍可正常运行:", e);
    }

    // 创建合同表
    db.run(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK( status IN ('active', 'deleted') ) NOT NULL DEFAULT 'active',
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // 创建员工表
    db.run(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        idCard TEXT NOT NULL UNIQUE,
        position TEXT,
        status TEXT CHECK( status IN ('active', 'inactive', 'on_leave') ) NOT NULL DEFAULT 'active',
        isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(phone),
        UNIQUE(idCard)
      );
    `);

    // 创建车辆表
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plateNumber TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        vehicleType TEXT,
        length REAL,
        isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(plateNumber)
      );
    `);

    // 创建预约表 - 更新表结构以支持多个员工和车辆
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
        documentTypesJson TEXT,
        status TEXT CHECK( status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
        estimatedCompletionTime DATETIME,
        processingNotes TEXT,
        lastUpdatedBy INTEGER,
        lastUpdatedAt DATETIME,
        createdBy INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        assignedStaffJson TEXT,
        assignedVehicleJson TEXT,
        FOREIGN KEY (lastUpdatedBy) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // 创建预约历史记录表 - 更新表结构以支持多个员工和车辆
    db.run(`
      CREATE TABLE IF NOT EXISTS appointment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        updatedBy INTEGER NOT NULL,
        updatedAt DATETIME NOT NULL,
        assignedStaffJson TEXT,
        assignedVehicleJson TEXT,
        FOREIGN KEY (appointmentId) REFERENCES appointments (id) ON DELETE CASCADE,
        FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // 创建系统信息表
    db.run(`
      CREATE TABLE IF NOT EXISTS system_info (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        notes TEXT,
        company_name TEXT NOT NULL DEFAULT '中国融通安全保密技术中心',
        company_address TEXT NOT NULL DEFAULT '北京市海淀区xxxxxx',
        company_phone TEXT NOT NULL DEFAULT '010-50806767',
        company_email TEXT NOT NULL DEFAULT 'service@datarecovery.com.cn',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // 插入默认系统信息
    db.run(`
      INSERT OR IGNORE INTO system_info (id, notes, company_name, company_address, company_phone, company_email)
      VALUES (1, '上门分拣服务需由我方评估工作量并与委托方沟通确定人数后，再安排相应分拣工人开展分拣和装包工作；\n按规定，为起到内部监督作用，分拣或装卸，单次单项服务不得低于2人；\n未选择分拣服务，默认已按销毁标准分类完毕。上门装车时，如发现待销物品分类不合规，则现场退回；\n未选择装卸服务，则现场装车、卸载环节自行负责，不提供相应帮助。',
      '中国融通安全保密技术中心', '北京市海淀区xxxxxx', '010-50806767', 'service@datarecovery.com.cn');
    `);

    // 创建销毁任务表
    db.run(`
      CREATE TABLE IF NOT EXISTS destruction_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId TEXT UNIQUE NOT NULL,
        userId INTEGER NOT NULL,
        customerName TEXT NOT NULL,
        contactPhone TEXT NOT NULL,
        contactAddress TEXT NOT NULL,
        scheduledDate DATETIME NOT NULL,
        serviceType TEXT NOT NULL,
        itemDescription TEXT,
        estimatedWeight REAL,
        specialRequirements TEXT,
        status TEXT CHECK( status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // 创建销毁记录表（记录现场服务详情）
    db.run(`
      CREATE TABLE IF NOT EXISTS destruction_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER NOT NULL,
        checkInTime DATETIME,
        checkOutTime DATETIME,
        actualWeight REAL,
        itemCount INTEGER,
        itemDetails TEXT,
        witnessName TEXT,
        witnessSignature TEXT,
        photoUrls TEXT,
        assignedStaffJson TEXT,
        assignedVehicleJson TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (taskId) REFERENCES destruction_tasks (id) ON DELETE CASCADE
      );
    `);

    // 创建销毁证明表
    db.run(`
      CREATE TABLE IF NOT EXISTS destruction_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER NOT NULL,
        certificateNumber TEXT UNIQUE NOT NULL,
        generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        fileUrl TEXT,
        destructionMethod TEXT,
        destructionDate DATETIME,
        operatorName TEXT,
        supervisorName TEXT,
        status TEXT CHECK( status IN ('draft', 'issued', 'revoked') ) NOT NULL DEFAULT 'issued',
        FOREIGN KEY (taskId) REFERENCES destruction_tasks (id) ON DELETE CASCADE
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
let db: Database | null = null;

// 在模块加载时初始化数据库实例，但在构建阶段跳过
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  try {
    console.log("正在初始化数据库 (模块加载时)...");
    db = getDb(); // getDb() 会在数据库不存在时创建并初始化表结构
    console.log("数据库初始化成功 (模块加载时)，可以使用");
  } catch (error) {
    console.error("数据库初始化过程中发生严重错误 (模块加载时):", error);
    // 抛出错误以阻止应用在数据库不可用的情况下启动
    throw new Error(
      `数据库初始化失败 (模块加载时): ${error instanceof Error ? error.message : String(error)}`
    );
  }
} else {
  console.log("构建阶段跳过数据库初始化");
}

/**
 * 获取数据库实例的辅助函数，用于运行时访问
 */
export function getDbInstance(): Database {
  if (!db) {
    // 如果 db 为 null（可能是在构建阶段），则创建新的实例
    db = getDb();
  }
  return db;
}

export { db };
export default getDb;
