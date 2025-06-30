"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Download } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateGeneratorProps {
    task: {
        taskId: string;
        customerName: string;
        itemDescription?: string;
        actualWeight?: number;
        destructionDate: string;
    };
    certificate: {
        certificateNumber: string;
        destructionMethod: string;
        operatorName: string;
        supervisorName: string;
    };
    companyInfo: {
        name: string;
        address: string;
        phone: string;
    };
}

export function CertificateGenerator({ task, certificate, companyInfo }: CertificateGeneratorProps) {
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!certificateRef.current) return;

        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`销毁证明_${certificate.certificateNumber}.pdf`);
        } catch (error) {
            console.error("生成PDF失败:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    下载证明
                </Button>
            </div>

            <Card ref={certificateRef} className="max-w-2xl mx-auto">
                <CardHeader className="text-center border-b">
                    <h1 className="text-2xl font-bold">销毁证明</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        证书编号：{certificate.certificateNumber}
                    </p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold">{companyInfo.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {companyInfo.address} | 电话：{companyInfo.phone}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="leading-relaxed">
                            兹证明，我单位已于 <span className="font-semibold">{format(new Date(task.destructionDate), "yyyy年MM月dd日")}</span>
                            对 <span className="font-semibold">{task.customerName}</span> 委托的物品进行了专业销毁处理。
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">任务编号</p>
                                    <p className="font-medium">{task.taskId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">销毁方式</p>
                                    <p className="font-medium">{certificate.destructionMethod}</p>
                                </div>
                            </div>
                            {task.itemDescription && (
                                <div>
                                    <p className="text-sm text-muted-foreground">物品描述</p>
                                    <p className="font-medium">{task.itemDescription}</p>
                                </div>
                            )}
                            {task.actualWeight && (
                                <div>
                                    <p className="text-sm text-muted-foreground">实际重量</p>
                                    <p className="font-medium">{task.actualWeight} 公斤</p>
                                </div>
                            )}
                        </div>

                        <p className="leading-relaxed">
                            销毁过程严格按照国家相关法律法规执行，确保被销毁物品得到彻底、安全、环保的处理。
                            销毁全程在客户代表的监督下进行，确保销毁过程的透明性和可追溯性。
                        </p>

                        <div className="mt-8 pt-8 border-t grid grid-cols-2 gap-8">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-8">操作员签字</p>
                                <div className="border-b border-gray-300 mb-2"></div>
                                <p className="font-medium">{certificate.operatorName}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-8">监督员签字</p>
                                <div className="border-b border-gray-300 mb-2"></div>
                                <p className="font-medium">{certificate.supervisorName}</p>
                            </div>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-muted-foreground">
                                签发日期：{format(new Date(), "yyyy年MM月dd日")}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 