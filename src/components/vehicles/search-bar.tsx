import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
    return (
        <div className="relative w-80">
            <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
            />
            <Input
                className="pl-8"
                placeholder="搜索车牌号或车型"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    );
} 