import { Download, X } from "lucide-react";
import { User } from "@/types/contacts";
import { Button } from "@/components/ui/button";

interface ExportBarProps {
  selectedUsers: User[];
  onClear: () => void;
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

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportBar({ selectedUsers, onClear }: ExportBarProps) {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {selectedUsers.length} contact{selectedUsers.length !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
      <Button
        size="sm"
        onClick={() => exportToCSV(selectedUsers)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
