import { getDb } from "../src/lib/db/db";

async function createTestUsers() {
    const db = getDb();

    console.log("正在创建测试用户...");

    try {
        // 创建尾料处置商用户
        const wasteDisposalMerchants = [
            {
                username: "merchant1",
                password: "123456",
                name: "北京环保科技有限公司",
                phone: "13800138001",
                role: "waste_disposal_merchant"
            },
            {
                username: "merchant2",
                password: "123456",
                name: "上海绿色回收公司",
                phone: "13800138002",
                role: "waste_disposal_merchant"
            },
            {
                username: "merchant3",
                password: "123456",
                name: "深圳废料处理中心",
                phone: "13800138003",
                role: "waste_disposal_merchant"
            }
        ];

        // 创建普通用户
        const normalUsers = [
            {
                username: "user1",
                password: "123456",
                name: "张三",
                phone: "13800138011",
                role: "user"
            },
            {
                username: "user2",
                password: "123456",
                name: "李四",
                phone: "13800138012",
                role: "user"
            }
        ];

        // 插入尾料处置商
        for (const merchant of wasteDisposalMerchants) {
            try {
                const query = db.query(`
                    INSERT INTO users (username, password, name, phone, role, approvalStatus) 
                    VALUES (?, ?, ?, ?, ?, 'approved')
                `);
                query.run(merchant.username, merchant.password, merchant.name, merchant.phone, merchant.role);
                console.log(`✅ 创建尾料处置商: ${merchant.name} (${merchant.username})`);
            } catch (error: any) {
                if (error.message.includes("UNIQUE constraint failed")) {
                    console.log(`⚠️  尾料处置商 ${merchant.username} 已存在`);
                } else {
                    console.error(`❌ 创建尾料处置商 ${merchant.username} 失败:`, error);
                }
            }
        }

        // 插入普通用户
        for (const user of normalUsers) {
            try {
                const query = db.query(`
                    INSERT INTO users (username, password, name, phone, role, approvalStatus) 
                    VALUES (?, ?, ?, ?, ?, 'approved')
                `);
                query.run(user.username, user.password, user.name, user.phone, user.role);
                console.log(`✅ 创建普通用户: ${user.name} (${user.username})`);
            } catch (error: any) {
                if (error.message.includes("UNIQUE constraint failed")) {
                    console.log(`⚠️  普通用户 ${user.username} 已存在`);
                } else {
                    console.error(`❌ 创建普通用户 ${user.username} 失败:`, error);
                }
            }
        }

        console.log("\n📊 用户创建完成！");
        console.log("=".repeat(50));
        console.log("登录信息:");
        console.log("管理员: admin / admin123");
        console.log("\n尾料处置商账户:");
        wasteDisposalMerchants.forEach(m => {
            console.log(`- ${m.name}: ${m.username} / ${m.password}`);
        });
        console.log("\n普通用户账户:");
        normalUsers.forEach(u => {
            console.log(`- ${u.name}: ${u.username} / ${u.password}`);
        });

    } catch (error) {
        console.error("创建测试用户时发生错误:", error);
    }
}

// 运行脚本
createTestUsers(); 