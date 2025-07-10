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

/**
 * 智能分页逻辑 - 限制显示的页码数量，避免布局变形
 * @param currentPage 当前页码
 * @param totalPages 总页数
 * @param maxVisible 最大可见页码数量，默认为7
 * @returns 包含页码信息的数组，每个元素包含页码和是否为省略号
 */
export function getSmartPaginationPages(
	currentPage: number,
	totalPages: number,
	maxVisible: number = 7
): Array<{ type: 'page' | 'ellipsis'; value: number; key: string }> {
	if (totalPages <= maxVisible) {
		// 如果总页数小于等于最大可见数，显示所有页码
		return Array.from({ length: totalPages }, (_, i) => ({
			type: 'page' as const,
			value: i + 1,
			key: `page-${i + 1}`,
		}));
	}

	const pages: Array<{ type: 'page' | 'ellipsis'; value: number; key: string }> = [];
	const halfVisible = Math.floor(maxVisible / 2);

	// 始终显示第一页
	pages.push({ type: 'page', value: 1, key: 'page-1' });

	let startPage: number;
	let endPage: number;

	if (currentPage <= halfVisible + 1) {
		// 当前页在前半部分
		startPage = 2;
		endPage = Math.min(maxVisible - 1, totalPages - 1);
	} else if (currentPage >= totalPages - halfVisible) {
		// 当前页在后半部分
		startPage = Math.max(totalPages - maxVisible + 2, 2);
		endPage = totalPages - 1;
	} else {
		// 当前页在中间部分
		startPage = currentPage - halfVisible + 1;
		endPage = currentPage + halfVisible - 1;
	}

	// 如果开始页不是2，添加省略号
	if (startPage > 2) {
		pages.push({ type: 'ellipsis', value: -1, key: 'ellipsis-start' });
	}

	// 添加中间页码
	for (let i = startPage; i <= endPage; i++) {
		pages.push({ type: 'page', value: i, key: `page-${i}` });
	}

	// 如果结束页不是倒数第二页，添加省略号
	if (endPage < totalPages - 1) {
		pages.push({ type: 'ellipsis', value: -1, key: 'ellipsis-end' });
	}

	// 始终显示最后一页（如果不是第一页）
	if (totalPages > 1) {
		pages.push({ type: 'page', value: totalPages, key: `page-${totalPages}` });
	}

	return pages;
}
