import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { getOPDShortName, searchOPD, getAllOPDFullNames } from "@/utils/opdMapping";

const opdList = getAllOPDFullNames();

export default function OPDSelect({ value, onChange }: { value: string[] | string; onChange: (val: string[]) => void }) {
    const [query, setQuery] = useState("");
    const selectedOPDs = Array.isArray(value) ? value : value ? [value] : [];

    const filtered = query === ""
        ? opdList.filter(opd => !selectedOPDs.includes(opd))
        : opdList.filter((opd) => searchOPD(query, opd) && !selectedOPDs.includes(opd));

    const handleSelect = (opd: string) => {
        if (!selectedOPDs.includes(opd)) {
            onChange([...selectedOPDs, opd]);
            setQuery("");
        }
    };

    const handleRemove = (opd: string) => {
        onChange(selectedOPDs.filter(item => item !== opd));
    };

    return (
        <div>
            {/* Selected OPDs - Tampilkan singkatan */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedOPDs.map((opd) => (
                    <div key={opd} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center text-sm">
                        <span>{getOPDShortName(opd)}</span>
                        <button
                            onClick={() => handleRemove(opd)}
                            className="ml-2 text-yellow-700 hover:text-yellow-900"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <Combobox value="" onChange={handleSelect}>
                <div className="relative">
                    <Combobox.Input
                        className="w-full border border-yellow-300 bg-yellow-50 text-grey-700 p-2 rounded-md focus:ring-yellow-400 focus:border-yellow-500"
                        onChange={(e) => setQuery(e.target.value)}
                        value={query}
                        placeholder="Ketik dan Cari OPD terkait (nama lengkap atau singkatan)"
                    />
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                    >
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-2 text-gray-500">Tidak ditemukan</div>
                            ) : (
                                filtered.map((opd) => (
                                    <Combobox.Option
                                        key={opd}
                                        value={opd}
                                        className={({ active }) =>
                                            `cursor-pointer select-none relative px-4 py-2 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"}`
                                        }
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{getOPDShortName(opd)}</span>
                                            <span className="text-xs text-gray-600 truncate">{opd}</span>
                                        </div>
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}
