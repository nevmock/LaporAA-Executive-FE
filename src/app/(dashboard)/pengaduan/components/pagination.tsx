"use client";

import React from "react";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";

interface Props {
    page: number;
    setPage: (val: number) => void;
    totalPages: number;
}

const Pagination: React.FC<Props> = ({ page, setPage, totalPages }) => {
    return (
        <div className="z-40 bg-red-50">
            <div className="flex items-center justify-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="flex items-center gap-1 rounded bg-[#2463eb] px-3 py-1 text-gray-200 text-xs disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 hover:bg-[#1d4fbb]"
                >
                    <GrLinkPrevious size={12} /> Prev
                </button>

                <span className="text-xs text-gray-600">
                    {page} dari {totalPages}
                </span>

                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="flex items-center gap-1 rounded bg-[#2463eb] px-3 py-1 text-gray-200 text-xs disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 hover:bg-[#1d4fbb]"
                >
                    Next <GrLinkNext size={12} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;