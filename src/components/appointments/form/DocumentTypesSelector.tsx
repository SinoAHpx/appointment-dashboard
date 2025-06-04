"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { documentCategories, documentTypesByCategory } from "@/lib/utils/appointments/helpers";
import { ScrollArea } from "@/components/ui/scroll-area";

// 修改后的文档类型选择器数据类型 - 每个子类型都有独立的数量
export interface DocumentTypesData {
    [category: string]: {
        items: {
            [itemType: string]: number;  // 每个子类型的独立数量
        }
    };
}

interface DocumentTypesSelectorProps {
    value: DocumentTypesData;
    onChange: (value: DocumentTypesData) => void;
}

export function DocumentTypesSelector({ value, onChange }: DocumentTypesSelectorProps) {
    const [typeSelectOpen, setTypeSelectOpen] = useState<{ [key: string]: boolean }>({});

    // 添加新的文档类型
    const handleAddDocumentType = (category: string, typeValue: string) => {
        const currentItems = value[category]?.items || {};

        // 如果该类型已存在，不重复添加
        if (currentItems[typeValue] !== undefined) {
            return;
        }

        onChange({
            ...value,
            [category]: {
                items: {
                    ...currentItems,
                    [typeValue]: 1  // 默认数量为1
                }
            }
        });
    };

    // 移除文档类型
    const handleRemoveDocumentType = (category: string, typeValue: string) => {
        const currentItems = value[category]?.items || {};
        const newItems = { ...currentItems };
        delete newItems[typeValue];

        onChange({
            ...value,
            [category]: {
                items: newItems
            }
        });
    };

    // 更新特定文档类型的数量
    const handleCountChange = (category: string, typeValue: string, count: number) => {
        const currentItems = value[category]?.items || {};

        onChange({
            ...value,
            [category]: {
                items: {
                    ...currentItems,
                    [typeValue]: Math.max(0, count)  // 确保数量不小于0
                }
            }
        });
    };

    // 获取已添加的文档类型
    const getAddedTypes = (category: string) => {
        return Object.keys(value[category]?.items || {});
    };

    // 获取可选择的文档类型（排除已添加的）
    const getAvailableTypes = (category: string) => {
        const addedTypes = getAddedTypes(category);
        return documentTypesByCategory[category as keyof typeof documentTypesByCategory]
            .filter(type => !addedTypes.includes(type.value));
    };

    return (
        <div className="space-y-4">
            {documentCategories.map((category) => {
                const addedTypes = getAddedTypes(category.value);
                const availableTypes = getAvailableTypes(category.value);

                return (
                    <div key={category.value} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">{category.label}</Label>

                            {/* 添加新类型的下拉按钮 */}
                            {availableTypes.length > 0 && (
                                <Popover
                                    open={typeSelectOpen[category.value]}
                                    onOpenChange={(open) => setTypeSelectOpen(prev => ({ ...prev, [category.value]: open }))}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            添加
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[250px] p-0" align="end">
                                        <Command>
                                            <CommandInput placeholder="搜索类型..." className="h-8" />
                                            <CommandEmpty>未找到匹配的类型</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-[150px]" type="hover">
                                                    {availableTypes.map((type) => (
                                                        <CommandItem
                                                            key={type.value}
                                                            value={type.value}
                                                            onSelect={() => {
                                                                handleAddDocumentType(category.value, type.value);
                                                                setTypeSelectOpen(prev => ({ ...prev, [category.value]: false }));
                                                            }}
                                                            className="cursor-pointer text-xs"
                                                        >
                                                            <Plus className="mr-2 h-3 w-3" />
                                                            {type.label}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>

                        {/* 已添加的文档类型列表 */}
                        <div className="space-y-1.5">
                            {addedTypes.length === 0 ? (
                                <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded text-center">
                                    尚未添加{category.label}
                                </div>
                            ) : (
                                addedTypes.map(typeValue => {
                                    const type = documentTypesByCategory[category.value as keyof typeof documentTypesByCategory]
                                        .find(t => t.value === typeValue);
                                    const count = value[category.value]?.items[typeValue] || 0;

                                    return (
                                        <div key={typeValue} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                <Badge variant="secondary" className="text-xs truncate">
                                                    {type?.label || typeValue}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => handleCountChange(category.value, typeValue, count - 1)}
                                                    disabled={count <= 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={count}
                                                    onChange={(e) => handleCountChange(category.value, typeValue, parseInt(e.target.value) || 0)}
                                                    className="w-12 h-6 text-center text-xs p-1"
                                                />

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => handleCountChange(category.value, typeValue, count + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemoveDocumentType(category.value, typeValue)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 显示该类别的总数量 */}
                        {addedTypes.length > 0 && (
                            <div className="text-xs text-muted-foreground text-right">
                                小计: {Object.values(value[category.value]?.items || {}).reduce((sum, count) => sum + count, 0)} 件
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 显示总数量 */}
            {Object.values(value).some(category => Object.keys(category.items).length > 0) && (
                <div className="border-t pt-2 mt-4">
                    <div className="text-sm font-medium text-gray-900 text-right">
                        总计: {Object.values(value).reduce((total, category) => {
                            return total + Object.values(category.items).reduce((sum, count) => sum + count, 0);
                        }, 0)} 件
                    </div>
                </div>
            )}
        </div>
    );
} 