"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, Gavel, Users, Trophy, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores";

// 类型定义
interface WasteBatch {
    id: number;
    batchNumber: string;
    title: string;
    description?: string;
    estimatedWeight?: number;
    location?: string;
    wasteType: string;
    category?: string;
    createdAt: string;
    status: string;
}

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
    createdAt: string;
    batch?: {
        batchNumber: string;
        title: string;
        wasteType: string;
    };
    bidCount: number;
    highestBid: number;
}

interface WasteBid {
    id: number;
    auctionId: number;
    bidderId: number;
    bidAmount: number;
    bidTime: string;
    notes?: string;
    status: string;
    bidder?: {
        name: string;
        username: string;
    };
}

// 新增：供应商报价接口
interface SupplierQuote {
    supplier: string;
    paperMedia: number | null;    // 纸介质报价
    discMedia: number | null;     // 光盘介质报价
    magneticMedia: number | null; // 磁介质报价
}

// 新增：分析结果接口
interface AnalysisResult {
    strategy: string;
    suppliers: string[];
    totalRevenue: number;
    adminCosts: number;
    netIncome: number;
    details: string;
}

export default function WasteAuctionsPage() {
    const { user } = useAuthStore();
    const [batches, setBatches] = useState<WasteBatch[]>([]);
    const [auctions, setAuctions] = useState<WasteAuction[]>([]);
    const [selectedAuctionBids, setSelectedAuctionBids] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateBatchDialog, setShowCreateBatchDialog] = useState(false);
    const [showCreateAuctionDialog, setShowCreateAuctionDialog] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");

    // 新增：处置方案分析状态
    const [quotes, setQuotes] = useState<SupplierQuote[]>([
        { supplier: "A公司", paperMedia: null, discMedia: null, magneticMedia: null },
        { supplier: "B公司", paperMedia: null, discMedia: null, magneticMedia: null },
        { supplier: "C公司", paperMedia: null, discMedia: null, magneticMedia: null },
    ]);
    const [wasteWeights, setWasteWeights] = useState({
        paperMedia: 8,    // 纸介质重量（吨）
        discMedia: 4,     // 光盘介质重量（吨）
        magneticMedia: 6, // 磁介质重量（吨）
    });
    const [analysisResults, setAnalysisResults] = useState<{
        itemOptimal: AnalysisResult | null;
        packageOptimal: AnalysisResult | null;
        recommendation: string;
    }>({
        itemOptimal: null,
        packageOptimal: null,
        recommendation: "",
    });

    // 表单状态
    const [batchForm, setBatchForm] = useState({
        title: "",
        description: "",
        estimatedWeight: "",
        location: "",
        wasteType: "",
        category: "",
    });

    const [auctionForm, setAuctionForm] = useState({
        batchId: "",
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        basePrice: "",
        reservePrice: "",
    });

    // 获取数据
    const fetchData = async () => {
        try {
            setLoading(true);
            const [batchesRes, auctionsRes] = await Promise.all([
                fetch("/api/waste-batches"),
                fetch("/api/waste-auctions"),
            ]);

            if (batchesRes.ok) {
                const batchesData = await batchesRes.json();
                setBatches(batchesData.data || []);
            }

            if (auctionsRes.ok) {
                const auctionsData = await auctionsRes.json();
                setAuctions(auctionsData.data || []);
            }
        } catch (error) {
            console.error("获取数据失败:", error);
            toast.error("获取数据失败");
        } finally {
            setLoading(false);
        }
    };

    // 获取竞价的出价详情
    const fetchAuctionBids = async (auctionId: number) => {
        try {
            const response = await fetch(`/api/waste-bids?auctionId=${auctionId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedAuctionBids(data.data || []);
            }
        } catch (error) {
            console.error("获取出价失败:", error);
            toast.error("获取出价失败");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 创建尾料批次
    const handleCreateBatch = async () => {
        try {
            const response = await fetch("/api/waste-batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...batchForm,
                    createdBy: user?.id,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("尾料批次创建成功");
                setShowCreateBatchDialog(false);
                setBatchForm({
                    title: "",
                    description: "",
                    estimatedWeight: "",
                    location: "",
                    wasteType: "",
                    category: "",
                });
                fetchData();
            } else {
                toast.error(data.message || "创建失败");
            }
        } catch (error) {
            console.error("创建尾料批次失败:", error);
            toast.error("创建失败");
        }
    };

    // 创建竞价
    const handleCreateAuction = async () => {
        try {
            const response = await fetch("/api/waste-auctions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...auctionForm,
                    createdBy: user?.id,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("竞价创建成功");
                setShowCreateAuctionDialog(false);
                setAuctionForm({
                    batchId: "",
                    title: "",
                    description: "",
                    startTime: "",
                    endTime: "",
                    basePrice: "",
                    reservePrice: "",
                });
                fetchData();
            } else {
                toast.error(data.message || "创建失败");
            }
        } catch (error) {
            console.error("创建竞价失败:", error);
            toast.error("创建失败");
        }
    };

    // 状态颜色映射
    const getStatusColor = (status: string) => {
        switch (status) {
            case "draft": return "secondary";
            case "published": return "default";
            case "auction_in_progress": return "outline";
            case "auction_ended": return "destructive";
            case "pending": return "secondary";
            case "active": return "default";
            case "ended": return "destructive";
            default: return "secondary";
        }
    };

    // 状态文本映射
    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            draft: "草稿",
            published: "已发布",
            auction_in_progress: "竞价中",
            auction_ended: "竞价结束",
            allocated: "已分配",
            pending: "等待开始",
            active: "进行中",
            ended: "已结束",
            cancelled: "已取消",
        };
        return statusMap[status] || status;
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

    // 新增：更新供应商报价
    const updateQuote = (supplierIndex: number, media: keyof Omit<SupplierQuote, 'supplier'>, value: string) => {
        const newQuotes = [...quotes];
        newQuotes[supplierIndex] = {
            ...newQuotes[supplierIndex],
            [media]: value === "" ? null : parseFloat(value),
        };
        setQuotes(newQuotes);
    };

    // 新增：分析处置方案
    const analyzeDisposalStrategy = () => {
        const ADMIN_COST_PER_SUPPLIER = 600;

        // 步骤1：分析"分项最优"策略
        const mediaTypes = ['paperMedia', 'discMedia', 'magneticMedia'] as const;
        const itemOptimalDetails: { [key: string]: { supplier: string; quote: number } } = {};
        let itemOptimalRevenue = 0;
        const involvedSuppliers = new Set<string>();

        mediaTypes.forEach(media => {
            let bestQuote = -1;
            let bestSupplier = "";

            quotes.forEach(quote => {
                if (quote[media] !== null && quote[media]! > bestQuote) {
                    bestQuote = quote[media]!;
                    bestSupplier = quote.supplier;
                }
            });

            if (bestQuote > -1) {
                itemOptimalDetails[media] = { supplier: bestSupplier, quote: bestQuote };
                itemOptimalRevenue += bestQuote;
                involvedSuppliers.add(bestSupplier);
            }
        });

        const itemOptimalAdminCosts = involvedSuppliers.size * ADMIN_COST_PER_SUPPLIER;
        const itemOptimalNetIncome = itemOptimalRevenue - itemOptimalAdminCosts;

        const itemOptimalResult: AnalysisResult = {
            strategy: "分项最优",
            suppliers: Array.from(involvedSuppliers),
            totalRevenue: itemOptimalRevenue,
            adminCosts: itemOptimalAdminCosts,
            netIncome: itemOptimalNetIncome,
            details: `纸介质: ${itemOptimalDetails.paperMedia?.supplier || '无'} (¥${itemOptimalDetails.paperMedia?.quote || 0}), 光盘介质: ${itemOptimalDetails.discMedia?.supplier || '无'} (¥${itemOptimalDetails.discMedia?.quote || 0}), 磁介质: ${itemOptimalDetails.magneticMedia?.supplier || '无'} (¥${itemOptimalDetails.magneticMedia?.quote || 0})`
        };

        // 步骤2：分析"整体打包"策略
        let packageOptimalResult: AnalysisResult | null = null;
        let bestPackageSupplier = "";
        let bestPackageRevenue = -1;

        quotes.forEach(quote => {
            // 检查该供应商是否对所有介质都有报价
            if (quote.paperMedia !== null && quote.discMedia !== null && quote.magneticMedia !== null) {
                const totalRevenue = quote.paperMedia + quote.discMedia + quote.magneticMedia;
                if (totalRevenue > bestPackageRevenue) {
                    bestPackageRevenue = totalRevenue;
                    bestPackageSupplier = quote.supplier;
                }
            }
        });

        if (bestPackageRevenue > -1) {
            const packageAdminCosts = ADMIN_COST_PER_SUPPLIER; // 只与一家公司合作
            const packageNetIncome = bestPackageRevenue - packageAdminCosts;

            packageOptimalResult = {
                strategy: "整体打包",
                suppliers: [bestPackageSupplier],
                totalRevenue: bestPackageRevenue,
                adminCosts: packageAdminCosts,
                netIncome: packageNetIncome,
                details: `由 ${bestPackageSupplier} 处理所有介质，总收入 ¥${bestPackageRevenue}`
            };
        }

        // 步骤3：最终决策
        let recommendation = "";
        if (packageOptimalResult && itemOptimalResult) {
            if (packageOptimalResult.netIncome > itemOptimalResult.netIncome) {
                recommendation = `建议选择"整体打包"策略，与 ${bestPackageSupplier} 合作，净收入更高 (¥${packageOptimalResult.netIncome} vs ¥${itemOptimalResult.netIncome})`;
            } else if (itemOptimalResult.netIncome > packageOptimalResult.netIncome) {
                recommendation = `建议选择"分项最优"策略，与 ${Array.from(involvedSuppliers).join('、')} 合作，净收入更高 (¥${itemOptimalResult.netIncome} vs ¥${packageOptimalResult.netIncome})`;
            } else {
                recommendation = `两种策略净收入相同 (¥${itemOptimalResult.netIncome})，可选择任一策略`;
            }
        } else if (itemOptimalResult && !packageOptimalResult) {
            recommendation = `只能选择"分项最优"策略，因为没有供应商能处理所有介质类型`;
        } else {
            recommendation = `无法进行分析，请检查报价数据是否完整`;
        }

        setAnalysisResults({
            itemOptimal: itemOptimalResult,
            packageOptimal: packageOptimalResult,
            recommendation,
        });

        toast.success("分析完成！");
    };

    // 新增：重置分析数据
    const resetAnalysis = () => {
        setQuotes([
            { supplier: "A公司", paperMedia: null, discMedia: null, magneticMedia: null },
            { supplier: "B公司", paperMedia: null, discMedia: null, magneticMedia: null },
            { supplier: "C公司", paperMedia: null, discMedia: null, magneticMedia: null },
        ]);
        setAnalysisResults({
            itemOptimal: null,
            packageOptimal: null,
            recommendation: "",
        });
    };

    // 新增：加载示例数据
    const loadExampleData = () => {
        setQuotes([
            { supplier: "A公司", paperMedia: 8000, discMedia: 7200, magneticMedia: 36000 },
            { supplier: "B公司", paperMedia: 8100, discMedia: null, magneticMedia: 33000 },
            { supplier: "C公司", paperMedia: 6400, discMedia: 8000, magneticMedia: null },
        ]);
        toast.success("已加载示例数据");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96">加载中...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">尾料竞价管理</h1>
            </div>

            <Tabs defaultValue="batches" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="batches" className="flex items-center gap-2">
                        <Package size={16} />
                        尾料批次
                    </TabsTrigger>
                    <TabsTrigger value="auctions" className="flex items-center gap-2">
                        <Gavel size={16} />
                        竞价管理
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                        <Calculator size={16} />
                        处置方案分析
                    </TabsTrigger>
                </TabsList>

                {/* 尾料批次管理 */}
                <TabsContent value="batches" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">尾料批次列表</h2>
                        <Dialog open={showCreateBatchDialog} onOpenChange={setShowCreateBatchDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus size={16} className="mr-2" />
                                    新建批次
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>创建尾料批次</DialogTitle>
                                    <DialogDescription>
                                        填写尾料批次的基本信息
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">批次标题 *</Label>
                                        <Input
                                            id="title"
                                            value={batchForm.title}
                                            onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                                            placeholder="输入批次标题"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="wasteType">尾料类型 *</Label>
                                        <Select
                                            value={batchForm.wasteType}
                                            onValueChange={(value) => setBatchForm({ ...batchForm, wasteType: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择尾料类型" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="electronic">电子废料</SelectItem>
                                                <SelectItem value="paper">纸质废料</SelectItem>
                                                <SelectItem value="plastic">塑料废料</SelectItem>
                                                <SelectItem value="metal">金属废料</SelectItem>
                                                <SelectItem value="mixed">混合废料</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="estimatedWeight">预估重量 (公斤)</Label>
                                        <Input
                                            id="estimatedWeight"
                                            type="number"
                                            value={batchForm.estimatedWeight}
                                            onChange={(e) => setBatchForm({ ...batchForm, estimatedWeight: e.target.value })}
                                            placeholder="输入预估重量"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="location">存放位置</Label>
                                        <Input
                                            id="location"
                                            value={batchForm.location}
                                            onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })}
                                            placeholder="输入存放位置"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">描述</Label>
                                        <Textarea
                                            id="description"
                                            value={batchForm.description}
                                            onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                                            placeholder="输入批次描述"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCreateBatchDialog(false)}>
                                        取消
                                    </Button>
                                    <Button onClick={handleCreateBatch}>创建</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {batches.map((batch) => (
                            <Card key={batch.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{batch.title}</CardTitle>
                                            <CardDescription>
                                                批次号: {batch.batchNumber} | 类型: {getWasteTypeText(batch.wasteType)}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={getStatusColor(batch.status)}>
                                            {getStatusText(batch.status)}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {batch.estimatedWeight && (
                                            <div>
                                                <span className="font-medium">预估重量:</span> {batch.estimatedWeight}公斤
                                            </div>
                                        )}
                                        {batch.location && (
                                            <div>
                                                <span className="font-medium">存放位置:</span> {batch.location}
                                            </div>
                                        )}
                                        {batch.description && (
                                            <div className="col-span-2">
                                                <span className="font-medium">描述:</span> {batch.description}
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <span className="font-medium">创建时间:</span> {new Date(batch.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* 竞价管理 */}
                <TabsContent value="auctions" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">竞价列表</h2>
                        <Dialog open={showCreateAuctionDialog} onOpenChange={setShowCreateAuctionDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus size={16} className="mr-2" />
                                    发布竞价
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>发布竞价</DialogTitle>
                                    <DialogDescription>
                                        为尾料批次创建竞价
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="batchId">选择尾料批次 *</Label>
                                        <Select
                                            value={auctionForm.batchId}
                                            onValueChange={(value) => setAuctionForm({ ...auctionForm, batchId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择尾料批次" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {batches.filter(b => b.status === 'draft' || b.status === 'published').map((batch) => (
                                                    <SelectItem key={batch.id} value={batch.id.toString()}>
                                                        {batch.title} ({batch.batchNumber})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="auctionTitle">竞价标题 *</Label>
                                        <Input
                                            id="auctionTitle"
                                            value={auctionForm.title}
                                            onChange={(e) => setAuctionForm({ ...auctionForm, title: e.target.value })}
                                            placeholder="输入竞价标题"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="startTime">开始时间 *</Label>
                                            <Input
                                                id="startTime"
                                                type="datetime-local"
                                                value={auctionForm.startTime}
                                                onChange={(e) => setAuctionForm({ ...auctionForm, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="endTime">结束时间 *</Label>
                                            <Input
                                                id="endTime"
                                                type="datetime-local"
                                                value={auctionForm.endTime}
                                                onChange={(e) => setAuctionForm({ ...auctionForm, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="basePrice">起拍价 (元)</Label>
                                            <Input
                                                id="basePrice"
                                                type="number"
                                                value={auctionForm.basePrice}
                                                onChange={(e) => setAuctionForm({ ...auctionForm, basePrice: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="reservePrice">保留价 (元)</Label>
                                            <Input
                                                id="reservePrice"
                                                type="number"
                                                value={auctionForm.reservePrice}
                                                onChange={(e) => setAuctionForm({ ...auctionForm, reservePrice: e.target.value })}
                                                placeholder="可选"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="auctionDescription">竞价描述</Label>
                                        <Textarea
                                            id="auctionDescription"
                                            value={auctionForm.description}
                                            onChange={(e) => setAuctionForm({ ...auctionForm, description: e.target.value })}
                                            placeholder="输入竞价描述"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCreateAuctionDialog(false)}>
                                        取消
                                    </Button>
                                    <Button onClick={handleCreateAuction}>发布</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {auctions.map((auction) => (
                            <Card key={auction.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{auction.title}</CardTitle>
                                            <CardDescription>
                                                批次: {auction.batch?.title} ({auction.batch?.batchNumber})
                                            </CardDescription>
                                        </div>
                                        <Badge variant={getStatusColor(auction.status)}>
                                            {getStatusText(auction.status)}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div>
                                            <span className="font-medium">开始时间:</span> {new Date(auction.startTime).toLocaleString()}
                                        </div>
                                        <div>
                                            <span className="font-medium">结束时间:</span> {new Date(auction.endTime).toLocaleString()}
                                        </div>
                                        <div>
                                            <span className="font-medium">起拍价:</span> ¥{auction.basePrice}
                                        </div>
                                        <div>
                                            <span className="font-medium">最高出价:</span> ¥{auction.highestBid || 0}
                                        </div>
                                        <div>
                                            <span className="font-medium">出价次数:</span> {auction.bidCount}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchAuctionBids(auction.id)}
                                    >
                                        <Users size={16} className="mr-2" />
                                        查看出价详情
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* 出价详情弹窗 */}
                    {selectedAuctionBids.length > 0 && (
                        <Dialog open={selectedAuctionBids.length > 0} onOpenChange={() => setSelectedAuctionBids([])}>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>出价详情</DialogTitle>
                                    <DialogDescription>
                                        查看该竞价的所有出价情况
                                    </DialogDescription>
                                </DialogHeader>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>出价人</TableHead>
                                            <TableHead>出价金额</TableHead>
                                            <TableHead>出价时间</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead>备注</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedAuctionBids.map((bid) => (
                                            <TableRow key={bid.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{bid.bidder?.name}</div>
                                                        <div className="text-sm text-gray-500">{bid.bidder?.username}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">¥{bid.bidAmount}</TableCell>
                                                <TableCell>{new Date(bid.bidTime).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={bid.status === 'active' ? 'default' : 'secondary'}>
                                                        {bid.status === 'active' ? '有效' : '已被超越'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{bid.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </DialogContent>
                        </Dialog>
                    )}
                </TabsContent>

                {/* 新增：处置方案分析 */}
                <TabsContent value="analysis" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">废料处置方案分析</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadExampleData}>
                                加载示例数据
                            </Button>
                            <Button variant="outline" onClick={resetAnalysis}>
                                重置数据
                            </Button>
                            <Button onClick={analyzeDisposalStrategy}>
                                <Calculator size={16} className="mr-2" />
                                开始分析
                            </Button>
                        </div>
                    </div>

                    {/* 算法说明 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">分析算法说明</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                            <p><strong>目标：</strong> 实现净收入最大化（总收入 - 行政成本）</p>
                            <p><strong>行政成本：</strong> 每与一家供应商签约需支付 600 元管理费</p>
                            <p><strong>分项最优策略：</strong> 每种介质选择最高报价供应商</p>
                            <p><strong>整体打包策略：</strong> 选择一家能处理所有介质的供应商</p>
                            <p><strong>决策依据：</strong> 比较两种策略的最终净收入，选择更高者</p>
                        </div>
                    </div>

                    {/* 数据输入区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 供应商报价输入 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>供应商报价输入</CardTitle>
                                <CardDescription>
                                    请输入各供应商对不同介质的回收报价（元）
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {quotes.map((quote, index) => (
                                    <div key={quote.supplier} className="space-y-3">
                                        <h4 className="font-medium">{quote.supplier}</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor={`${quote.supplier}-paper`} className="text-xs">
                                                    纸介质 ({wasteWeights.paperMedia}吨)
                                                </Label>
                                                <Input
                                                    id={`${quote.supplier}-paper`}
                                                    type="number"
                                                    placeholder="报价"
                                                    value={quote.paperMedia || ""}
                                                    onChange={(e) => updateQuote(index, 'paperMedia', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`${quote.supplier}-disc`} className="text-xs">
                                                    光盘介质 ({wasteWeights.discMedia}吨)
                                                </Label>
                                                <Input
                                                    id={`${quote.supplier}-disc`}
                                                    type="number"
                                                    placeholder="报价"
                                                    value={quote.discMedia || ""}
                                                    onChange={(e) => updateQuote(index, 'discMedia', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`${quote.supplier}-magnetic`} className="text-xs">
                                                    磁介质 ({wasteWeights.magneticMedia}吨)
                                                </Label>
                                                <Input
                                                    id={`${quote.supplier}-magnetic`}
                                                    type="number"
                                                    placeholder="报价"
                                                    value={quote.magneticMedia || ""}
                                                    onChange={(e) => updateQuote(index, 'magneticMedia', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* 分析结果展示 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>分析结果</CardTitle>
                                <CardDescription>
                                    处置方案对比分析
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysisResults.itemOptimal && (
                                    <div className="space-y-3">
                                        <div className="border rounded-lg p-3">
                                            <h4 className="font-medium text-blue-600 mb-2">
                                                分项最优策略
                                            </h4>
                                            <div className="text-sm space-y-1">
                                                <p><strong>合作供应商：</strong> {analysisResults.itemOptimal.suppliers.join('、')}</p>
                                                <p><strong>总收入：</strong> ¥{analysisResults.itemOptimal.totalRevenue}</p>
                                                <p><strong>行政成本：</strong> ¥{analysisResults.itemOptimal.adminCosts}</p>
                                                <p><strong>净收入：</strong> ¥{analysisResults.itemOptimal.netIncome}</p>
                                                <p className="text-xs text-gray-600">{analysisResults.itemOptimal.details}</p>
                                            </div>
                                        </div>

                                        {analysisResults.packageOptimal && (
                                            <div className="border rounded-lg p-3">
                                                <h4 className="font-medium text-green-600 mb-2">
                                                    整体打包策略
                                                </h4>
                                                <div className="text-sm space-y-1">
                                                    <p><strong>合作供应商：</strong> {analysisResults.packageOptimal.suppliers.join('、')}</p>
                                                    <p><strong>总收入：</strong> ¥{analysisResults.packageOptimal.totalRevenue}</p>
                                                    <p><strong>行政成本：</strong> ¥{analysisResults.packageOptimal.adminCosts}</p>
                                                    <p><strong>净收入：</strong> ¥{analysisResults.packageOptimal.netIncome}</p>
                                                    <p className="text-xs text-gray-600">{analysisResults.packageOptimal.details}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <h4 className="font-medium text-yellow-800 mb-1">
                                                最终建议
                                            </h4>
                                            <p className="text-sm text-yellow-700">
                                                {analysisResults.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!analysisResults.itemOptimal && (
                                    <div className="text-center text-gray-500 py-8">
                                        请输入供应商报价后点击"开始分析"
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 