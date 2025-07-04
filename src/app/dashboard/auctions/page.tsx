"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Package, MapPin, Weight, Gavel, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores";

// 类型定义
interface WasteAuction {
    id: number;
    batchId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    reservePrice?: number;
    status: string;
    batch?: {
        batchNumber: string;
        title: string;
        wasteType: string;
        estimatedWeight?: number;
        location?: string;
        description?: string;
    };
    bidCount: number;
    highestBid: number;
}

export default function AuctionsPage() {
    const { user } = useAuthStore();
    const [auctions, setAuctions] = useState<WasteAuction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBidDialog, setShowBidDialog] = useState(false);
    const [selectedAuction, setSelectedAuction] = useState<WasteAuction | null>(null);
    const [bidForm, setBidForm] = useState({
        bidAmount: "",
        notes: "",
    });

    // 获取活跃竞价
    const fetchActiveAuctions = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/waste-auctions?active=true");
            if (response.ok) {
                const data = await response.json();
                setAuctions(data.data || []);
            } else {
                toast.error("获取竞价列表失败");
            }
        } catch (error) {
            console.error("获取竞价失败:", error);
            toast.error("获取竞价失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveAuctions();
        // 设置定时器，每30秒刷新一次数据
        const interval = setInterval(fetchActiveAuctions, 30000);
        return () => clearInterval(interval);
    }, []);

    // 提交出价
    const handleSubmitBid = async () => {
        if (!selectedAuction || !bidForm.bidAmount) {
            toast.error("请输入出价金额");
            return;
        }

        const bidAmount = parseFloat(bidForm.bidAmount);
        if (bidAmount <= selectedAuction.highestBid && selectedAuction.highestBid > 0) {
            toast.error(`出价必须高于当前最高价 ¥${selectedAuction.highestBid}`);
            return;
        }

        if (bidAmount < selectedAuction.basePrice) {
            toast.error(`出价不能低于起拍价 ¥${selectedAuction.basePrice}`);
            return;
        }

        try {
            const response = await fetch("/api/waste-bids", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    auctionId: selectedAuction.id,
                    bidderId: user?.id,
                    bidAmount: bidAmount,
                    notes: bidForm.notes,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("出价成功！");
                setShowBidDialog(false);
                setBidForm({ bidAmount: "", notes: "" });
                fetchActiveAuctions(); // 刷新列表
            } else {
                toast.error(data.message || "出价失败");
            }
        } catch (error) {
            console.error("出价失败:", error);
            toast.error("出价失败");
        }
    };

    // 检查竞价是否即将结束
    const isEndingSoon = (endTime: string) => {
        const now = new Date();
        const end = new Date(endTime);
        const timeDiff = end.getTime() - now.getTime();
        return timeDiff <= 24 * 60 * 60 * 1000; // 24小时内
    };

    // 检查竞价是否已经开始
    const isStarted = (startTime: string) => {
        const now = new Date();
        const start = new Date(startTime);
        return now >= start;
    };

    // 获取剩余时间
    const getRemainingTime = (endTime: string) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return "已结束";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}天${hours}小时`;
        if (hours > 0) return `${hours}小时${minutes}分钟`;
        return `${minutes}分钟`;
    };

    // 获取废料类型的中文名称
    const getWasteTypeText = (type: string) => {
        const typeMap: { [key: string]: string } = {
            electronic: "电子废料",
            paper: "纸质废料",
            plastic: "塑料废料",
            metal: "金属废料",
            mixed: "混合废料",
        };
        return typeMap[type] || type;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96">加载中...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">竞价大厅</h1>
                    <p className="text-gray-600 mt-2">查看并参与尾料竞价</p>
                </div>
                <Button variant="outline" onClick={fetchActiveAuctions}>
                    刷新列表
                </Button>
            </div>

            {/* 废料处置方案分析算法说明 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">
                        废料处置最优决策算法说明
                    </h3>
                    <div className="text-sm text-blue-800 space-y-3">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p><strong>优化目标：</strong>实现净收入最大化，即总收入减去行政成本的差值达到最大值。</p>
                                <p><strong>成本约束：</strong>每与一家供应商签订处置合同，需承担固定行政管理费用600元。</p>
                            </div>
                            <div className="space-y-2">
                                <p><strong>分项最优策略：</strong>针对每种废料介质，分别选择报价最高的供应商进行处置。</p>
                                <p><strong>整体打包策略：</strong>选择一家能够处理全部介质类型的供应商统一处置。</p>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-blue-200">
                            <p className="font-medium mb-2">算法决策流程：</p>
                            <div className="space-y-1 text-xs leading-relaxed">
                                <p><strong>步骤一：</strong>计算分项最优策略净收入 = 各介质最高报价之和 - (涉及供应商数量 × 600元)</p>
                                <p><strong>步骤二：</strong>计算整体打包策略净收入 = 单一供应商总报价 - 600元</p>
                                <p><strong>步骤三：</strong>比较两种策略的净收入值，选择数值较大者作为最优处置方案</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {auctions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Gavel className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活跃竞价</h3>
                        <p className="text-gray-500 text-center">
                            目前没有正在进行的竞价，请稍后再来查看
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {auctions.map((auction) => (
                        <Card key={auction.id} className="overflow-hidden">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CardTitle className="text-xl">{auction.title}</CardTitle>
                                            {isEndingSoon(auction.endTime) && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    即将结束
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Package size={14} />
                                                {auction.batch?.title}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                剩余: {getRemainingTime(auction.endTime)}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={auction.status === 'active' ? 'default' : 'secondary'}
                                        className="ml-4"
                                    >
                                        {auction.status === 'active' ? '进行中' : '等待开始'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* 批次信息 */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">批次信息</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-gray-400" />
                                                <span className="font-medium">批次号:</span>
                                                <span>{auction.batch?.batchNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                                                <span className="font-medium">类型:</span>
                                                <span>{getWasteTypeText(auction.batch?.wasteType || '')}</span>
                                            </div>
                                            {auction.batch?.estimatedWeight && (
                                                <div className="flex items-center gap-2">
                                                    <Weight size={14} className="text-gray-400" />
                                                    <span className="font-medium">预估重量:</span>
                                                    <span>{auction.batch.estimatedWeight}公斤</span>
                                                </div>
                                            )}
                                            {auction.batch?.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    <span className="font-medium">位置:</span>
                                                    <span>{auction.batch.location}</span>
                                                </div>
                                            )}
                                        </div>
                                        {auction.batch?.description && (
                                            <div className="pt-2 border-t">
                                                <p className="text-sm text-gray-600">{auction.batch.description}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 竞价信息 */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">竞价信息</h4>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500 mb-1">起拍价</p>
                                                    <p className="text-lg font-bold text-green-600">¥{auction.basePrice}</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500 mb-1">当前最高价</p>
                                                    <p className="text-lg font-bold text-red-600">
                                                        ¥{auction.highestBid || auction.basePrice}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">出价次数: {auction.bidCount}</span>
                                                <span className="text-gray-500">
                                                    结束时间: {new Date(auction.endTime).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 出价按钮 */}
                                        <div className="pt-2">
                                            {isStarted(auction.startTime) ? (
                                                <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            className="w-full"
                                                            size="lg"
                                                            onClick={() => {
                                                                setSelectedAuction(auction);
                                                                setBidForm({
                                                                    bidAmount: (auction.highestBid + 100).toString(),
                                                                    notes: "",
                                                                });
                                                            }}
                                                        >
                                                            <Trophy size={16} className="mr-2" />
                                                            立即出价
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>出价竞拍</DialogTitle>
                                                            <DialogDescription>
                                                                {selectedAuction?.title}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-500">起拍价:</span>
                                                                        <p className="font-bold text-green-600">¥{selectedAuction?.basePrice}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">当前最高价:</span>
                                                                        <p className="font-bold text-red-600">
                                                                            ¥{selectedAuction?.highestBid || selectedAuction?.basePrice}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="bidAmount">出价金额 (元) *</Label>
                                                                <Input
                                                                    id="bidAmount"
                                                                    type="number"
                                                                    value={bidForm.bidAmount}
                                                                    onChange={(e) => setBidForm({ ...bidForm, bidAmount: e.target.value })}
                                                                    placeholder={`最低 ${(selectedAuction?.highestBid || selectedAuction?.basePrice || 0) + 1}`}
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    建议出价: ¥{(selectedAuction?.highestBid || selectedAuction?.basePrice || 0) + 100}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="notes">备注信息</Label>
                                                                <Textarea
                                                                    id="notes"
                                                                    value={bidForm.notes}
                                                                    onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
                                                                    placeholder="可填写联系方式或其他说明"
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setShowBidDialog(false)}>
                                                                取消
                                                            </Button>
                                                            <Button onClick={handleSubmitBid}>
                                                                确认出价
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <Button className="w-full" size="lg" disabled>
                                                    竞价尚未开始
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {auction.description && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h4 className="font-medium text-gray-900 mb-2">竞价说明</h4>
                                        <p className="text-sm text-gray-600">{auction.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 