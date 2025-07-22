import { getOPDShortName } from "@/utils/opdMapping";

// Contoh penggunaan untuk menampilkan OPD di komponen lain
interface OPDDisplayProps {
    opdName: string;
    className?: string;
}

export const OPDDisplay = ({ opdName, className = "" }: OPDDisplayProps) => {
    return (
        <span className={`inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm ${className}`}>
            {getOPDShortName(opdName)}
        </span>
    );
};

// Komponen untuk menampilkan multiple OPD
interface OPDListDisplayProps {
    opdNames: string[];
    className?: string;
}

export const OPDListDisplay = ({ opdNames, className = "" }: OPDListDisplayProps) => {
    return (
        <div className={`flex flex-wrap gap-1 ${className}`}>
            {opdNames.map((opd, index) => (
                <OPDDisplay key={index} opdName={opd} />
            ))}
        </div>
    );
};

// Komponen untuk menampilkan OPD di tabel
interface OPDTableCellProps {
    opdName: string;
    showTooltip?: boolean;
}

export const OPDTableCell = ({ opdName, showTooltip = true }: OPDTableCellProps) => {
    const shortName = getOPDShortName(opdName);
    
    return (
        <td className="px-3 py-2">
            {showTooltip ? (
                <span 
                    title={opdName} 
                    className="cursor-help text-blue-600 hover:text-blue-800"
                >
                    {shortName}
                </span>
            ) : (
                <span>{shortName}</span>
            )}
        </td>
    );
};
