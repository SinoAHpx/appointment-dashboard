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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Package, Gavel, Users } from "lucide-react";
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

export default function WasteAuctionsPage() {
    const { user } = useAuthStore();
    const [batches, setBatches] = useState<WasteBatch[]>([]);
    const [auctions, setAuctions] = useState<WasteAuction[]>([]);
    const [selectedAuctionBids, setSelectedAuctionBids] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateBatchDialog, setShowCreateBatchDialog] = useState(false);
    const [showCreateAuctionDialog, setShowCreateAuctionDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<number | null>(null);
    const [deleteAuctionDialogOpen, setDeleteAuctionDialogOpen] = useState(false);
    const [auctionToDelete, setAuctionToDelete] = useState<number | null>(null);

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

    // 删除批次
    const handleDeleteBatch = async (batchId: number) => {
        try {
            const response = await fetch(`/api/waste-batches/${batchId}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                toast.success("批次删除成功");
                fetchData();
            } else {
                toast.error(data.message || "删除失败");
            }
        } catch (error) {
            console.error("删除批次失败:", error);
            toast.error("删除失败");
        } finally {
            setDeleteDialogOpen(false);
            setBatchToDelete(null);
        }
    };

    // 打开删除确认对话框
    const openDeleteDialog = (batchId: number) => {
        setBatchToDelete(batchId);
        setDeleteDialogOpen(true);
    };

    // 删除竞价
    const handleDeleteAuction = async (auctionId: number) => {
        try {
            const response = await fetch(`/api/waste-auctions/${auctionId}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                toast.success("竞价删除成功");
                fetchData();
            } else {
                toast.error(data.message || "删除失败");
            }
        } catch (error) {
            console.error("删除竞价失败:", error);
            toast.error("删除失败");
        } finally {
            setDeleteAuctionDialogOpen(false);
            setAuctionToDelete(null);
        }
    };

    // 打开删除竞价确认对话框
    const openDeleteAuctionDialog = (auctionId: number) => {
        setAuctionToDelete(auctionId);
        setDeleteAuctionDialogOpen(true);
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

    // 获取时间状态描述
    const getTimeStatus = (auction: WasteAuction) => {
        const now = new Date();
        const start = new Date(auction.startTime);
        const end = new Date(auction.endTime);

        if (now < start) {
            const hoursUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60));
            return `距离开始: ${hoursUntilStart}小时`;
        } else if (now >= start && now < end) {
            const hoursUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60));
            return `距离结束: ${hoursUntilEnd}小时`;
        } else {
            return "竞价已结束";
        }
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
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => openDeleteDialog(batch.id)}
                                        >
                                            删除
                                        </Button>
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
                                        <div className="text-right">
                                            <Badge variant={getStatusColor(auction.status)} className="mb-2">
                                                {getStatusText(auction.status)}
                                            </Badge>
                                            <div className="text-sm text-muted-foreground">
                                                {getTimeStatus(auction)}
                                            </div>
                                        </div>
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
                                            <span className="font-medium">最高出价:</span>
                                            <span className={auction.highestBid > auction.basePrice ? "text-green-600 font-semibold" : ""}>
                                                ¥{auction.highestBid || auction.basePrice}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">出价次数:</span> {auction.bidCount}
                                        </div>
                                        <div>
                                            <span className="font-medium">尾料类型:</span> {getWasteTypeText(auction.batch?.wasteType || "")}
                                        </div>
                                    </div>
                                    {auction.description && (
                                        <div className="text-sm mb-4">
                                            <span className="font-medium">竞价描述:</span> {auction.description}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchAuctionBids(auction.id)}
                                            >
                                                <Users size={16} className="mr-2" />
                                                查看出价详情
                                            </Button>
                                            {auction.status === 'active' && (
                                                <Badge variant="outline" className="text-green-600 border-green-600">
                                                    正在进行中
                                                </Badge>
                                            )}
                                            {auction.status === 'pending' && (
                                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                    即将开始
                                                </Badge>
                                            )}
                                            {auction.status === 'ended' && (
                                                <Badge variant="outline" className="text-gray-600 border-gray-600">
                                                    竞价结束
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => openDeleteAuctionDialog(auction.id)}
                                        >
                                            删除
                                        </Button>
                                    </div>
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
                                <ScrollArea className="h-[400px]">
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
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    )}
                </TabsContent>

            </Tabs>

            {/* 删除确认对话框 */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除这个尾料批次吗？此操作不可恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => batchToDelete && handleDeleteBatch(batchToDelete)}
                        >
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除竞价确认对话框 */}
            <Dialog open={deleteAuctionDialogOpen} onOpenChange={setDeleteAuctionDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除这个竞价吗？此操作不可恢复，相关的出价记录也会被删除。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteAuctionDialogOpen(false)}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => auctionToDelete && handleDeleteAuction(auctionToDelete)}
                        >
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
} 