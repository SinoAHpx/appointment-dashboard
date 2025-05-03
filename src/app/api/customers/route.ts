import {
	type NewCustomerData,
	type UpdateCustomerData,
	addCustomer,
	deleteCustomer,
	getAllCustomers,
	updateCustomer,
} from "@/lib/customer.queries";
import { NextRequest, NextResponse } from "next/server";

// 获取所有客户
export async function GET() {
	try {
		const customers = getAllCustomers();
		return NextResponse.json({ success: true, customers });
	} catch (error) {
		console.error("获取客户列表失败:", error);
		return NextResponse.json(
			{ success: false, message: "获取客户列表失败" },
			{ status: 500 },
		);
	}
}

// 创建新客户
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.name) {
			return NextResponse.json(
				{ success: false, message: "客户姓名必填" },
				{ status: 400 },
			);
		}

		const customerData: NewCustomerData = {
			name: body.name,
			phone: body.phone || null,
			email: body.email || null,
			address: body.address || null,
			company: body.company || null,
		};

		const newCustomer = addCustomer(customerData);

		if (!newCustomer) {
			return NextResponse.json(
				{
					success: false,
					message: "创建客户失败，可能是手机号或邮箱已被使用",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			customer: newCustomer,
		});
	} catch (error) {
		console.error("创建客户失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 更新客户
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "客户ID必填" },
				{ status: 400 },
			);
		}

		const updateData: UpdateCustomerData = {};

		// 只包含要更新的字段
		if (body.name !== undefined) updateData.name = body.name;
		if (body.phone !== undefined) updateData.phone = body.phone;
		if (body.email !== undefined) updateData.email = body.email;
		if (body.address !== undefined) updateData.address = body.address;
		if (body.company !== undefined) updateData.company = body.company;

		const updatedCustomer = updateCustomer(parseInt(body.id), updateData);

		if (!updatedCustomer) {
			return NextResponse.json(
				{
					success: false,
					message: "更新客户失败，可能是手机号或邮箱已被使用或客户不存在",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			customer: updatedCustomer,
		});
	} catch (error) {
		console.error("更新客户失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 删除客户
export async function DELETE(request: NextRequest) {
	try {
		// 从 URL 参数获取 ID
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ success: false, message: "客户ID必填" },
				{ status: 400 },
			);
		}

		const success = deleteCustomer(parseInt(id));

		if (!success) {
			return NextResponse.json(
				{ success: false, message: "删除客户失败，客户可能不存在" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("删除客户失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
