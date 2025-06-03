"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface CaptchaProps {
    onChange?: (isValid: boolean) => void;
    onCaptchaLoad?: (captchaSrc: string) => void;
}

export function Captcha({ onChange, onCaptchaLoad }: CaptchaProps) {
    const [captchaSrc, setCaptchaSrc] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // 刷新验证码
    const refreshCaptcha = useCallback(async () => {
        setIsLoading(true);
        try {
            const timestamp = Date.now();
            const newSrc = `/api/captcha?t=${timestamp}`;
            setCaptchaSrc(newSrc);
            onCaptchaLoad?.(newSrc);
        } catch (error) {
            console.error('刷新验证码失败:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onCaptchaLoad]);

    // 组件挂载时加载验证码
    useEffect(() => {
        refreshCaptcha();
    }, [refreshCaptcha]);

    return (
        <div
            className="relative h-[40px] w-[120px] cursor-pointer"
            onClick={refreshCaptcha}
            data-refresh-captcha
            title="点击刷新验证码"
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
                </div>
            )}
            {captchaSrc ? (
                <img
                    src={captchaSrc}
                    alt="验证码"
                    className="w-full h-full object-contain pointer-events-none rounded"
                    style={{ filter: 'contrast(1.2)' }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm rounded">
                    加载中...
                </div>
            )}
        </div>
    );
} 