import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    // 获取cookie存储
    const cookieStore = await cookies();

    // 清除auth-storage cookie（httpOnly）
    cookieStore.delete('auth-storage');

    // 同时清除客户端同步用的cookie
    cookieStore.delete('auth-storage-client');

    // 返回成功响应
    return NextResponse.json({
        success: true,
        message: '已成功登出'
    });
} 