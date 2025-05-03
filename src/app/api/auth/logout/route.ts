import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    // 获取cookie存储
    const cookieStore = cookies();

    // 清除auth-storage cookie
    cookieStore.delete('auth-storage');

    // 返回成功响应
    return NextResponse.json({
        success: true,
        message: '已成功登出'
    });
} 