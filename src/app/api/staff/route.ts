import {
	type Staff,
	addStaff,
	deleteStaff,
	getAllStaff,
	updateStaff,
} from "@/lib/db/staff.queries";
import { NextRequest, NextResponse } from "next/server";

// 获取所有员工
export async function GET() {
	try {
		const staffList = getAllStaff();
		return NextResponse.json({ success: true, staffList });
	} catch (error) {
		console.error("获取员工列表失败:", error);
		return NextResponse.json(
			{ success: false, message: "获取员工列表失败" },
			{ status: 500 },
		);
	}
}

// 创建新员工
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.name) {
			return NextResponse.json(
				{ success: false, message: "员工姓名必填" },
				{ status: 400 },
			);
		}

		// 使用可选状态值，默认为'active'
		const status: Staff["status"] = ["active", "inactive", "on_leave"].includes(
			body.status,
		)
			? (body.status as Staff["status"])
			: "active";

		const newStaff = addStaff(body.name, status);

		if (!newStaff) {
			return NextResponse.json(
				{ success: false, message: "创建员工失败" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			staff: newStaff,
		});
	} catch (error) {
		console.error("创建员工失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 更新员工
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "员工ID必填" },
				{ status: 400 },
			);
		}

		const updateData: Partial<Pick<Staff, "name" | "status">> = {};

		// 只包含要更新的字段
		if (body.name !== undefined) updateData.name = body.name;

		// 验证状态值有效性
		if (body.status !== undefined) {
			if (!["active", "inactive", "on_leave"].includes(body.status)) {
				return NextResponse.json(
					{ success: false, message: "无效的状态值" },
					{ status: 400 },
				);
			}
			updateData.status = body.status as Staff["status"];
		}

		const updatedStaff = updateStaff(parseInt(body.id), updateData);

		if (!updatedStaff) {
			return NextResponse.json(
				{ success: false, message: "更新员工失败，员工可能不存在" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			staff: updatedStaff,
		});
	} catch (error) {
		console.error("更新员工失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 删除员工
export async function DELETE(request: NextRequest) {
	try {
		// 从 URL 参数获取 ID
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ success: false, message: "员工ID必填" },
				{ status: 400 },
			);
		}

		const success = deleteStaff(parseInt(id));

		if (!success) {
			return NextResponse.json(
				{
					success: false,
					message: "删除员工失败，员工可能不存在或正在被预约使用",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("删除员工失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
