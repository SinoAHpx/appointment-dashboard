"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Package, TrendingUp, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores";

// 类型定义
interface WasteBid {
    id: number;
    auctionId: number;
    bidderId: number;
    bidAmount: number;
    bidTime: string;
    notes?: string;
    status: "active" | "outbid" | "winning" | "cancelled";
    auctionTitle?: string;
    batchTitle?: string;
    batchNumber?: string;
}

// 出价表格组件
function BidsTable({ bids }: { bids: WasteBid[] }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "default";
            case "winning": return "default";
            case "outbid": return "secondary";
            case "cancelled": return "destructive";
            default: return "secondary";
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            active: "有效",
            winning: "中标",
            outbid: "被超越",
            cancelled: "已取消",
        };
        return statusMap[status] || status;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active": return <TrendingUp size={16} />;
            case "winning": return <Trophy size={16} />;
            case "outbid": return <X size={16} />;
            case "cancelled": return <X size={16} />;
            default: return null;
        }
    };

    if (bids.length === 0) {
        return (
            <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无出价记录</h3>
                <p className="text-gray-500">您还没有在此分类下进行过出价</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>竞价项目</TableHead>
                        <TableHead>批次信息</TableHead>
                        <TableHead>出价金额</TableHead>
                        <TableHead>出价时间</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>备注</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bids.map((bid) => (
                        <TableRow key={bid.id}>
                            <TableCell>
                                <div>
                                    <div className="font-medium">{bid.auctionTitle}</div>
                                    <div className="text-sm text-gray-500">竞价ID: {bid.auctionId}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <div className="font-medium">{bid.batchTitle}</div>
                                    <div className="text-sm text-gray-500">{bid.batchNumber}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-bold text-lg">¥{bid.bidAmount}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="text-sm">
                                        {new Date(bid.bidTime).toLocaleString()}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={getStatusColor(bid.status)}
                                    className="flex items-center gap-1 w-fit"
                                >
                                    {getStatusIcon(bid.status)}
                                    {getStatusText(bid.status)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-gray-600">
                                    {bid.notes || "-"}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function MyBidsPage() {
    const { user } = useAuthStore();
    const [bids, setBids] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);

    // 获取用户的出价历史
    const fetchUserBids = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/waste-bids?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setBids(data.data || []);
            } else {
                toast.error("获取出价历史失败");
            }
        } catch (error) {
            console.error("获取出价历史失败:", error);
            toast.error("获取出价历史失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserBids();
    }, [user?.id]);

    // 过滤不同状态的出价
    const activeBids = bids.filter(bid => bid.status === "active");
    const winningBids = bids.filter(bid => bid.status === "winning");
    const outbidBids = bids.filter(bid => bid.status === "outbid");
    const allBids = bids;

    // 统计信息
    const totalBids = bids.length;
    const winningAmount = winningBids.reduce((sum, bid) => sum + bid.bidAmount, 0);

    if (loading) {
        return <div className="flex justify-center items-center h-96">加载中...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">我的出价</h1>
                    <p className="text-gray-600 mt-2">查看您的所有出价记录和状态</p>
                </div>
                <Button variant="outline" onClick={fetchUserBids}>
                    刷新数据
                </Button>
            </div>

            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Package className="h-6 w-6 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{totalBids}</p>
                                <p className="text-sm text-gray-600">总出价次数</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{activeBids.length}</p>
                                <p className="text-sm text-gray-600">有效出价</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Trophy className="h-6 w-6 text-yellow-600" />
                            <div>
                                <p className="text-2xl font-bold">{winningBids.length}</p>
                                <p className="text-sm text-gray-600">中标次数</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">¥</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">¥{winningAmount}</p>
                                <p className="text-sm text-gray-600">中标金额</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 出价详情 */}
            <Card>
                <CardHeader>
                    <CardTitle>出价详情</CardTitle>
                    <CardDescription>
                        查看您在各个竞价中的出价记录
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="all">全部 ({totalBids})</TabsTrigger>
                            <TabsTrigger value="active">有效 ({activeBids.length})</TabsTrigger>
                            <TabsTrigger value="winning">中标 ({winningBids.length})</TabsTrigger>
                            <TabsTrigger value="outbid">被超越 ({outbidBids.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <BidsTable bids={allBids} />
                        </TabsContent>

                        <TabsContent value="active">
                            <BidsTable bids={activeBids} />
                        </TabsContent>

                        <TabsContent value="winning">
                            <BidsTable bids={winningBids} />
                        </TabsContent>

                        <TabsContent value="outbid">
                            <BidsTable bids={outbidBids} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
} 