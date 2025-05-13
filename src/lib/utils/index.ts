/**
 * 格式化日期时间为本地字符串
 * @param dateTimeStr ISO 格式的日期时间字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDate(dateTimeStr: string): string {
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateTimeStr;
    }
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}