"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "./ui/button";
import { User2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function UserNav() {
    const { authUser, logout } = useAuth();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <User2 className="h-5 w-5" />
                </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="w-56 bg-white dark:bg-gray-800 rounded-md shadow-md p-2 z-[1000]"
                    align="end"
                >
                    <DropdownMenu.Label className="font-normal p-2">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {authUser?.username || "-"}
                            </p>
                            <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                                {authUser?.role || "-"}
                            </p>
                        </div>
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    <DropdownMenu.Item
                        onSelect={logout}
                        className="p-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        Keluar
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}