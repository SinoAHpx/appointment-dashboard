"use client";

import * as React from "react";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandDialog,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandEmpty,
    CommandInput
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { AddressOption } from "@/lib/utils/beijing-address-data";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddressCascaderProps {
    value: string[];
    onChange: (value: string[]) => void;
    options: AddressOption[];
    placeholder?: string;
    className?: string;
}

export function AddressCascader({
    value = [],
    onChange,
    options,
    placeholder = "请选择地址",
    className,
}: AddressCascaderProps) {
    const [open, setOpen] = React.useState(false);
    const [activeLevel, setActiveLevel] = React.useState(0);
    const [levelOptions, setLevelOptions] = React.useState<AddressOption[][]>([options]);

    // 在选择上级时更新下级选项
    React.useEffect(() => {
        if (value.length > 0) {
            const newLevelOptions: AddressOption[][] = [options];

            for (let i = 0; i < value.length; i++) {
                const currentValue = value[i];
                const currentOptions = newLevelOptions[i];
                const selectedOption = currentOptions.find(option => option.value === currentValue);

                if (selectedOption?.children) {
                    newLevelOptions.push(selectedOption.children);
                }
            }

            setLevelOptions(newLevelOptions);
        } else {
            setLevelOptions([options]);
        }
    }, [value, options]);

    // 处理选项选择
    const handleSelect = (selectedValue: string) => {
        const newValue = [...value.slice(0, activeLevel), selectedValue];

        // 查找所选项
        const currentOptions = levelOptions[activeLevel];
        const selectedOption = currentOptions.find(option => option.value === selectedValue);

        // 如果有子级，更新到下一级
        if (selectedOption?.children?.length) {
            setActiveLevel(activeLevel + 1);
        } else {
            setOpen(false);
        }

        onChange(newValue);
    };

    // 切换显示级别
    const handleLevelChange = (level: number) => {
        setActiveLevel(level);
    };

    // 获取显示文本
    const getDisplayText = () => {
        if (value.length === 0) return placeholder;
        return value.join(" / ");
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className={cn("w-full justify-between", className)}
            >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="flex border-b">
                    {levelOptions.map((options, index) => (
                        <Button
                            key={index}
                            variant={activeLevel === index ? "default" : "ghost"}
                            className="rounded-none border-r h-9 text-sm font-normal"
                            onClick={() => handleLevelChange(index)}
                        >
                            {index === 0 ? "区" : "街道"}
                            {index < value.length && (
                                <ChevronRight className="ml-1 h-4 w-4" />
                            )}
                        </Button>
                    )).slice(0, value.length + 1)}
                </div>

                <CommandInput placeholder="搜索地址..." />

                <CommandList>
                    <ScrollArea className="h-[400px]">
                        <CommandEmpty>未找到相关地址</CommandEmpty>
                        <CommandGroup>
                            {levelOptions[activeLevel]?.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={handleSelect}
                                    className="flex items-center"
                                >
                                    <span>{option.label}</span>
                                    {value[activeLevel] === option.value && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                    {option.children && (
                                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </ScrollArea>
                </CommandList>
            </CommandDialog>
        </>
    );
}