import Sidebar from "./sidebar";
import './globals.css';
import React from "react";
import "leaflet/dist/leaflet.css";
// import UserNav from "../components/userNav";

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="id">
            <body className="bg-gray-100">
                <div className="flex h-full w-full">
                    <Sidebar />
                    <main className="flex-1 flex flex-col h-full w-full">{children}</main>
                    {/* <div className="ml-auto mr-2 mt-1 flex w-full items-center justify-end space-x-2 text-lg"> */}
                        {/*<ModeToggle />*/}
                        {/* <UserNav />
                    </div> */}
                </div>
            </body>
        </html>
    );
}
