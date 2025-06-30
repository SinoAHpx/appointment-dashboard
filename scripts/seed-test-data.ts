#!/usr/bin/env bun

import { getDb } from "../src/lib/db/db";
import { Database } from "bun:sqlite";

// 随机生成预约ID
function generateAppointmentId(): string {
    const prefix = 'APT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${random}`;
}

// 随机选择数组中的元素
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// 生成随机日期
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 客户姓名列表
const customerNames = [
    "张伟", "李娜", "王强", "刘敏", "陈杰", "杨丽", "赵斌", "孙婷", "周磊", "吴娟",
    "徐飞", "朱红", "马超", "胡玲", "郭亮", "何静", "高峰", "林芳", "梁勇", "宋佳",
    "北京市政府办公厅", "中国银行总行", "清华大学", "北京大学", "中科院", "华为技术有限公司",
    "腾讯科技", "阿里巴巴集团", "百度公司", "小米科技", "字节跳动", "美团"
];

// 服务类型
const serviceTypes = [
    "涉密文件销毁", "一般文件销毁", "电子介质销毁", "硬盘销毁", "光盘销毁",
    "U盘销毁", "综合销毁服务", "上门收集", "现场销毁", "档案销毁"
];

// 状态权重（让完成的数据多一些）
const statusWeights = [
    { status: "pending", weight: 15 },
    { status: "confirmed", weight: 20 },
    { status: "in_progress", weight: 10 },
    { status: "completed", weight: 45 },
    { status: "cancelled", weight: 10 }
];

// 根据权重随机选择状态
function randomWeightedStatus(): string {
    const totalWeight = statusWeights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of statusWeights) {
        random -= item.weight;
        if (random <= 0) {
            return item.status;
        }
    }
    return "pending";
}

// 生成测试数据
function generateTestData(db: Database) {
    console.log("🌱 开始生成测试数据...");

    // 清除现有的预约数据
    db.run("DELETE FROM appointment_history");
    db.run("DELETE FROM appointments");
    console.log("✅ 已清除现有预约数据");

    // 确保有管理员用户
    const adminUser = db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
    let adminId = adminUser?.id || 1;

    // 如果没有管理员，创建一个
    if (!adminUser) {
        const result = db.run(`
      INSERT INTO users (username, password, role, name) 
      VALUES ('testadmin', 'password123', 'admin', '测试管理员')
    `);
        adminId = result.lastInsertRowid as number;
        console.log("✅ 创建了测试管理员用户");
    }

    // 生成最近6个月的数据
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // 插入预约数据
    const insertQuery = db.prepare(`
    INSERT INTO appointments (
      appointmentId, customerName, contactPhone, contactAddress, notes, 
      documentCount, appointmentTime, serviceType, status, 
      estimatedCompletionTime, processingNotes, lastUpdatedBy, 
      lastUpdatedAt, createdBy, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    // 生成100条测试预约数据
    for (let i = 0; i < 100; i++) {
        const appointmentId = generateAppointmentId();
        const customerName = randomChoice(customerNames);
        const phone = `1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
        const address = randomChoice([
            "北京市海淀区中关村大街1号",
            "北京市朝阳区建国门外大街8号",
            "北京市西城区金融街35号",
            "北京市东城区王府井大街138号",
            "北京市丰台区科技园区南四环西路128号",
            "北京市石景山区石景山路68号",
            "北京市昌平区回龙观东大街3号"
        ]);

        const notes = randomChoice([
            "涉密级别：机密", "涉密级别：秘密", "涉密级别：内部",
            "纸质文档较多", "包含电子介质", "需要现场监督",
            "紧急处理", "定期销毁", "年度档案清理", null
        ]);

        const documentCount = Math.floor(Math.random() * 50) + 1;

        // 生成随机时间，大部分在工作时间
        const appointmentDate = randomDate(sixMonthsAgo, now);
        appointmentDate.setHours(Math.floor(Math.random() * 8) + 9); // 9-17点
        appointmentDate.setMinutes(Math.floor(Math.random() * 4) * 15); // 0, 15, 30, 45分
        const appointmentTime = appointmentDate.toISOString();

        const serviceType = randomChoice(serviceTypes);
        const status = randomWeightedStatus();

        let estimatedCompletionTime = null;
        let processingNotes = null;
        let lastUpdatedAt = null;

        if (status !== "pending") {
            // 如果不是待确认状态，添加预计完成时间和处理备注
            const estimatedDate = new Date(appointmentDate);
            estimatedDate.setHours(estimatedDate.getHours() + Math.floor(Math.random() * 4) + 2);
            estimatedCompletionTime = estimatedDate.toISOString();

            processingNotes = randomChoice([
                "按标准流程处理", "需特殊处理", "客户现场监督",
                "已完成现场销毁", "文档已安全销毁", "按保密要求执行",
                "等待客户确认", "处理中", "已派车前往"
            ]);

            lastUpdatedAt = new Date(appointmentDate.getTime() + Math.random() * 86400000).toISOString();
        }

        const createdAt = new Date(appointmentDate.getTime() - Math.random() * 7 * 86400000).toISOString();

        insertQuery.run(
            appointmentId,
            customerName,
            phone,
            address,
            notes,
            documentCount,
            appointmentTime,
            serviceType,
            status,
            estimatedCompletionTime,
            processingNotes,
            adminId,
            lastUpdatedAt,
            adminId,
            createdAt
        );
    }

    console.log("✅ 已生成100条预约测试数据");

    // 生成一些员工数据
    const staffNames = ["张师傅", "李师傅", "王师傅", "刘师傅", "陈师傅"];
    const staffInsertQuery = db.prepare(`
    INSERT OR IGNORE INTO staff (name, phone, idCard, position, status, isAvailable)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (let i = 0; i < staffNames.length; i++) {
        const phone = `138${String(i + 1).padStart(8, '0')}`;
        const idCard = `11010119${String(80 + i).padStart(2, '0')}010100${String(i + 1)}`;

        staffInsertQuery.run(
            staffNames[i],
            phone,
            idCard,
            "销毁专员",
            randomChoice(["active", "active", "active", "on_leave"]), // 大部分是active
            Math.random() > 0.2 // 80%可用
        );
    }

    console.log("✅ 已生成员工测试数据");

    // 生成一些车辆数据
    const vehicleData = [
        { plate: "京A12345", model: "东风多利卡", type: "运输车" },
        { plate: "京B67890", model: "解放J6F", type: "运输车" },
        { plate: "京C11111", model: "福田奥铃", type: "收集车" },
        { plate: "京D22222", model: "江铃顺达", type: "收集车" },
        { plate: "京E33333", model: "现场销毁车", type: "特种作业车" }
    ];

    const vehicleInsertQuery = db.prepare(`
    INSERT OR IGNORE INTO vehicles (plateNumber, model, vehicleType, length, isAvailable)
    VALUES (?, ?, ?, ?, ?)
  `);

    for (const vehicle of vehicleData) {
        vehicleInsertQuery.run(
            vehicle.plate,
            vehicle.model,
            vehicle.type,
            Math.random() * 3 + 4, // 4-7米
            Math.random() > 0.1 // 90%可用
        );
    }

    console.log("✅ 已生成车辆测试数据");

    // 统计生成的数据
    const appointmentCount = db.query("SELECT COUNT(*) as count FROM appointments").get() as any;
    const staffCount = db.query("SELECT COUNT(*) as count FROM staff").get() as any;
    const vehicleCount = db.query("SELECT COUNT(*) as count FROM vehicles").get() as any;

    // 按状态统计
    const statusStats = db.query(`
    SELECT status, COUNT(*) as count 
    FROM appointments 
    GROUP BY status
  `).all() as any[];

    console.log("\n📊 数据生成完成统计:");
    console.log(`总预约数: ${appointmentCount.count}`);
    console.log(`总员工数: ${staffCount.count}`);
    console.log(`总车辆数: ${vehicleCount.count}`);
    console.log("\n预约状态分布:");
    statusStats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat.count}条`);
    });

    console.log("\n🎉 测试数据生成完成！现在可以查看仪表板图表效果了。");
}

// 主执行函数
function main() {
    try {
        const db = getDb();
        generateTestData(db);
    } catch (error) {
        console.error("❌ 生成测试数据时出错:", error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (import.meta.main) {
    main();
}

export { generateTestData }; 