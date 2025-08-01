import { findUserByUsernameWithPassword } from "@/lib/db/user.queries";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCaptcha } from "@/lib/utils";

// 登录API路由
export async function POST(request: Request) {
	try {
		// 解析请求体
		const body = await request.json();
		const { username, password, captcha } = body;

		// 验证请求
		if (!username || !password) {
			return NextResponse.json(
				{ success: false, message: "用户名和密码必填" },
				{ status: 400 },
			);
		}

		// 获取存储的验证码
		const cookieStore = await cookies();
		const storedCaptcha = cookieStore.get('captcha-text')?.value;

		// 添加调试日志（仅在开发环境）
		const isProduction = process.env.NODE_ENV === 'production';
		if (!isProduction) {
			console.log('验证码验证:', {
				输入的验证码: captcha,
				存储的验证码: storedCaptcha,
				所有cookies: Object.fromEntries(cookieStore.getAll().map(cookie => [cookie.name, cookie.value]))
			});
		}

		// 使用验证码验证函数
		const captchaResult = verifyCaptcha(captcha, storedCaptcha);
		if (!captchaResult.success) {
			// 在开发环境下提供更详细的错误信息
			const message = isProduction
				? captchaResult.message
				: `${captchaResult.message} (输入: ${captcha}, 预期: ${storedCaptcha})`;

			return NextResponse.json(
				{ success: false, message },
				{ status: 400 },
			);
		}

		// 从数据库查找用户
		const user = findUserByUsernameWithPassword(username);

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

		// 确保返回的用户对象包含必要的字段
		// 处理旧用户记录可能没有 name 和 email 字段的情况
		const finalUser = {
			...userWithoutPassword,
			// 将数字ID转换为字符串以满足前端User接口的要求
			id: userWithoutPassword.id.toString(),
			name: userWithoutPassword.name || username
		};

		// 设置cookie，跟zustand的persist中间件保持一致
		const authState = {
			state: {
				user: finalUser,
				isAuthenticated: true
			},
			version: 0
		};

		// 创建响应对象
		const response = NextResponse.json({
			success: true,
			user: finalUser,
		});

		// 验证码验证成功后，清除验证码cookie
		response.cookies.set('captcha-text', '', {
			maxAge: 0,
			path: '/',
			// 确保清除cookie时使用相同的属性
			httpOnly: true,
			sameSite: 'lax',
			secure: isProduction && (request.url.startsWith('https://') || process.env.VERCEL === '1')
		});

		// 设置有7天过期时间的cookie
		// 1. 设置httpOnly cookie用于服务端验证
		response.cookies.set({
			name: "auth-storage",
			value: JSON.stringify(authState),
			httpOnly: true,
			//secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7, // 7天
			path: "/"
		});

		// 2. 设置非httpOnly cookie用于客户端同步（确保与localStorage保持同步）
		response.cookies.set({
			name: "auth-storage-client",
			value: JSON.stringify(authState),
			httpOnly: false,
			//secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7, // 7天
			path: "/"
		});

		return response;
	} catch (error) {
		console.error("登录过程发生错误:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
