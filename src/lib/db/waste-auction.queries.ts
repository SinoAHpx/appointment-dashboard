import { getDb } from "./db";

// 尾料批次类型定义
export interface WasteBatch {
    id: number;
    batchNumber: string;
    title: string;
    description?: string | null;
    estimatedWeight?: number | null;
    location?: string | null;
    wasteType: string;
    category?: string | null;
    createdAt: string;
    createdBy: number;
    status: "draft" | "published" | "auction_in_progress" | "auction_ended" | "allocated";
}

// 竞价类型定义
export interface WasteAuction {
    id: number;
    batchId: number;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    basePrice: number;
    reservePrice?: number | null;
    status: "pending" | "active" | "ended" | "cancelled";
    createdAt: string;
    createdBy: number;
    winnerId?: number | null;
    winningBid?: number | null;
    // 关联数据
    batch?: Partial<WasteBatch>;
    bidCount?: number;
    highestBid?: number;
}

// 出价类型定义
export interface WasteBid {
    id: number;
    auctionId: number;
    bidderId: number;
    bidAmount: number;
    bidTime: string;
    notes?: string | null;
    status: "active" | "outbid" | "winning" | "cancelled";
    // 关联数据
    bidder?: {
        id: number;
        name: string;
        username: string;
    };
}

/**
 * 创建尾料批次
 */
export function createWasteBatch(data: {
    title: string;
    description?: string;
    estimatedWeight?: number;
    location?: string;
    wasteType: string;
    category?: string;
    createdBy: number;
}): WasteBatch | null {
    try {
        const db = getDb();

        // 生成唯一批次编号
        const batchNumber = `WB${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const query = db.query<WasteBatch, any[]>(`
            INSERT INTO waste_batches (
                batchNumber, title, description, estimatedWeight, location, wasteType, category, createdBy, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
            RETURNING *
        `);

        return query.get(
            batchNumber,
            data.title,
            data.description || null,
            data.estimatedWeight || null,
            data.location || null,
            data.wasteType,
            data.category || null,
            data.createdBy
        );
    } catch (error) {
        console.error("创建尾料批次失败:", error);
        return null;
    }
}

/**
 * 获取所有尾料批次
 */
export function getAllWasteBatches(): WasteBatch[] {
    try {
        const db = getDb();
        const query = db.query<WasteBatch, []>(`
            SELECT * FROM waste_batches 
            ORDER BY createdAt DESC
        `);
        return query.all();
    } catch (error) {
        console.error("获取尾料批次失败:", error);
        return [];
    }
}

/**
 * 获取单个尾料批次
 */
export function getWasteBatchById(id: number): WasteBatch | null {
    try {
        const db = getDb();
        const query = db.query<WasteBatch, [number]>(`
            SELECT * FROM waste_batches WHERE id = ?
        `);
        return query.get(id);
    } catch (error) {
        console.error("获取尾料批次失败:", error);
        return null;
    }
}

/**
 * 更新尾料批次状态
 */
export function updateWasteBatchStatus(id: number, status: WasteBatch["status"]): boolean {
    try {
        const db = getDb();
        const query = db.query<any, [string, number]>(`
            UPDATE waste_batches SET status = ? WHERE id = ?
        `);
        query.run(status, id);
        return true;
    } catch (error) {
        console.error("更新尾料批次状态失败:", error);
        return false;
    }
}

/**
 * 删除尾料批次
 */
export function deleteWasteBatch(id: number): boolean {
    try {
        const db = getDb();
        const query = db.query<any, [number]>(`
            DELETE FROM waste_batches WHERE id = ?
        `);
        query.run(id);
        return true;
    } catch (error) {
        console.error("删除尾料批次失败:", error);
        return false;
    }
}

/**
 * 根据时间计算竞价状态
 */
function calculateAuctionStatus(startTime: string, endTime: string): WasteAuction["status"] {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
        return "pending";
    } else if (now >= start && now < end) {
        return "active";
    } else {
        return "ended";
    }
}

/**
 * 创建竞价
 */
export function createWasteAuction(data: {
    batchId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    reservePrice?: number;
    createdBy: number;
}): WasteAuction | null {
    try {
        const db = getDb();

        // 根据时间计算初始状态
        const initialStatus = calculateAuctionStatus(data.startTime, data.endTime);

        const query = db.query<WasteAuction, any[]>(`
            INSERT INTO waste_auctions (
                batchId, title, description, startTime, endTime, basePrice, reservePrice, createdBy, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        `);

        return query.get(
            data.batchId,
            data.title,
            data.description || null,
            data.startTime,
            data.endTime,
            data.basePrice,
            data.reservePrice || null,
            data.createdBy,
            initialStatus
        );
    } catch (error) {
        console.error("创建竞价失败:", error);
        return null;
    }
}

/**
 * 获取所有竞价（带关联数据和动态状态）
 */
export function getAllWasteAuctions(): WasteAuction[] {
    try {
        const db = getDb();
        const query = db.query<any, []>(`
            SELECT 
                wa.*,
                wb.batchNumber,
                wb.title as batchTitle,
                wb.wasteType,
                wb.estimatedWeight,
                wb.location,
                COUNT(wbi.id) as bidCount,
                MAX(wbi.bidAmount) as highestBid
            FROM waste_auctions wa
            LEFT JOIN waste_batches wb ON wa.batchId = wb.id
            LEFT JOIN waste_bids wbi ON wa.id = wbi.auctionId AND wbi.status = 'active'
            GROUP BY wa.id
            ORDER BY wa.createdAt DESC
        `);

        return query.all().map((row: any) => {
            // 动态计算当前状态
            const currentStatus = calculateAuctionStatus(row.startTime, row.endTime);

            // 如果状态发生变化，更新数据库
            if (currentStatus !== row.status && row.status !== 'cancelled') {
                updateWasteAuctionStatus(row.id, currentStatus);
            }

            return {
                id: row.id,
                batchId: row.batchId,
                title: row.title,
                description: row.description,
                startTime: row.startTime,
                endTime: row.endTime,
                basePrice: row.basePrice,
                reservePrice: row.reservePrice,
                status: currentStatus, // 使用动态计算的状态
                createdAt: row.createdAt,
                createdBy: row.createdBy,
                winnerId: row.winnerId,
                winningBid: row.winningBid,
                batch: {
                    id: row.batchId,
                    batchNumber: row.batchNumber,
                    title: row.batchTitle,
                    wasteType: row.wasteType,
                    estimatedWeight: row.estimatedWeight,
                    location: row.location,
                },
                bidCount: row.bidCount || 0,
                highestBid: row.highestBid || 0,
            };
        });
    } catch (error) {
        console.error("获取竞价列表失败:", error);
        return [];
    }
}

/**
 * 获取活跃的竞价（尾料处置商可见）
 */
export function getActiveWasteAuctions(): WasteAuction[] {
    try {
        const db = getDb();
        const query = db.query<any, []>(`
            SELECT 
                wa.*,
                wb.batchNumber,
                wb.title as batchTitle,
                wb.wasteType,
                wb.estimatedWeight,
                wb.location,
                COUNT(wbi.id) as bidCount,
                MAX(wbi.bidAmount) as highestBid
            FROM waste_auctions wa
            LEFT JOIN waste_batches wb ON wa.batchId = wb.id
            LEFT JOIN waste_bids wbi ON wa.id = wbi.auctionId AND wbi.status = 'active'
            WHERE wa.status IN ('pending', 'active')
            GROUP BY wa.id
            ORDER BY wa.endTime ASC
        `);

        return query.all().map((row: any) => {
            // 动态计算当前状态
            const currentStatus = calculateAuctionStatus(row.startTime, row.endTime);

            // 如果状态发生变化，更新数据库
            if (currentStatus !== row.status && row.status !== 'cancelled') {
                updateWasteAuctionStatus(row.id, currentStatus);
            }

            return {
                id: row.id,
                batchId: row.batchId,
                title: row.title,
                description: row.description,
                startTime: row.startTime,
                endTime: row.endTime,
                basePrice: row.basePrice,
                reservePrice: row.reservePrice,
                status: currentStatus, // 使用动态计算的状态
                createdAt: row.createdAt,
                createdBy: row.createdBy,
                winnerId: row.winnerId,
                winningBid: row.winningBid,
                batch: {
                    id: row.batchId,
                    batchNumber: row.batchNumber,
                    title: row.batchTitle,
                    wasteType: row.wasteType,
                    estimatedWeight: row.estimatedWeight,
                    location: row.location,
                },
                bidCount: row.bidCount || 0,
                highestBid: row.highestBid || 0,
            };
        });
    } catch (error) {
        console.error("获取活跃竞价失败:", error);
        return [];
    }
}

/**
 * 获取竞价详情
 */
export function getWasteAuctionById(id: number): WasteAuction | null {
    try {
        const db = getDb();
        const query = db.query<any, [number]>(`
            SELECT 
                wa.*,
                wb.batchNumber,
                wb.title as batchTitle,
                wb.wasteType,
                wb.estimatedWeight,
                wb.location,
                wb.description as batchDescription
            FROM waste_auctions wa
            LEFT JOIN waste_batches wb ON wa.batchId = wb.id
            WHERE wa.id = ?
        `);

        const row = query.get(id);
        if (!row) return null;

        return {
            id: row.id,
            batchId: row.batchId,
            title: row.title,
            description: row.description,
            startTime: row.startTime,
            endTime: row.endTime,
            basePrice: row.basePrice,
            reservePrice: row.reservePrice,
            status: row.status,
            createdAt: row.createdAt,
            createdBy: row.createdBy,
            winnerId: row.winnerId,
            winningBid: row.winningBid,
            batch: {
                id: row.batchId,
                batchNumber: row.batchNumber,
                title: row.batchTitle,
                wasteType: row.wasteType,
                estimatedWeight: row.estimatedWeight,
                location: row.location,
                description: row.batchDescription,
            },
        };
    } catch (error) {
        console.error("获取竞价详情失败:", error);
        return null;
    }
}

/**
 * 创建出价
 */
export function createWasteBid(data: {
    auctionId: number;
    bidderId: number;
    bidAmount: number;
    notes?: string;
}): WasteBid | null {
    try {
        const db = getDb();

        // 先将该用户在此竞价中的其他出价标记为outbid
        const updateQuery = db.query<any, [number, number]>(`
            UPDATE waste_bids 
            SET status = 'outbid' 
            WHERE auctionId = ? AND bidderId = ? AND status = 'active'
        `);
        updateQuery.run(data.auctionId, data.bidderId);

        // 创建新出价
        const insertQuery = db.query<WasteBid, any[]>(`
            INSERT INTO waste_bids (auctionId, bidderId, bidAmount, notes) 
            VALUES (?, ?, ?, ?)
            RETURNING *
        `);

        return insertQuery.get(
            data.auctionId,
            data.bidderId,
            data.bidAmount,
            data.notes || null
        );
    } catch (error) {
        console.error("创建出价失败:", error);
        return null;
    }
}

/**
 * 获取竞价的所有出价
 */
export function getAuctionBids(auctionId: number): WasteBid[] {
    try {
        const db = getDb();
        const query = db.query<any, [number]>(`
            SELECT 
                wb.*,
                u.name as bidderName,
                u.username as bidderUsername
            FROM waste_bids wb
            LEFT JOIN users u ON wb.bidderId = u.id
            WHERE wb.auctionId = ?
            ORDER BY wb.bidAmount DESC, wb.bidTime DESC
        `);

        return query.all(auctionId).map((row: any) => ({
            id: row.id,
            auctionId: row.auctionId,
            bidderId: row.bidderId,
            bidAmount: row.bidAmount,
            bidTime: row.bidTime,
            notes: row.notes,
            status: row.status,
            bidder: {
                id: row.bidderId,
                name: row.bidderName,
                username: row.bidderUsername,
            },
        }));
    } catch (error) {
        console.error("获取竞价出价失败:", error);
        return [];
    }
}

/**
 * 获取用户的出价历史
 */
export function getUserBids(userId: number): WasteBid[] {
    try {
        const db = getDb();
        const query = db.query<any, [number]>(`
            SELECT 
                wb.*,
                wa.title as auctionTitle,
                wab.title as batchTitle,
                wab.batchNumber
            FROM waste_bids wb
            LEFT JOIN waste_auctions wa ON wb.auctionId = wa.id
            LEFT JOIN waste_batches wab ON wa.batchId = wab.id
            WHERE wb.bidderId = ?
            ORDER BY wb.bidTime DESC
        `);

        return query.all(userId);
    } catch (error) {
        console.error("获取用户出价历史失败:", error);
        return [];
    }
}

/**
 * 更新竞价状态
 */
export function updateWasteAuctionStatus(id: number, status: WasteAuction["status"]): boolean {
    try {
        const db = getDb();
        const query = db.query<any, [string, number]>(`
            UPDATE waste_auctions SET status = ? WHERE id = ?
        `);
        query.run(status, id);
        return true;
    } catch (error) {
        console.error("更新竞价状态失败:", error);
        return false;
    }
}

/**
 * 确定竞价获胜者
 */
export function setAuctionWinner(auctionId: number, winnerId: number, winningBid: number): boolean {
    try {
        const db = getDb();

        // 更新竞价结果
        const updateAuctionQuery = db.query<any, [number, number, string, number]>(`
            UPDATE waste_auctions 
            SET winnerId = ?, winningBid = ?, status = 'ended'
            WHERE id = ?
        `);
        updateAuctionQuery.run(winnerId, winningBid, 'ended', auctionId);

        // 更新所有出价状态
        const updateBidsQuery = db.query<any, [number, number]>(`
            UPDATE waste_bids 
            SET status = CASE 
                WHEN bidderId = ? THEN 'winning'
                ELSE 'outbid'
            END
            WHERE auctionId = ? AND status = 'active'
        `);
        updateBidsQuery.run(winnerId, auctionId);

        return true;
    } catch (error) {
        console.error("设置竞价获胜者失败:", error);
        return false;
    }
}