import {
	type Staff,
	type NewStaffData,
	type UpdateStaffData,
	addStaff,
	deleteStaff,
	getAllStaff,
	updateStaff,
} from "@/lib/db/staff.queries";
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, verifyAuth, AuthVerificationResult } from "@/lib/auth";

// 获取所有员工 - 登录用户即可访问
export async function GET(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

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

// 创建新员工 - 仅管理员可访问
const createStaffHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.name) {
			return NextResponse.json(
				{ success: false, message: "员工姓名必填" },
				{ status: 400 },
			);
		}

		if (!body.phone) {
			return NextResponse.json(
				{ success: false, message: "员工手机号必填" },
				{ status: 400 },
			);
		}

		if (!body.idCard) {
			return NextResponse.json(
				{ success: false, message: "员工身份证号码必填" },
				{ status: 400 },
			);
		}

		// 创建新员工数据对象 - isAvailable 和 status 独立处理
		const newStaffData: NewStaffData = {
			name: body.name,
			phone: body.phone,
			idCard: body.idCard,
			position: body.position || null,
			status: ["active", "inactive", "on_leave"].includes(body.status)
				? (body.status as Staff["status"])
				: "active",
			isAvailable: body.isAvailable !== undefined ? body.isAvailable : true, // isAvailable 独立设置
		};

		const newStaff = addStaff(newStaffData);

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
};

export const POST = withAdminAuth(createStaffHandler);

// 更新员工 - 仅管理员可访问
const updateStaffHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
	try {
		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "员工ID必填" },
				{ status: 400 },
			);
		}

		const updateData: UpdateStaffData = {};

		// 只包含要更新的字段
		if (body.name !== undefined) updateData.name = body.name;
		if (body.phone !== undefined) updateData.phone = body.phone;
		if (body.idCard !== undefined) updateData.idCard = body.idCard;
		if (body.position !== undefined) updateData.position = body.position;

		// 验证状态值有效性 - status 独立处理
		if (body.status !== undefined) {
			if (!["active", "inactive", "on_leave"].includes(body.status)) {
				return NextResponse.json(
					{ success: false, message: "无效的状态值" },
					{ status: 400 },
				);
			}
			updateData.status = body.status as Staff["status"];
		}

		// isAvailable 独立处理，不再与 status 自动关联
		if (body.isAvailable !== undefined) {
			if (typeof body.isAvailable !== "boolean") {
				return NextResponse.json(
					{ success: false, message: "isAvailable 必须是布尔值" },
					{ status: 400 },
				);
			}
			updateData.isAvailable = body.isAvailable;
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
};

export const PUT = withAdminAuth(updateStaffHandler);

// 删除员工 - 仅管理员可访问
const deleteStaffHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
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
};

export const DELETE = withAdminAuth(deleteStaffHandler);
