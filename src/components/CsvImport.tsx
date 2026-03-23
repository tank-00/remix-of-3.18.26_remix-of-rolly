import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, X } from "lucide-react";
import { User, Role } from "@/types/contacts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ALL_ROLES = new Set<string>(["operator", "founder", "technical", "investor", "expert", "angel"]);

function parseCSV(text: string): User[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line, i) => {
    const cells = parseCSVLine(line);
    const get = (col: string) => {
      const idx = header.indexOf(col);
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };

    const rawRoles = get("roles")
      .split(",")
      .map((r) => r.trim().toLowerCase())
      .filter((r) => ALL_ROLES.has(r)) as Role[];

    return {
      id: `csv-${Date.now()}-${i}`,
      firstName: get("firstname") || get("first_name") || get("first name"),
      lastName: get("lastname") || get("last_name") || get("last name"),
      email: get("email"),
      linkedinUrl: get("linkedinurl") || get("linkedin_url") || get("linkedin"),
      roles: rawRoles,
      currentRole: get("currentrole") || get("current_role") || get("current role"),
      currentCompany: get("currentcompany") || get("current_company") || get("current company"),
      industry: get("industry"),
      avatarInitials: "",
      lastUpdated: new Date().toISOString(),
    } satisfies User;
  }).filter((u) => u.firstName || u.email);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

interface CsvImportProps {
  onImport: (users: User[]) => void;
}

export function CsvImport({ onImport }: CsvImportProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<User[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
      if (parsed.length === 0) {
        toast({ title: "No valid rows found", description: "Check your CSV columns match the expected format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    onImport(preview);
    toast({ title: `${preview.length} contact${preview.length !== 1 ? "s" : ""} imported`, description: "They are now available in your contacts list." });
    setPreview([]);
    setFileName("");
  };

  const handleClear = () => {
    setPreview([]);
    setFileName("");
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      {preview.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-14 cursor-pointer transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"
          )}
        >
          <UploadCloud className={cn("h-10 w-10 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Drop your CSV here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Columns: firstName, lastName, email, linkedinUrl, roles, currentRole, currentCompany, industry
            </p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={onFileChange} />
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">{preview.length} contact{preview.length !== 1 ? "s" : ""} ready to import</p>
            </div>
            <button onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {["First", "Last", "Email", "LinkedIn", "Roles", "Current Role", "Company", "Industry"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 whitespace-nowrap">{u.firstName}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{u.lastName}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{u.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate">{u.linkedinUrl}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{u.roles.join(", ")}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{u.currentRole}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{u.currentCompany}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{u.industry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full">
            Import {preview.length} Contact{preview.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
