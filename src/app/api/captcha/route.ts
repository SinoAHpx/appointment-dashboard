import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { generateCaptchaText } from "@/lib/utils";

// 生成随机颜色
function getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F39C12', '#9B59B6', '#E74C3C', '#2ECC71'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 生成验证码API
export async function GET(request: NextRequest) {
    try {
        // 创建画布
        const width = 120;
        const height = 40;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 设置背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);

        // 生成验证码文本
        const captchaText = generateCaptchaText(4);

        // 绘制验证码字符
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const charWidth = width / 4;
        for (let i = 0; i < captchaText.length; i++) {
            ctx.fillStyle = getRandomColor();

            // 添加字符旋转和位置偏移
            ctx.save();
            ctx.translate((i + 0.5) * charWidth, height / 2);
            ctx.rotate((Math.random() - 0.5) * 0.4); // -0.2 到 0.2 弧度的旋转
            ctx.fillText(captchaText[i], 0, Math.random() * 6 - 3); // 垂直位置微调
            ctx.restore();
        }

        // 添加干扰线
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = getRandomColor();
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }

        // 添加干扰点
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = getRandomColor();
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI);
            ctx.fill();
        }

        // 转换为PNG buffer
        const buffer = canvas.toBuffer('image/png');

        // 创建响应对象
        const response = new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        // 设置验证码cookie，有效期5分钟
        // 修复production环境下的cookie配置问题
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            maxAge: 300, // 5分钟
            httpOnly: true,
            // 只有在HTTPS环境下才启用secure
            secure: isProduction && (request.url.startsWith('https://') || process.env.VERCEL === '1'),
            // 使用lax而不是strict，避免在某些情况下cookie无法传输
            sameSite: 'lax' as const,
            path: '/'
        };

        response.cookies.set('captcha-text', captchaText, cookieOptions);

        // 添加调试日志（仅在开发环境）
        if (!isProduction) {
            console.log('验证码生成:', {
                text: captchaText,
                cookieOptions,
                url: request.url
            });
        }

        return response;
    } catch (error) {
        console.error('生成验证码失败:', error);
        return NextResponse.json(
            { success: false, message: '生成验证码失败', error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 