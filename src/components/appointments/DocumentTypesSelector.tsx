"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { documentCategories, documentTypesByCategory } from "@/lib/utils/appointments/helpers";

// 文档类型选择器的数据类型
export interface DocumentTypesData {
    [category: string]: {
        types: string[];
        count: number;
    };
}

interface DocumentTypesSelectorProps {
    value: DocumentTypesData;
    onChange: (value: DocumentTypesData) => void;
}

export function DocumentTypesSelector({ value, onChange }: DocumentTypesSelectorProps) {
    const [typeSelectOpen, setTypeSelectOpen] = useState<{ [key: string]: boolean }>({});

    // 处理文件类型选择
    const handleTypeSelection = (category: string, typeValue: string) => {
        const currentTypes = value[category]?.types || [];
        const newTypes = currentTypes.includes(typeValue)
            ? currentTypes.filter(t => t !== typeValue)
            : [...currentTypes, typeValue];

        onChange({
            ...value,
            [category]: {
                ...value[category],
                types: newTypes
            }
        });
    };

    // 处理文件数量变更
    const handleCountChange = (category: string, count: number) => {
        onChange({
            ...value,
            [category]: {
                ...value[category],
                count: count
            }
        });
    };

    // 获取已选类型的显示文本
    const getSelectedTypesDisplay = (category: string) => {
        const types = value[category]?.types || [];
        if (types.length === 0) return "选择文件类型";

        return types.map(typeValue => {
            const typeObj = documentTypesByCategory[category as keyof typeof documentTypesByCategory]
                .find(t => t.value === typeValue);
            return typeObj?.label || typeValue;
        }).join(", ");
    };

    return (
        <div className="grid gap-2">
            {documentCategories.map((category) => (
                <div key={category.value} className="grid grid-cols-[1fr,3fr] gap-3 items-start">
                    <Label className="pt-2.5">{category.label}</Label>
                    <div className="flex items-start space-x-2">
                        <div className="flex-1">
                            <Popover
                                open={typeSelectOpen[category.value]}
                                onOpenChange={(open) => setTypeSelectOpen(prev => ({ ...prev, [category.value]: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="justify-between w-full"
                                    >
                                        <div className="max-w-[90%] truncate text-left">
                                            {getSelectedTypesDisplay(category.value)}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="搜索文件类型..." />
                                        <CommandEmpty>未找到匹配的类型</CommandEmpty>
                                        <CommandGroup>
                                            <ScrollArea className="h-[200px]">
                                                {documentTypesByCategory[category.value as keyof typeof documentTypesByCategory].map((type) => (
                                                    <CommandItem
                                                        key={type.value}
                                                        value={type.value}
                                                        onSelect={() => handleTypeSelection(category.value, type.value)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                value[category.value]?.types.includes(type.value)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {type.label}
                                                    </CommandItem>
                                                ))}
                                            </ScrollArea>
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {value[category.value]?.types.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {value[category.value].types.map(typeValue => {
                                        const type = documentTypesByCategory[category.value as keyof typeof documentTypesByCategory]
                                            .find(t => t.value === typeValue);
                                        return (
                                            <Badge key={typeValue} variant="secondary" className="text-xs">
                                                {type?.label || typeValue}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <Input
                            type="number"
                            min="0"
                            value={value[category.value]?.count || 0}
                            onChange={(e) => handleCountChange(category.value, parseInt(e.target.value) || 0)}
                            className="w-24"
                            placeholder="数量"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
} 