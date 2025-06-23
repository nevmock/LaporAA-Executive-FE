"use client";

import React, { useEffect, useState } from "react";
import HeaderDesktop from "./HeaderDesktop";
import HeaderMobile from "./HeaderMobile";

// Props interface untuk mendefinisikan properti yang dibutuhkan komponen
interface Props {
    search: string;
    setSearch: (val: string) => void;
    statusCounts: Record<string, number>;
    selectedStatus: string;
    setSelectedStatus: (val: string) => void;
    isMobile: boolean;
    limit: number;
    setLimit: (val: number) => void;
    page: number;
    setPage: (val: number) => void;
    selectedSituasi: string;
    setSelectedSituasi: (val: string) => void;
    opdList: Array<{opd: string; count: number}>;
    selectedOpd: string;
    setSelectedOpd: (val: string) => void;
    isPinnedOnly: boolean;
    setIsPinnedOnly: (val: boolean) => void;
}

const HeaderSection: React.FC<Props> = ({
    search,
    setSearch,
    statusCounts,
    selectedStatus,
    setSelectedStatus,
    isMobile,
    limit,
    setLimit,
    page,
    setPage,
    selectedSituasi,
    setSelectedSituasi,
    opdList,
    selectedOpd,
    setSelectedOpd,
    isPinnedOnly,
    setIsPinnedOnly,
}) => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768); // Changed from 640px to 768px for iPad support
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const headerProps = {
        search,
        setSearch,
        statusCounts,
        selectedStatus,
        setSelectedStatus,
        limit,
        setLimit,
        page,
        setPage,
        selectedSituasi,
        setSelectedSituasi,
        opdList,
        selectedOpd,
        setSelectedOpd,
        isPinnedOnly,
        setIsPinnedOnly,
    };

    return isDesktop ? <HeaderDesktop {...headerProps} /> : <HeaderMobile {...headerProps} />;
};

export default HeaderSection;