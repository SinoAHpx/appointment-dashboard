import { Database } from "bun:sqlite";
import { withDbConnection } from "./db";

export interface PricingSettings {
    basicServicePrice: number;
    sortingServicePrice: number;
    packagingServicePrice: number;
}

// 默认价格配置
export const DEFAULT_PRICING: PricingSettings = {
    basicServicePrice: 75,
    sortingServicePrice: 750,
    packagingServicePrice: 750
};

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