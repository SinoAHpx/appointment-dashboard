import type { Database } from "bun:sqlite";

export interface Contract {
    id: number;
    userId: number;
    filename: string;
    filepath: string;
    uploadedAt: string;
    status: "active" | "deleted";
    // 关联用户信息
    username?: string;
    name?: string;
    phone?: string;
    approvalStatus?: "pending" | "approved" | "rejected";
}

/**
 * 创建新合同记录
 */
export function createContract(
    db: Database,
    userId: number,
    filename: string,
    filepath: string,
): Contract {
    const stmt = db.prepare(`
    INSERT INTO contracts (userId, filename, filepath)
    VALUES (?, ?, ?)
  `);

    const result = stmt.run(userId, filename, filepath);

    // 检查插入是否成功 - 在Bun SQLite中，我们检查changes属性
    if (result.changes === 0) {
        throw new Error("创建合同记录失败");
    }

    // 检查是否有lastInsertRowid
    if (!result.lastInsertRowid) {
        throw new Error("获取合同ID失败");
    }

    return getContractById(db, result.lastInsertRowid as number);
}

/**
 * 根据ID获取合同信息
 */
export function getContractById(db: Database, id: number): Contract {
    const stmt = db.prepare(`
    SELECT c.*, u.username, u.name, u.phone, u.approvalStatus
    FROM contracts c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.id = ? AND c.status = 'active'
  `);

    const contract = stmt.get(id) as Contract;
    if (!contract) {
        throw new Error("合同不存在");
    }

    return contract;
}

/**
 * 根据用户ID获取合同信息
 */
export function getContractsByUserId(db: Database, userId: number): Contract[] {
    const stmt = db.prepare(`
    SELECT c.*, u.username, u.name, u.phone, u.approvalStatus
    FROM contracts c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.userId = ? AND c.status = 'active'
    ORDER BY c.uploadedAt DESC
  `);

    return stmt.all(userId) as Contract[];
}

/**
 * 获取所有合同列表（带用户信息）
 */
export function getAllContracts(db: Database): Contract[] {
    const stmt = db.prepare(`
    SELECT c.*, u.username, u.name, u.phone, u.approvalStatus
    FROM contracts c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.status = 'active'
    ORDER BY c.uploadedAt DESC
  `);

    return stmt.all() as Contract[];
}

/**
 * 获取待审核用户的合同列表
 */
export function getPendingContracts(db: Database): Contract[] {
    const stmt = db.prepare(`
    SELECT c.*, u.username, u.name, u.phone, u.approvalStatus
    FROM contracts c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.status = 'active' AND u.approvalStatus = 'pending'
    ORDER BY c.uploadedAt DESC
  `);

    return stmt.all() as Contract[];
}

/**
 * 删除合同（软删除）
 */
export function deleteContract(db: Database, id: number): boolean {
    const stmt = db.prepare(`
    UPDATE contracts 
    SET status = 'deleted'
    WHERE id = ?
  `);

    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * 获取合同统计信息
 */
export function getContractStats(db: Database) {
    const totalStmt = db.prepare(`
    SELECT COUNT(*) as total FROM contracts WHERE status = 'active'
  `);

    const pendingStmt = db.prepare(`
    SELECT COUNT(*) as pending 
    FROM contracts c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.status = 'active' AND u.approvalStatus = 'pending'
  `);

    const approvedStmt = db.prepare(`
    SELECT COUNT(*) as approved 
    FROM contracts c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.status = 'active' AND u.approvalStatus = 'approved'
  `);

    const total = (totalStmt.get() as any)?.total || 0;
    const pending = (pendingStmt.get() as any)?.pending || 0;
    const approved = (approvedStmt.get() as any)?.approved || 0;

    return {
        total,
        pending,
        approved,
        rejected: total - pending - approved,
    };
} 