import { findUserByUsernameWithPassword } from "@/lib/user.queries";
import { NextResponse } from "next/server";

// 登录API路由
export async function POST(request: Request) {
	try {
		// 解析请求体
		const body = await request.json();
		const { username, password } = body;

		// 验证请求
		if (!username || !password) {
			return NextResponse.json(
				{ success: false, message: "用户名和密码必填" },
				{ status: 400 },
			);
		}

		// 从数据库查找用户
		const user = findUserByUsernameWithPassword(username);

		// 添加调试日志
		console.log("查询到的用户:", user);

		// 验证用户是否存在以及密码是否匹配
		// !! IMPORTANT: Replace plain text password comparison with hash verification in production !!
		// Example using Bun.password.verify (assuming stored hash):
		// const isPasswordValid = user ? await Bun.password.verify(password, user.password) : false;
		const isPasswordValid = user ? user.password === password : false;

		// 如果未找到用户或密码不匹配
		if (!user || !isPasswordValid) {
			return NextResponse.json(
				{ success: false, message: "用户名或密码错误" },
				{ status: 401 },
			);
		}

		// 返回用户信息（不包含密码）
		const { password: _, ...userWithoutPassword } = user;

		console.log("登录成功，用户信息:", userWithoutPassword);

		// 确保返回的用户对象包含必要的字段
		// 处理旧用户记录可能没有 name 和 email 字段的情况
		const finalUser = {
			...userWithoutPassword,
			// 将数字ID转换为字符串以满足前端User接口的要求
			id: userWithoutPassword.id.toString(),
			name: userWithoutPassword.name || username,
			email: userWithoutPassword.email || null
		};

		console.log("最终返回用户信息:", finalUser);

		return NextResponse.json({
			success: true,
			user: finalUser,
		});
	} catch (error) {
		console.error("登录过程发生错误:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
