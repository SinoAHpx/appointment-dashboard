import { NextResponse } from 'next/server'
import { findUserByUsernameWithPassword } from '@/lib/user.queries'

// 登录API路由
export async function POST(request: Request) {
    try {
        // 解析请求体
        const body = await request.json()
        const { username, password } = body

        // 验证请求
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: '用户名和密码必填' },
                { status: 400 }
            )
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
                { success: false, message: '用户名或密码错误' },
                { status: 401 }
            )
        }

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('登录过程发生错误:', error)
        return NextResponse.json(
            { success: false, message: '服务器错误' },
            { status: 500 }
        )
    }
} 