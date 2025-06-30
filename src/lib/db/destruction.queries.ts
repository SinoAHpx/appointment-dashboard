import { getDb } from "./db";

// 销毁任务类型定义
export interface DestructionTask {
    id: number;
    taskId: string;
    userId: number;
    customerName: string;
    contactPhone: string;
    contactAddress: string;
    scheduledDate: string;
    serviceType: string;
    itemDescription?: string | null;
    estimatedWeight?: number | null;
    specialRequirements?: string | null;
    status: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
    createdAt: string;
    updatedAt: string;
}

// 销毁记录类型定义
export interface DestructionRecord {
    id: number;
    taskId: number;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    actualWeight?: number | null;
    itemCount?: number | null;
    itemDetails?: string | null;
    witnessName?: string | null;
    witnessSignature?: string | null;
    photoUrls?: string | null;
    assignedStaffJson?: string | null;
    assignedVehicleJson?: string | null;
    notes?: string | null;
    createdAt: string;
}

// 销毁证明类型定义
export interface DestructionCertificate {
    id: number;
    taskId: number;
    certificateNumber: string;
    generatedAt: string;
    fileUrl?: string | null;
    destructionMethod?: string | null;
    destructionDate?: string | null;
    operatorName?: string | null;
    supervisorName?: string | null;
    status: "draft" | "issued" | "revoked";
}

/**
 * 创建销毁任务
 */
export function createDestructionTask(data: {
    userId: number;
    customerName: string;
    contactPhone: string;
    contactAddress: string;
    scheduledDate: string;
    serviceType: string;
    itemDescription?: string;
    estimatedWeight?: number;
    specialRequirements?: string;
}): DestructionTask | null {
    try {
        const db = getDb();

        // 生成唯一任务ID
        const taskId = `DT${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const query = db.query<DestructionTask, any[]>(`
            INSERT INTO destruction_tasks (
                taskId, userId, customerName, contactPhone, contactAddress,
                scheduledDate, serviceType, itemDescription, estimatedWeight, specialRequirements
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        `);

        return query.get(
            taskId,
            data.userId,
            data.customerName,
            data.contactPhone,
            data.contactAddress,
            data.scheduledDate,
            data.serviceType,
            data.itemDescription || null,
            data.estimatedWeight || null,
            data.specialRequirements || null
        );
    } catch (error) {
        console.error("创建销毁任务失败:", error);
        return null;
    }
}

/**
 * 获取用户的所有销毁任务
 */
export function getUserDestructionTasks(userId: number): DestructionTask[] {
    try {
        const db = getDb();
        const query = db.query<DestructionTask, [number]>(`
            SELECT * FROM destruction_tasks 
            WHERE userId = ? 
            ORDER BY createdAt DESC
        `);
        return query.all(userId);
    } catch (error) {
        console.error("获取用户销毁任务失败:", error);
        return [];
    }
}

/**
 * 获取所有销毁任务（管理员用）
 */
export function getAllDestructionTasks(): DestructionTask[] {
    try {
        const db = getDb();
        const query = db.query<DestructionTask, []>(`
            SELECT * FROM destruction_tasks 
            ORDER BY createdAt DESC
        `);
        return query.all();
    } catch (error) {
        console.error("获取所有销毁任务失败:", error);
        return [];
    }
}

/**
 * 更新销毁任务状态
 */
export function updateDestructionTaskStatus(
    taskId: number,
    status: DestructionTask["status"]
): boolean {
    try {
        const db = getDb();
        const query = db.query<any, [string, string, number]>(`
            UPDATE destruction_tasks 
            SET status = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        query.run(status, new Date().toISOString(), taskId);
        return true;
    } catch (error) {
        console.error("更新销毁任务状态失败:", error);
        return false;
    }
}

/**
 * 创建销毁记录
 */
export function createDestructionRecord(data: {
    taskId: number;
    checkInTime?: string;
    actualWeight?: number;
    itemCount?: number;
    itemDetails?: string;
    witnessName?: string;
    assignedStaffJson?: string;
    assignedVehicleJson?: string;
    notes?: string;
}): DestructionRecord | null {
    try {
        const db = getDb();
        const query = db.query<DestructionRecord, any[]>(`
            INSERT INTO destruction_records (
                taskId, checkInTime, actualWeight, itemCount, itemDetails,
                witnessName, assignedStaffJson, assignedVehicleJson, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        `);

        return query.get(
            data.taskId,
            data.checkInTime || null,
            data.actualWeight || null,
            data.itemCount || null,
            data.itemDetails || null,
            data.witnessName || null,
            data.assignedStaffJson || null,
            data.assignedVehicleJson || null,
            data.notes || null
        );
    } catch (error) {
        console.error("创建销毁记录失败:", error);
        return null;
    }
}

/**
 * 生成销毁证明
 */
export function generateDestructionCertificate(data: {
    taskId: number;
    destructionMethod: string;
    destructionDate: string;
    operatorName: string;
    supervisorName: string;
}): DestructionCertificate | null {
    try {
        const db = getDb();

        // 生成唯一证书编号
        const certificateNumber = `DC${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;

        const query = db.query<DestructionCertificate, any[]>(`
            INSERT INTO destruction_certificates (
                taskId, certificateNumber, destructionMethod, 
                destructionDate, operatorName, supervisorName
            ) VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *
        `);

        return query.get(
            data.taskId,
            certificateNumber,
            data.destructionMethod,
            data.destructionDate,
            data.operatorName,
            data.supervisorName
        );
    } catch (error) {
        console.error("生成销毁证明失败:", error);
        return null;
    }
}

/**
 * 获取销毁任务的证明
 */
export function getTaskCertificate(taskId: number): DestructionCertificate | null {
    try {
        const db = getDb();
        const query = db.query<DestructionCertificate, [number]>(`
            SELECT * FROM destruction_certificates 
            WHERE taskId = ? AND status = 'issued'
            ORDER BY generatedAt DESC
            LIMIT 1
        `);
        return query.get(taskId);
    } catch (error) {
        console.error("获取销毁证明失败:", error);
        return null;
    }
} 