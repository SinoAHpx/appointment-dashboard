"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    ComposedChart
} from "recharts";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Appointment } from "@/lib/stores/appointments";
import { useMemo } from "react";

interface DashboardChartsProps {
    appointments: Appointment[];
}

// 预约状态颜色映射
const STATUS_COLORS = {
    pending: "#f59e0b", // 黄色 - 待确认
    confirmed: "#3b82f6", // 蓝色 - 已确认
    in_progress: "#8b5cf6", // 紫色 - 进行中
    completed: "#10b981", // 绿色 - 已完成
    cancelled: "#ef4444", // 红色 - 已取消
};

const STATUS_LABELS = {
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "进行中",
    completed: "已完成",
    cancelled: "已取消",
};

export function DashboardCharts({ appointments }: DashboardChartsProps) {
    // 如果没有预约数据，显示空状态
    if (!appointments || appointments.length === 0) {
        return (
            <div className="grid gap-6">
                <Card>
                    <CardContent className="flex items-center justify-center h-[200px]">
                        <p className="text-muted-foreground">暂无预约数据，请先添加一些预约记录</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    // 处理日期范围数据 - 最近30天
    const dateRangeData = useMemo(() => {
        const endDate = new Date();
        const startDate = subDays(endDate, 29); // 最近30天
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

        return dateRange.map(date => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayAppointments = appointments.filter(appointment =>
                appointment.dateTime &&
                appointment.dateTime.startsWith(dateStr)
            );

            return {
                date: dateStr,
                dateDisplay: format(date, "MM-dd", { locale: zhCN }),
                total: dayAppointments.length,
                pending: dayAppointments.filter(a => a.status === "pending").length,
                confirmed: dayAppointments.filter(a => a.status === "confirmed").length,
                completed: dayAppointments.filter(a => a.status === "completed").length,
                cancelled: dayAppointments.filter(a => a.status === "cancelled").length,
            };
        });
    }, [appointments]);

    // 状态分布数据
    const statusDistribution = useMemo(() => {
        const statusCounts = appointments.reduce((acc, appointment) => {
            acc[appointment.status] = (acc[appointment.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            statusLabel: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
            count,
            percentage: appointments.length > 0 ? ((count / appointments.length) * 100).toFixed(1) : "0",
        }));
    }, [appointments]);

    // 月度趋势数据
    const monthlyTrend = useMemo(() => {
        const monthlyData = appointments.reduce((acc, appointment) => {
            if (!appointment.dateTime) return acc;

            const month = format(parseISO(appointment.dateTime), "yyyy-MM");
            if (!acc[month]) {
                acc[month] = { total: 0, completed: 0 };
            }
            acc[month].total += 1;
            if (appointment.status === "completed") {
                acc[month].completed += 1;
            }
            return acc;
        }, {} as Record<string, { total: number; completed: number }>);

        return Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // 最近6个月
            .map(([month, data]) => ({
                month,
                monthDisplay: format(parseISO(`${month}-01`), "yyyy年MM月", { locale: zhCN }),
                total: data.total,
                completed: data.completed,
                completionRate: data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : "0",
            }));
    }, [appointments]);

    // 服务类型分布
    const serviceTypeDistribution = useMemo(() => {
        const serviceTypeCounts = appointments.reduce((acc, appointment) => {
            const serviceType = appointment.documentType || "未指定";
            acc[serviceType] = (acc[serviceType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(serviceTypeCounts)
            .map(([serviceType, count]) => ({
                serviceType,
                count,
                percentage: appointments.length > 0 ? ((count / appointments.length) * 100).toFixed(1) : "0",
            }))
            .sort((a, b) => b.count - a.count);
    }, [appointments]);

    return (
        <div className="grid gap-6">
            {/* 第一行：状态分布饼图和月度趋势线图 */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>预约状态分布</CardTitle>
                        <CardDescription>当前所有预约的状态分布情况</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ statusLabel, percentage }) => `${statusLabel} ${percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || "#8884d8"}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name) => [value, "预约数量"]}
                                    labelFormatter={(label) => `状态: ${label}`}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>月度预约趋势</CardTitle>
                        <CardDescription>最近6个月预约总数和完成率趋势</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monthDisplay" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === "completionRate") return [`${value}%`, "完成率"];
                                        return [value, name === "total" ? "总预约数" : "完成数"];
                                    }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="total" fill="#3b82f6" name="总预约数" />
                                <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="完成数" />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="completionRate"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    name="完成率(%)"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 第二行：日期趋势面积图 */}
            <Card>
                <CardHeader>
                    <CardTitle>最近30天预约趋势</CardTitle>
                    <CardDescription>每日预约数量变化和状态分布</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={dateRangeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="dateDisplay"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(label) => `日期: ${label}`}
                                formatter={(value: number, name: string) => [
                                    value,
                                    STATUS_LABELS[name as keyof typeof STATUS_LABELS] || name
                                ]}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                stackId="1"
                                stroke={STATUS_COLORS.completed}
                                fill={STATUS_COLORS.completed}
                                name="已完成"
                            />
                            <Area
                                type="monotone"
                                dataKey="confirmed"
                                stackId="1"
                                stroke={STATUS_COLORS.confirmed}
                                fill={STATUS_COLORS.confirmed}
                                name="已确认"
                            />
                            <Area
                                type="monotone"
                                dataKey="pending"
                                stackId="1"
                                stroke={STATUS_COLORS.pending}
                                fill={STATUS_COLORS.pending}
                                name="待确认"
                            />
                            <Area
                                type="monotone"
                                dataKey="cancelled"
                                stackId="1"
                                stroke={STATUS_COLORS.cancelled}
                                fill={STATUS_COLORS.cancelled}
                                name="已取消"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
} 