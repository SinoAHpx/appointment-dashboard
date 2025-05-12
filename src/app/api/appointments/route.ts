import {
	type Appointment,
	type AppointmentHistory,
	type NewAppointmentData,
	type UpdateAppointmentData,
	addAppointment,
	deleteAppointment,
	getAllAppointments,
	getAppointmentHistory,
	updateAppointment,
} from "@/lib/db/appointment.queries";
import { verifyAdmin, verifyAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// 获取所有预约
export async function GET(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		// 管理员可以获取所有预约
		// 普通用户只能获取自己创建的预约
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		const includeHistory = url.searchParams.get("includeHistory") === "true";

		let appointments = getAllAppointments();

		// 如果不是管理员，只返回该用户创建的预约
		if (!auth.isAdmin) {
			appointments = appointments.filter(
				app => app.createdBy === auth.userId
			);
		}

		// 如果指定了ID，获取特定预约
		if (id) {
			const filteredAppointments = appointments.filter(
				(app) => app.id === parseInt(id)
			);

			if (filteredAppointments.length === 0) {
				return NextResponse.json(
					{ success: false, message: "找不到指定的预约记录或无权访问该记录" },
					{ status: 404 }
				);
			}

			const appointment = filteredAppointments[0];
			let history: AppointmentHistory[] = [];

			// 只有管理员可以查看历史记录
			if (includeHistory && auth.isAdmin) {
				history = getAppointmentHistory(parseInt(id));
			}

			// Parse assignedStaffJson to assignedStaff array if available
			let assignedStaff: string[] = [];
			if (appointment.assignedStaffJson) {
				try {
					assignedStaff = JSON.parse(appointment.assignedStaffJson);
				} catch (e) {
					console.error("Error parsing assignedStaffJson", e);
				}
			} else if (appointment.staffId) {
				// Legacy: If no JSON array but there is a staffId, use it as a single element array
				assignedStaff = [appointment.staffId.toString()];
			}

			// Add assignedStaff and assignedVehicle fields to the response
			const responseAppointment = {
				...appointment,
				assignedStaff,
				assignedVehicle: appointment.vehicleId ? appointment.vehicleId.toString() : null
			};

			return NextResponse.json({
				success: true,
				appointment: responseAppointment,
				history: includeHistory && auth.isAdmin ? history : undefined
			});
		}

		// Transform appointments for the frontend
		const transformedAppointments = appointments.map(app => {
			// Parse assignedStaffJson to assignedStaff array if available
			let assignedStaff: string[] = [];
			if (app.assignedStaffJson) {
				try {
					assignedStaff = JSON.parse(app.assignedStaffJson);
				} catch (e) {
					console.error("Error parsing assignedStaffJson", e);
				}
			} else if (app.staffId) {
				// Legacy: If no JSON array but there is a staffId, use it as a single element array
				assignedStaff = [app.staffId.toString()];
			}

			return {
				...app,
				assignedStaff,
				assignedVehicle: app.vehicleId ? app.vehicleId.toString() : null
			};
		});

		// 返回所有可访问的预约
		return NextResponse.json({ success: true, appointments: transformedAppointments });
	} catch (error) {
		console.error("获取预约列表失败:", error);
		return NextResponse.json(
			{ success: false, message: "获取预约列表失败" },
			{ status: 500 },
		);
	}
}

// 创建新预约
export async function POST(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const body = await request.json();

		// 验证必要字段
		if (!body.customerName) {
			return NextResponse.json(
				{ success: false, message: "客户姓名必填" },
				{ status: 400 },
			);
		}

		if (!body.appointmentTime) {
			return NextResponse.json(
				{ success: false, message: "预约时间必填" },
				{ status: 400 },
			);
		}

		// 准备预约数据
		const appointmentData: NewAppointmentData = {
			customerName: body.customerName,
			appointmentTime: body.appointmentTime,
			serviceType: body.serviceType || null,
			documentTypesJson: body.documentTypesJson || null,
			staffId: body.staffId ? parseInt(body.staffId) : null,
			vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
			status: ["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(
				body.status,
			)
				? (body.status as Appointment["status"])
				: "pending",
			estimatedCompletionTime: body.estimatedCompletionTime || null,
			processingNotes: body.processingNotes || null,
			contactPhone: body.contactPhone || null,
			contactAddress: body.contactAddress || null,
			notes: body.notes || null,
			documentCount: body.documentCount || 1,
			updatedBy: auth.userId,
			createdBy: auth.userId, // 记录创建者ID
		};

		// Handle assignedStaff array
		if (body.assignedStaff) {
			// Store as JSON string
			appointmentData.assignedStaffJson = Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0
				? JSON.stringify(body.assignedStaff)
				: null;

			// Use first staff as primary for backward compatibility
			if (Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0) {
				appointmentData.staffId = parseInt(body.assignedStaff[0]);
			}
		}

		// Handle assignedVehicle
		if (body.assignedVehicle) {
			appointmentData.vehicleId = parseInt(body.assignedVehicle);
		}

		const newAppointment = addAppointment(appointmentData);

		if (!newAppointment) {
			return NextResponse.json(
				{ success: false, message: "创建预约失败" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			appointment: newAppointment,
		});
	} catch (error) {
		console.error("创建预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 更新预约
export async function PUT(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		// 获取预约详情以验证权限
		const appointments = getAllAppointments();
		const appointment = appointments.find(app => app.id === parseInt(body.id));

		if (!appointment) {
			return NextResponse.json(
				{ success: false, message: "预约不存在" },
				{ status: 404 }
			);
		}

		// 验证访问权限
		if (!auth.isAdmin && appointment.createdBy !== auth.userId) {
			return NextResponse.json(
				{ success: false, message: "无权操作此预约" },
				{ status: 403 }
			);
		}

		const updateData: UpdateAppointmentData = {};

		// 只包含要更新的字段
		if (body.customerName !== undefined)
			updateData.customerName = body.customerName;
		if (body.appointmentTime !== undefined)
			updateData.appointmentTime = body.appointmentTime;
		if (body.serviceType !== undefined)
			updateData.serviceType = body.serviceType;
		if (body.documentTypesJson !== undefined)
			updateData.documentTypesJson = body.documentTypesJson;
		if (body.estimatedCompletionTime !== undefined)
			updateData.estimatedCompletionTime = body.estimatedCompletionTime;
		if (body.processingNotes !== undefined)
			updateData.processingNotes = body.processingNotes;
		if (body.contactPhone !== undefined)
			updateData.contactPhone = body.contactPhone;
		if (body.contactAddress !== undefined)
			updateData.contactAddress = body.contactAddress;
		if (body.notes !== undefined)
			updateData.notes = body.notes;
		if (body.documentCount !== undefined)
			updateData.documentCount = body.documentCount;

		// 处理staff和vehicle ID - 只有管理员可以分配
		if (auth.isAdmin) {
			// Handle single staffId (legacy) or assignedStaff array (new format)
			if (body.staffId !== undefined) {
				updateData.staffId = body.staffId ? parseInt(body.staffId) : null;
			}

			// Handle assignedStaff array from frontend
			if (body.assignedStaff !== undefined) {
				// For now, we still use staffId in the database for the primary staff
				// If there's at least one staff assigned, use the first one as primary
				if (Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0) {
					updateData.staffId = parseInt(body.assignedStaff[0]);
				} else {
					updateData.staffId = null;
				}

				// Store the full staff array as JSON in a separate field for future use
				updateData.assignedStaffJson = Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0
					? JSON.stringify(body.assignedStaff)
					: null;
			}

			if (body.vehicleId !== undefined) {
				updateData.vehicleId = body.vehicleId ? parseInt(body.vehicleId) : null;
			}

			// Handle assignedVehicle from frontend
			if (body.assignedVehicle !== undefined) {
				updateData.vehicleId = body.assignedVehicle ? parseInt(body.assignedVehicle) : null;
			}
		}

		// 处理最后更新用户信息
		updateData.lastUpdatedBy = auth.userId;

		// 验证状态值有效性
		if (body.status !== undefined) {
			if (
				!["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(
					body.status,
				)
			) {
				return NextResponse.json(
					{ success: false, message: "无效的状态值" },
					{ status: 400 },
				);
			}

			// 状态相关权限控制：只有管理员可以将状态设置为in_progress
			if (body.status === "in_progress" && !auth.isAdmin) {
				return NextResponse.json(
					{ success: false, message: "只有管理员可以将预约设置为处理中状态" },
					{ status: 403 }
				);
			}

			updateData.status = body.status as Appointment["status"];
		}

		const updatedAppointment = updateAppointment(parseInt(body.id), updateData);

		if (!updatedAppointment) {
			return NextResponse.json(
				{ success: false, message: "更新预约失败，预约可能不存在" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			appointment: updatedAppointment,
		});
	} catch (error) {
		console.error("更新预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 更新预约状态
export async function PATCH(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		// 获取预约详情以验证权限
		const appointments = getAllAppointments();
		const appointment = appointments.find(app => app.id === parseInt(body.id));

		if (!appointment) {
			return NextResponse.json(
				{ success: false, message: "预约不存在" },
				{ status: 404 }
			);
		}

		// 验证操作权限 - 普通用户只能操作自己的预约
		if (!auth.isAdmin && appointment.createdBy !== auth.userId) {
			return NextResponse.json(
				{ success: false, message: "无权操作此预约" },
				{ status: 403 }
			);
		}

		// 普通用户只能取消预约，不能更改为其他状态
		if (!auth.isAdmin && body.status && body.status !== "cancelled") {
			return NextResponse.json(
				{ success: false, message: "普通用户只能取消预约" },
				{ status: 403 }
			);
		}

		// 管理员可以请求历史记录
		if (auth.isAdmin && body.requestHistory) {
			const history = getAppointmentHistory(parseInt(body.id));
			return NextResponse.json({
				success: true,
				history,
			});
		}

		// 更新预约状态
		const updateData: UpdateAppointmentData = {
			status: body.status as Appointment["status"],
			lastUpdatedBy: auth.userId
		};

		const updatedAppointment = updateAppointment(parseInt(body.id), updateData);

		if (!updatedAppointment) {
			return NextResponse.json(
				{ success: false, message: "更新预约状态失败" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			appointment: updatedAppointment,
		});
	} catch (error) {
		console.error("更新预约状态失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 删除预约
export async function DELETE(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		// 从 URL 参数获取 ID
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		// 获取预约详情以验证权限
		const appointments = getAllAppointments();
		const appointment = appointments.find(app => app.id === parseInt(id));

		if (!appointment) {
			return NextResponse.json(
				{ success: false, message: "预约不存在" },
				{ status: 404 }
			);
		}

		// 验证删除权限 - 只有管理员或创建者可以删除
		if (!auth.isAdmin && appointment.createdBy !== auth.userId) {
			return NextResponse.json(
				{ success: false, message: "无权删除此预约" },
				{ status: 403 }
			);
		}

		const success = deleteAppointment(parseInt(id));

		if (!success) {
			return NextResponse.json(
				{ success: false, message: "删除预约失败，预约可能不存在" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("删除预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
