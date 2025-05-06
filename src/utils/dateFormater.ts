export function formatWIBDate(dateString: string | undefined): string {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date) + " WIB";
}