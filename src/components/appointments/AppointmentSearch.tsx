"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AppointmentSearchProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    placeholder?: string;
}

export function AppointmentSearch({
    searchQuery,
    onSearchChange,
    placeholder = "搜索联系人、电话或地址",
}: AppointmentSearchProps) {
    return (
        <div className="relative w-80">
            <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
            />
            <Input
                className="pl-8"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    );
} 