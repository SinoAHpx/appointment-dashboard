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

			// Parse documentTypesJson to documentTypes object if available
			let documentTypes = null;
			if (appointment.documentTypesJson) {
				try {
					documentTypes = JSON.parse(appointment.documentTypesJson);
				} catch (e) {
					console.error("Error parsing documentTypesJson", e);
				}
			}

			// Parse documentCountsJson to documentCounts object if available
			let documentCounts = null;
			if (appointment.documentCountsJson) {
				try {
					documentCounts = JSON.parse(appointment.documentCountsJson);
				} catch (e) {
					console.error("Error parsing documentCountsJson", e);
				}
			}

			// Add assignedStaff and assignedVehicle fields to the response
			const responseAppointment = {
				...appointment,
				documentTypes,
				documentCounts,
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

			// Parse documentTypesJson to documentTypes object if available
			let documentTypes = null;
			if (app.documentTypesJson) {
				try {
					documentTypes = JSON.parse(app.documentTypesJson);
				} catch (e) {
					console.error("Error parsing documentTypesJson", e);
				}
			}

			// Parse documentCountsJson to documentCounts object if available
			let documentCounts = null;
			if (app.documentCountsJson) {
				try {
					documentCounts = JSON.parse(app.documentCountsJson);
				} catch (e) {
					console.error("Error parsing documentCountsJson", e);
				}
			}

			return {
				...app,
				documentTypes,
				documentCounts,
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
			documentCategory: body.documentCategory || null,
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
			documentTypesJson: null, // 默认为null
			documentCountsJson: null, // 默认为null
		};

		// 处理文件类型多选结构
		if (body.documentTypes && typeof body.documentTypes === 'object') {
			appointmentData.documentTypesJson = JSON.stringify(body.documentTypes);
		}

		// 处理文件数量多选结构
		if (body.documentCounts && typeof body.documentCounts === 'object') {
			appointmentData.documentCountsJson = JSON.stringify(body.documentCounts);
		}

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

		// 准备响应数据并包含文件类型结构
		let documentTypes = null;
		if (newAppointment.documentTypesJson) {
			try {
				documentTypes = JSON.parse(newAppointment.documentTypesJson);
			} catch (e) {
				console.error("Error parsing documentTypesJson", e);
			}
		}

		// 准备响应数据并包含文件数量结构
		let documentCounts = null;
		if (newAppointment.documentCountsJson) {
			try {
				documentCounts = JSON.parse(newAppointment.documentCountsJson);
			} catch (e) {
				console.error("Error parsing documentCountsJson", e);
			}
		}

		// Parse assignedStaffJson to assignedStaff array if available
		let assignedStaff: string[] = [];
		if (newAppointment.assignedStaffJson) {
			try {
				assignedStaff = JSON.parse(newAppointment.assignedStaffJson);
			} catch (e) {
				console.error("Error parsing assignedStaffJson", e);
			}
		} else if (newAppointment.staffId) {
			// Legacy: If no JSON array but there is a staffId, use it as a single element array
			assignedStaff = [newAppointment.staffId.toString()];
		}

		const responseAppointment = {
			...newAppointment,
			documentTypes,
			documentCounts,
			assignedStaff,
			assignedVehicle: newAppointment.vehicleId ? newAppointment.vehicleId.toString() : null
		};

		return NextResponse.json({
			success: true,
			appointment: responseAppointment,
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

		// 准备更新数据
		const updateData: UpdateAppointmentData = {
			customerName: body.customerName !== undefined ? body.customerName : undefined,
			appointmentTime: body.appointmentTime !== undefined ? body.appointmentTime : undefined,
			serviceType: body.serviceType !== undefined ? body.serviceType : undefined,
			documentCategory: body.documentCategory !== undefined ? body.documentCategory : undefined,
			staffId: body.staffId !== undefined ? parseInt(body.staffId) : undefined,
			vehicleId: body.vehicleId !== undefined ? parseInt(body.vehicleId) : undefined,
			status: ["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(body.status)
				? (body.status as Appointment["status"])
				: undefined,
			estimatedCompletionTime:
				body.estimatedCompletionTime !== undefined ? body.estimatedCompletionTime : undefined,
			processingNotes: body.processingNotes !== undefined ? body.processingNotes : undefined,
			contactPhone: body.contactPhone !== undefined ? body.contactPhone : undefined,
			contactAddress: body.contactAddress !== undefined ? body.contactAddress : undefined,
			notes: body.notes !== undefined ? body.notes : undefined,
			documentCount: body.documentCount !== undefined ? body.documentCount : undefined,
			lastUpdatedBy: auth.userId,
			lastUpdatedAt: new Date().toISOString(),
		};

		// 处理文件类型多选结构
		if (body.documentTypes !== undefined) {
			updateData.documentTypesJson = typeof body.documentTypes === 'object'
				? JSON.stringify(body.documentTypes)
				: null;
		}

		// 处理文件数量多选结构
		if (body.documentCounts !== undefined) {
			updateData.documentCountsJson = typeof body.documentCounts === 'object'
				? JSON.stringify(body.documentCounts)
				: null;
		}

		// Handle assignedStaff array
		if (body.assignedStaff !== undefined) {
			// Store as JSON string
			updateData.assignedStaffJson = Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0
				? JSON.stringify(body.assignedStaff)
				: null;

			// Use first staff as primary for backward compatibility
			if (Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0) {
				updateData.staffId = parseInt(body.assignedStaff[0]);
			} else {
				updateData.staffId = null;
			}
		}

		const updated = updateAppointment(parseInt(body.id), updateData);

		if (!updated) {
			return NextResponse.json(
				{ success: false, message: "更新预约失败" },
				{ status: 400 }
			);
		}

		// 准备响应数据并包含文件类型结构
		let documentTypes = null;
		if (updated.documentTypesJson) {
			try {
				documentTypes = JSON.parse(updated.documentTypesJson);
			} catch (e) {
				console.error("Error parsing documentTypesJson", e);
			}
		}

		// 准备响应数据并包含文件数量结构
		let documentCounts = null;
		if (updated.documentCountsJson) {
			try {
				documentCounts = JSON.parse(updated.documentCountsJson);
			} catch (e) {
				console.error("Error parsing documentCountsJson", e);
			}
		}

		// Parse assignedStaffJson to assignedStaff array if available
		let assignedStaff: string[] = [];
		if (updated.assignedStaffJson) {
			try {
				assignedStaff = JSON.parse(updated.assignedStaffJson);
			} catch (e) {
				console.error("Error parsing assignedStaffJson", e);
			}
		} else if (updated.staffId) {
			// Legacy: If no JSON array but there is a staffId, use it as a single element array
			assignedStaff = [updated.staffId.toString()];
		}

		const responseAppointment = {
			...updated,
			documentTypes,
			documentCounts,
			assignedStaff,
			assignedVehicle: updated.vehicleId ? updated.vehicleId.toString() : null
		};

		return NextResponse.json({
			success: true,
			appointment: responseAppointment,
		});
	} catch (error) {
		console.error("更新预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 获取预约历史记录
export async function PATCH(request: NextRequest) {
	try {
		// 验证管理员权限
		const isAdmin = await verifyAdmin(request);
		if (!isAdmin) {
			return NextResponse.json(
				{ success: false, message: "只有管理员可以访问历史记录" },
				{ status: 403 }
			);
		}

		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		const history = getAppointmentHistory(parseInt(body.id));

		return NextResponse.json({
			success: true,
			history,
		});
	} catch (error) {
		console.error("获取预约历史记录失败:", error);
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
