import { Database } from "bun:sqlite";
import { withDbConnection } from "./db";

export interface SystemInfo {
    notes: string;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    updated_at?: string;
    updated_by?: number;
}

/**
 * 获取系统信息
 */
export async function getSystemInfo(): Promise<SystemInfo | null> {
    return withDbConnection((db: Database) => {
        const info = db.query(`
      SELECT notes, company_name, company_address, company_phone, company_email, updated_at
      FROM system_info
      WHERE id = 1
    `).get();

        return info as SystemInfo | null;
    });
}

/**
 * 更新系统信息
 */
export async function updateSystemInfo(info: Partial<SystemInfo>): Promise<void> {
    return withDbConnection((db: Database) => {
        const updateFields = [];
        const values = [];

        // 构建动态更新字段
        Object.entries(info).forEach(([key, value]) => {
            if (value !== undefined && key !== 'updated_at' && key !== 'updated_by') {
                updateFields.push(`${key} = ?`);
                values.push(value);
            }
        });

        // 添加更新时间和更新者
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateFields.push('updated_by = ?');
        values.push(1);

        const query = `
      UPDATE system_info
      SET ${updateFields.join(', ')}
      WHERE id = 1
    `;

        db.run(query, values);
    });
} 