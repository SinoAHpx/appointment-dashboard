import { Database } from "bun:sqlite";
import { withDbConnection } from "./db";

// 传统的固定价格设置（保持向后兼容）
export interface PricingSettings {
    basicServicePrice: number;
    sortingServicePrice: number;
    packagingServicePrice: number;
}

// 新的动态服务项目接口
export interface ServiceItem {
    id: number;
    name: string;
    unit: string; // 计价单位，如 "元/袋", "元/人/天"
    price: number;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceItemInput {
    name: string;
    unit: string;
    price: number;
    description?: string;
}

export interface UpdateServiceItemInput {
    name?: string;
    unit?: string;
    price?: number;
    description?: string;
    isActive?: boolean;
}

// 默认价格配置
export const DEFAULT_PRICING: PricingSettings = {
    basicServicePrice: 75,
    sortingServicePrice: 750,
    packagingServicePrice: 750
};

// 默认服务项目（基于现有的三个固定项目）
export const DEFAULT_SERVICE_ITEMS: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: "基础服务",
        unit: "元/袋",
        price: 75,
        description: "基础处理服务",
        isActive: true
    },
    {
        name: "分拣服务",
        unit: "元/人/天",
        price: 750,
        description: "专业分拣服务",
        isActive: true
    },
    {
        name: "装卸服务",
        unit: "元/人/天",
        price: 750,
        description: "装卸搬运服务",
        isActive: true
    }
];

// ====== 服务项目管理函数 ======

/**
 * 初始化服务项目表和默认数据
 */
export async function initializeServiceItems(db: Database): Promise<void> {
    return withDbConnection(async (db) => {
        // 创建服务项目表
        db.run(`
            CREATE TABLE IF NOT EXISTS service_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                unit TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT,
                isActive INTEGER NOT NULL DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 检查是否已有数据
        const existingCount = db.query("SELECT COUNT(*) as count FROM service_items").get() as { count: number };

        if (existingCount.count === 0) {
            // 插入默认服务项目
            const insertStmt = db.prepare(`
                INSERT INTO service_items (name, unit, price, description, isActive)
                VALUES (?, ?, ?, ?, ?)
            `);

            for (const item of DEFAULT_SERVICE_ITEMS) {
                insertStmt.run(item.name, item.unit, item.price, item.description, item.isActive ? 1 : 0);
            }
        }
    });
}

/**
 * 获取所有服务项目
 */
export async function getAllServiceItems(db: Database): Promise<ServiceItem[]> {
    return withDbConnection(async (db) => {
        // 确保表存在
        await initializeServiceItems(db);

        const items = db.query(`
            SELECT id, name, unit, price, description, isActive, createdAt, updatedAt
            FROM service_items
            ORDER BY createdAt ASC
        `).all() as any[];

        return items.map(item => ({
            ...item,
            isActive: Boolean(item.isActive)
        }));
    });
}

/**
 * 获取启用的服务项目
 */
export async function getActiveServiceItems(db: Database): Promise<ServiceItem[]> {
    return withDbConnection(async (db) => {
        await initializeServiceItems(db);

        const items = db.query(`
            SELECT id, name, unit, price, description, isActive, createdAt, updatedAt
            FROM service_items
            WHERE isActive = 1
            ORDER BY createdAt ASC
        `).all() as any[];

        return items.map(item => ({
            ...item,
            isActive: Boolean(item.isActive)
        }));
    });
}

/**
 * 创建新服务项目
 */
export async function createServiceItem(db: Database, data: CreateServiceItemInput): Promise<ServiceItem | null> {
    return withDbConnection(async (db) => {
        try {
            await initializeServiceItems(db);

            const result = db.query(`
                INSERT INTO service_items (name, unit, price, description, isActive)
                VALUES (?, ?, ?, ?, 1)
                RETURNING id, name, unit, price, description, isActive, createdAt, updatedAt
            `).get(data.name, data.unit, data.price, data.description || null) as any;

            return {
                ...result,
                isActive: Boolean(result.isActive)
            };
        } catch (error) {
            console.error("创建服务项目失败:", error);
            return null;
        }
    });
}

/**
 * 更新服务项目
 */
export async function updateServiceItem(db: Database, id: number, data: UpdateServiceItemInput): Promise<boolean> {
    return withDbConnection(async (db) => {
        try {
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (data.name !== undefined) {
                updateFields.push("name = ?");
                updateValues.push(data.name);
            }
            if (data.unit !== undefined) {
                updateFields.push("unit = ?");
                updateValues.push(data.unit);
            }
            if (data.price !== undefined) {
                updateFields.push("price = ?");
                updateValues.push(data.price);
            }
            if (data.description !== undefined) {
                updateFields.push("description = ?");
                updateValues.push(data.description);
            }
            if (data.isActive !== undefined) {
                updateFields.push("isActive = ?");
                updateValues.push(data.isActive ? 1 : 0);
            }

            if (updateFields.length === 0) {
                return false;
            }

            updateFields.push("updatedAt = CURRENT_TIMESTAMP");
            updateValues.push(id);

            const query = `
                UPDATE service_items 
                SET ${updateFields.join(", ")}
                WHERE id = ?
            `;

            db.query(query).run(...updateValues);
            return true;
        } catch (error) {
            console.error("更新服务项目失败:", error);
            return false;
        }
    });
}

/**
 * 删除服务项目（软删除，设置为非活跃状态）
 */
export async function deleteServiceItem(db: Database, id: number): Promise<boolean> {
    return updateServiceItem(db, id, { isActive: false });
}

// ====== 保持向后兼容的传统函数 ======

export async function getPricingSettings(db: Database): Promise<PricingSettings> {
    return withDbConnection(async (db) => {
        // 检查价格设置表是否存在
        const tableExists = db.query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='price_settings'
        `).get();

        // 如果表不存在，创建表并插入默认值
        if (!tableExists) {
            db.run(`
                CREATE TABLE IF NOT EXISTS price_settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    basicServicePrice REAL NOT NULL,
                    sortingServicePrice REAL NOT NULL,
                    packagingServicePrice REAL NOT NULL,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.query(`
                INSERT INTO price_settings (
                    id, basicServicePrice, sortingServicePrice, packagingServicePrice
                ) VALUES (?, ?, ?, ?)
            `).run(
                1,
                DEFAULT_PRICING.basicServicePrice,
                DEFAULT_PRICING.sortingServicePrice,
                DEFAULT_PRICING.packagingServicePrice
            );

            return DEFAULT_PRICING;
        }

        // 获取价格设置
        const pricing = db.query(`
            SELECT basicServicePrice, sortingServicePrice, packagingServicePrice
            FROM price_settings
            WHERE id = 1
        `).get() as PricingSettings | undefined;

        return pricing || DEFAULT_PRICING;
    });
}

export async function updatePricingSettings(db: Database, pricing: PricingSettings): Promise<boolean> {
    return withDbConnection(async (db) => {
        try {
            // 更新价格设置
            db.query(`
                UPDATE price_settings
                SET basicServicePrice = ?,
                    sortingServicePrice = ?,
                    packagingServicePrice = ?,
                    updatedAt = CURRENT_TIMESTAMP
                WHERE id = 1
            `).run(
                pricing.basicServicePrice,
                pricing.sortingServicePrice,
                pricing.packagingServicePrice
            );

            return true;
        } catch (error) {
            console.error("更新价格设置失败:", error);
            return false;
        }
    });
}