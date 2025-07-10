#!/usr/bin/env bun

import { getDb } from "../src/lib/db/db";
import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

// 随机生成预约ID - 使用没有分隔符的UUID
function generateAppointmentId(): string {
    return randomUUID().replace(/-/g, '').toUpperCase();
}

// 随机选择数组中的元素
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// 随机选择数组中的多个不重复元素
function randomChoices<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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

const documentTypesByCategory = {
    paper: [
        { value: 'confidential_document', label: '涉密文件' },
        { value: 'regular_document', label: '普通文件' },
        { value: 'archive', label: '档案资料' },
        { value: 'blueprint', label: '图纸' },
    ],
    electronic: [
        { value: 'hard_drive', label: '硬盘' },
        { value: 'ssd', label: '固态硬盘' },
        { value: 'u_disk', label: 'U盘' },
        { value: 'memory_card', label: '存储卡' },
        { value: 'cd', label: '光盘' },
        { value: 'tape', label: '磁带' },
    ],
    other: [
        { value: 'ic_card', label: 'IC卡' },
        { value: 'bank_card', label: '银行卡' },
        { value: 'uniform', label: '制服' },
        { value: 'special_item', label: '特殊物品' },
    ],
};

// 生成随机文件类型和数量的JSON
function generateDocumentTypesJson(): string {
    const docTypes: any = { paper: { items: {} }, electronic: { items: {} }, other: { items: {} } };
    let hasContent = false;

    // 纸介质
    if (Math.random() > 0.3) { // 70% 的几率包含纸介质文件
        const typesToPick = Math.floor(Math.random() * documentTypesByCategory.paper.length) + 1;
        for (let i = 0; i < typesToPick; i++) {
            const type = randomChoice(documentTypesByCategory.paper);
            docTypes.paper.items[type.value] = { count: Math.floor(Math.random() * 100) + 1 };
            hasContent = true;
        }
    }

    // 电子介质
    if (Math.random() > 0.5) { // 50% 的几率
        const typesToPick = Math.floor(Math.random() * documentTypesByCategory.electronic.length) + 1;
        for (let i = 0; i < typesToPick; i++) {
            const type = randomChoice(documentTypesByCategory.electronic);
            docTypes.electronic.items[type.value] = { count: Math.floor(Math.random() * 50) + 1 };
            hasContent = true;
        }
    }

    // 其他介质
    if (Math.random() > 0.8) { // 20% 的几率
        const typesToPick = Math.floor(Math.random() * documentTypesByCategory.other.length) + 1;
        for (let i = 0; i < typesToPick; i++) {
            const type = randomChoice(documentTypesByCategory.other);
            docTypes.other.items[type.value] = { count: Math.floor(Math.random() * 20) + 1 };
            hasContent = true;
        }
    }

    // 确保至少有一项
    if (!hasContent) {
        const type = randomChoice(documentTypesByCategory.paper);
        docTypes.paper.items[type.value] = { count: Math.floor(Math.random() * 100) + 1 };
    }

    return JSON.stringify(docTypes);
}


// 生成测试数据
function generateTestData(db: Database, appointmentCount: number) {
    console.log(`🌱 开始生成 ${appointmentCount} 条预约测试数据...`);

    // 清除现有数据
    db.run("DELETE FROM appointment_history");
    db.run("DELETE FROM appointments");
    db.run("DELETE FROM staff");
    db.run("DELETE FROM vehicles");
    db.run("DELETE FROM users WHERE role != 'admin'"); // 保留管理员
    console.log("✅ 已清除现有测试数据");

    // 确保有管理员用户
    const adminUser = db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
    let adminId = adminUser?.id || 1;
    if (!adminUser) {
        const result = db.run(`
      INSERT INTO users (username, password, role, name) 
      VALUES ('testadmin', 'password123', 'admin', '测试管理员')
    `);
        adminId = result.lastInsertRowid as number;
        console.log("✅ 创建了测试管理员用户");
    }

    // 生成50个普通用户
    const userInsertQuery = db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)");
    for (let i = 0; i < 50; i++) {
        userInsertQuery.run(`user${i}`, 'password', 'user', `普通用户${i}`);
    }
    console.log("✅ 已生成50条用户测试数据");

    // 生成100个员工数据
    const staffInsertQuery = db.prepare("INSERT INTO staff (name, phone, idCard, position, status, isAvailable) VALUES (?, ?, ?, ?, ?, ?)");
    for (let i = 0; i < 100; i++) {
        const phone = `139${String(i).padStart(8, '0')}`;
        const idCard = `11010219900101${String(1000 + i).padStart(4, '0')}`;
        staffInsertQuery.run(`员工${i}`, phone, idCard, "销毁专员", randomChoice(["active", "active", "on_leave"]), Math.random() > 0.2);
    }
    console.log("✅ 已生成100条员工测试数据");

    // 生成30辆车的数据
    const vehicleInsertQuery = db.prepare("INSERT INTO vehicles (plateNumber, model, vehicleType, length, isAvailable) VALUES (?, ?, ?, ?, ?)");
    const vehicleModels = ["东风多利卡", "解放J6F", "福田奥铃", "江铃顺达", "现场销毁车"];
    const vehicleTypes = ["运输车", "收集车", "特种作业车"];
    for (let i = 0; i < 30; i++) {
        vehicleInsertQuery.run(`京A${String(10000 + i).padStart(5, '0')}`, randomChoice(vehicleModels), randomChoice(vehicleTypes), Math.random() * 3 + 4, Math.random() > 0.1);
    }
    console.log("✅ 已生成30条车辆测试数据");

    // 获取所有员工和车辆的ID用于分配
    const staffIds = (db.query("SELECT id FROM staff").all() as any[]).map(s => s.id);
    const vehicleIds = (db.query("SELECT id FROM vehicles").all() as any[]).map(v => v.id);
    const userIds = (db.query("SELECT id FROM users").all() as any[]).map(u => u.id);


    // 生成最近6个月的数据
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // 插入预约数据
    const insertQuery = db.prepare(`
    INSERT INTO appointments (
      appointmentId, customerName, contactPhone, contactAddress, notes, 
      appointmentTime, status, estimatedCompletionTime, 
      processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt,
      documentTypesJson, assignedStaffJson, assignedVehicleJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    // 生成指定数量的测试预约数据
    for (let i = 0; i < appointmentCount; i++) {
        const appointmentId = generateAppointmentId();
        const customerName = randomChoice(customerNames);
        const phone = `1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
        const address = randomChoice(["北京市海淀区中关村大街1号", "北京市朝阳区建国门外大街8号", "北京市西城区金融街35号"]);
        const notes = randomChoice(["涉密级别：机密", "纸质文档较多", "需要现场监督", "紧急处理", null]);

        const appointmentDate = randomDate(sixMonthsAgo, now);
        appointmentDate.setHours(Math.floor(Math.random() * 8) + 9);
        appointmentDate.setMinutes(Math.floor(Math.random() * 4) * 15);
        const appointmentTime = appointmentDate.toISOString();

        const status = randomWeightedStatus();
        const documentTypesJson = generateDocumentTypesJson();

        let estimatedCompletionTime = null;
        let processingNotes = null;
        let lastUpdatedAt = null;
        let assignedStaffJson = null;
        let assignedVehicleJson = null;

        if (status !== "pending" && status !== "cancelled") {
            const estimatedDate = new Date(appointmentDate);
            estimatedDate.setHours(estimatedDate.getHours() + Math.floor(Math.random() * 4) + 2);
            estimatedCompletionTime = estimatedDate.toISOString();
            processingNotes = randomChoice(["按标准流程处理", "客户现场监督", "已完成现场销毁", "等待客户确认"]);
            lastUpdatedAt = new Date(appointmentDate.getTime() + Math.random() * 86400000).toISOString();

            // 分配员工和车辆
            if (staffIds.length > 0) {
                const staffCount = Math.floor(Math.random() * 3) + 1; // 1-3个员工
                assignedStaffJson = JSON.stringify(randomChoices(staffIds, staffCount));
            }
            if (vehicleIds.length > 0 && Math.random() > 0.3) { // 70%几率分配车辆
                const vehicleCount = Math.floor(Math.random() * 2) + 1; // 1-2辆车
                assignedVehicleJson = JSON.stringify(randomChoices(vehicleIds, vehicleCount));
            }
        }

        const createdAt = new Date(appointmentDate.getTime() - Math.random() * 7 * 86400000).toISOString();
        const createdBy = randomChoice(userIds);
        const lastUpdatedBy = randomChoice(userIds);

        insertQuery.run(
            appointmentId, customerName, phone, address, notes,
            appointmentTime, status, estimatedCompletionTime,
            processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt,
            documentTypesJson, assignedStaffJson, assignedVehicleJson
        );
    }

    console.log(`✅ 已生成 ${appointmentCount} 条预约测试数据`);

    // 统计生成的数据
    const appointmentCountResult = db.query("SELECT COUNT(*) as count FROM appointments").get() as any;
    const userCount = db.query("SELECT COUNT(*) as count FROM users").get() as any;
    const staffCount = db.query("SELECT COUNT(*) as count FROM staff").get() as any;
    const vehicleCount = db.query("SELECT COUNT(*) as count FROM vehicles").get() as any;
    const statusStats = db.query("SELECT status, COUNT(*) as count FROM appointments GROUP BY status").all() as any[];

    console.log("📊 数据生成完成统计:");
    console.log(`总预约数: ${appointmentCountResult.count}`);
    console.log(`总用户数: ${userCount.count}`);
    console.log(`总员工数: ${staffCount.count}`);
    console.log(`总车辆数: ${vehicleCount.count}`);
    console.log("预约状态分布:");
    statusStats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat.count}条`);
    });

    console.log("🎉 测试数据生成完成！");
    console.log("💡 使用方法: bun scripts/seed-test-data.ts [数量]");
    console.log("   例如: bun scripts/seed-test-data.ts 1000");
}

// 主执行函数
function main() {
    const countArg = process.argv[2];
    let appointmentCount = 100; // 默认100条

    if (countArg) {
        const parsedCount = parseInt(countArg, 10);
        if (!isNaN(parsedCount) && parsedCount > 0) {
            appointmentCount = parsedCount;
            if (parsedCount === 1000) console.log("🚀 已选择中等数据集 (1,000 条预约)");
            else if (parsedCount === 100000) console.log("🚀 已选择大数据集 (100,000 条预约) - 这可能需要一些时间...");
            else console.log(`🚀 已选择自定义数据集 (${appointmentCount} 条预约)`);
        } else {
            console.warn(`⚠️ 无效的数量参数 '${countArg}'。将使用默认值 100。`);
        }
    }


    try {
        const db = getDb();
        generateTestData(db, appointmentCount);
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