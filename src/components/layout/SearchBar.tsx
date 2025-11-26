"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchUsers } from "@/lib/actions/user";

interface SearchResult {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
}

export const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                try {
                    const users = await searchUsers(query);
                    setResults(users);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Error searching:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelectUser = (username: string) => {
        setQuery("");
        setIsOpen(false);
        router.push(`/u/${username}`);
    };

    return (
        <div className="relative w-full max-w-md mx-auto" ref={searchRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-2 border border-input rounded-full leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input sm:text-sm transition-all"
                    placeholder="Search users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2 && results.length > 0) setIsOpen(true);
                    }}
                />
                {query && (
                    <div
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            setIsOpen(false);
                        }}
                    >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute mt-1 w-full bg-popover rounded-md shadow-lg py-1 z-50 border border-border max-h-60 overflow-auto">
                    {isLoading ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
                    ) : results.length > 0 ? (
                        results.map((user) => (
                            <div
                                key={user.id}
                                className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-3 transition-colors"
                                onClick={() => handleSelectUser(user.username || "")}
                            >
                                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-secondary-foreground font-bold text-xs">
                                            {(user.username?.[0] || user.full_name?.[0] || "?").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">
                                        {user.full_name || user.username}
                                    </span>
                                    {user.full_name && user.username && (
                                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No users found.</div>
                    )}
                </div>
            )}
        </div>
    );
};
