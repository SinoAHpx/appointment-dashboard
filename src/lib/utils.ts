import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * 验证码验证函数
 * @param inputCaptcha 用户输入的验证码
 * @param storedCaptcha 存储的验证码
 * @returns 验证结果对象
 */
export function verifyCaptcha(inputCaptcha: string, storedCaptcha: string | undefined) {
	// 检查验证码是否存在
	if (!storedCaptcha) {
		return {
			success: false,
			message: "验证码已过期，请刷新验证码"
		};
	}

	// 检查用户是否输入了验证码
	if (!inputCaptcha || inputCaptcha.trim().length === 0) {
		return {
			success: false,
			message: "请输入验证码"
		};
	}

	// 验证码长度检查
	if (inputCaptcha.trim().length !== 4) {
		return {
			success: false,
			message: "验证码必须是4位"
		};
	}

	// 不区分大小写比较
	const normalizedInput = inputCaptcha.trim().toUpperCase();
	const normalizedStored = storedCaptcha.trim().toUpperCase();

	if (normalizedInput !== normalizedStored) {
		return {
			success: false,
			message: "验证码错误"
		};
	}

	return {
		success: true,
		message: "验证码正确"
	};
}

/**
 * 生成验证码文本
 * @param length 验证码长度，默认4位
 * @returns 验证码字符串
 */
export function generateCaptchaText(length: number = 4): string {
	const chars = '1234567890ABCDEFGHJKLMNPQRSTUVWXYZ';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
