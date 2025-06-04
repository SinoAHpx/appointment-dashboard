"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    FileImage,
    Check,
    X,
    Eye,
    Search,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import { useAuthStore } from "@/lib/stores";

interface Contract {
    id: number;
    userId: number;
    filename: string;
    filepath: string;
    uploadedAt: string;
    status: "active" | "deleted";
    username?: string;
    name?: string;
    phone?: string;
    approvalStatus?: "pending" | "approved" | "rejected";
}

export function ContractManagement() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

    const { user } = useAuthStore();

    // 获取合同列表
    async function fetchContracts() {
        try {
            setIsLoading(true);
            const response = await fetch("/api/contracts");
            const data = await response.json();

            if (data.success) {
                setContracts(data.contracts);
            } else {
                toast.error("获取合同列表失败");
            }
        } catch (error) {
            console.error("获取合同列表失败:", error);
            toast.error("获取合同列表失败");
        } finally {
            setIsLoading(false);
        }
    }

    // 审核用户
    async function handleApproval(contractData: Contract, action: "approve" | "reject") {
        if (!user) {
            toast.error("用户信息不存在");
            return;
        }

        try {
            const response = await fetch("/api/users/approval", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: contractData.userId,
                    action,
                    approvedBy: user.id,
                    rejectionReason: action === "reject" ? rejectionReason : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchContracts(); // 刷新列表
                setShowApprovalDialog(false);
                setRejectionReason("");
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error("审核失败:", error);
            toast.error("审核失败");
        }
    }

    // 查看图片
    function viewImage(filepath: string) {
        setSelectedImage(filepath);
        setShowImageDialog(true);
    }

    // 开始审核流程
    function startApproval(contract: Contract) {
        setSelectedContract(contract);
        setShowApprovalDialog(true);
    }

    // 获取状态徽章
    function getStatusBadge(status?: string) {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
            case "approved":
                return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
            case "rejected":
                return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
            default:
                return <Badge variant="outline">未知</Badge>;
        }
    }

    // 过滤合同
    const filteredContracts = contracts.filter((contract) => {
        const matchesSearch =
            contract.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contract.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contract.phone?.includes(searchQuery) ||
            contract.filename.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            filterStatus === "all" || contract.approvalStatus === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // 组件加载时获取数据
    useEffect(() => {
        fetchContracts();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>合同管理</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-gray-500">加载中...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="w-5 h-5" />
                        合同管理
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* 搜索和筛选 */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="搜索用户名、姓名、手机号或文件名..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterStatus === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("all")}
                            >
                                全部
                            </Button>
                            <Button
                                variant={filterStatus === "pending" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("pending")}
                            >
                                待审核
                            </Button>
                            <Button
                                variant={filterStatus === "approved" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("approved")}
                            >
                                已通过
                            </Button>
                            <Button
                                variant={filterStatus === "rejected" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("rejected")}
                            >
                                已拒绝
                            </Button>
                        </div>
                    </div>

                    {/* 合同列表 */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>用户信息</TableHead>
                                    <TableHead>合同文件</TableHead>
                                    <TableHead>上传时间</TableHead>
                                    <TableHead>审核状态</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            暂无合同数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContracts.map((contract) => (
                                        <TableRow key={contract.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{contract.name}</div>
                                                    <div className="text-sm text-gray-500">@{contract.username}</div>
                                                    <div className="text-sm text-gray-500">{contract.phone}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileImage className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm">{contract.filename}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {format(new Date(contract.uploadedAt), "yyyy-MM-dd HH:mm")}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(contract.approvalStatus)}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => viewImage(contract.filepath)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        查看
                                                    </Button>
                                                    {contract.approvalStatus === "pending" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => startApproval(contract)}
                                                        >
                                                            审核
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* 图片查看对话框 */}
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>合同图片</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center">
                        {selectedImage && (
                            <Image
                                src={selectedImage}
                                alt="合同图片"
                                width={600}
                                height={400}
                                className="max-w-full h-auto rounded-lg border"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 审核对话框 */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>用户审核</DialogTitle>
                        <DialogDescription>
                            确认对用户 <strong>{selectedContract?.name}</strong> (@{selectedContract?.username}) 的审核操作
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>拒绝原因（仅在拒绝时填写）</Label>
                            <Textarea
                                placeholder="请输入拒绝原因..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowApprovalDialog(false);
                                setRejectionReason("");
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedContract && handleApproval(selectedContract, "reject")}
                            disabled={!rejectionReason.trim()}
                        >
                            <X className="w-4 h-4 mr-1" />
                            拒绝
                        </Button>
                        <Button
                            onClick={() => selectedContract && handleApproval(selectedContract, "approve")}
                        >
                            <Check className="w-4 h-4 mr-1" />
                            通过
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 