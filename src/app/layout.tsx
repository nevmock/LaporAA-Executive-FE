import Sidebar from "./sidebar";
import './globals.css';
import React from "react";

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
        </div>
      </body>
    </html>
  );
}
