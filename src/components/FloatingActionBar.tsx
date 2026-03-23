import { X, Download, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/types/contacts";
import { cn } from "@/lib/utils";

interface FloatingActionBarProps {
  selectedCount: number;
  selectedUsers: User[];
  onClear: () => void;
  onAddToList: () => void;
}

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function exportToCSV(users: User[]) {
  const headers = ["First Name", "Last Name", "Email", "Title", "Company", "Industry", "Roles", "LinkedIn"];
  const rows = users.map((u) => [
    u.firstName,
    u.lastName,
    u.email,
    u.currentRole,
    u.currentCompany,
    u.industry,
    u.roles.join("; "),
    u.linkedinUrl,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FloatingActionBar({ selectedCount, selectedUsers, onClear, onAddToList }: FloatingActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        selectedCount > 0
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-0 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Count + clear */}
        <div className="flex items-center gap-2 px-4 py-3 border-r border-border">
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {selectedCount} contact{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Export CSV */}
        <button
          onClick={() => exportToCSV(selectedUsers)}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors border-r border-border"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>

        {/* Add to List */}
        <button
          onClick={onAddToList}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ListPlus className="h-4 w-4" />
          Add to List
        </button>
      </div>
    </div>
  );
}
