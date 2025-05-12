import React from "react";
import { Droplets, Zap } from "lucide-react";

/**
 * 获取车辆类型图标
 */
export function getVehicleTypeIcon(type: "electric" | "fuel") {
    return type === "electric" ? (
        <Zap size={14} className="text-blue-500" />
    ) : (
        <Droplets size={14} className="text-green-500" />
    );
}

/**
 * 获取车辆类型标签
 */
export function getVehicleTypeLabel(type: "electric" | "fuel") {
    return type === "electric" ? "电车" : "油车";
}

/**
 * 格式化日期
 */
export function formatDate(dateString?: string) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
} 