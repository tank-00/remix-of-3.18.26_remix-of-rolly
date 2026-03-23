import { X } from "lucide-react";
import { Role, Vertical } from "@/types/contacts";
import { cn } from "@/lib/utils";

const ALL_ROLES: Role[] = ["operator", "founder", "technical", "investor", "expert", "angel"];

const roleColors: Record<Role, string> = {
  operator: "bg-blue-100 text-blue-800 border-blue-200",
  founder: "bg-purple-100 text-purple-800 border-purple-200",
  technical: "bg-emerald-100 text-emerald-800 border-emerald-200",
  investor: "bg-amber-100 text-amber-800 border-amber-200",
  expert: "bg-cyan-100 text-cyan-800 border-cyan-200",
  angel: "bg-rose-100 text-rose-800 border-rose-200",
};

const roleActiveColors: Record<Role, string> = {
  operator: "bg-blue-600 text-white border-blue-600",
  founder: "bg-purple-600 text-white border-purple-600",
  technical: "bg-emerald-600 text-white border-emerald-600",
  investor: "bg-amber-500 text-white border-amber-500",
  expert: "bg-cyan-600 text-white border-cyan-600",
  angel: "bg-rose-600 text-white border-rose-600",
};

interface RoleFilterProps {
  selected: Role[];
  onChange: (roles: Role[]) => void;
}

export function RoleFilter({ selected, onChange }: RoleFilterProps) {
  const toggle = (role: Role) => {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Filter by role:</span>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ALL_ROLES.map((role) => {
          const isActive = selected.includes(role);
          return (
            <button
              key={role}
              onClick={() => toggle(role)}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-medium capitalize transition-colors",
                isActive ? roleActiveColors[role] : roleColors[role],
                "hover:opacity-80"
              )}
            >
              {role}
              <X className={cn("h-3 w-3 transition-opacity shrink-0", isActive ? "opacity-100" : "opacity-0")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Vertical Filter ──────────────────────────────────────────────

const ALL_VERTICALS: Vertical[] = ["Evolve", "Health", "Ventures", "Sift", "Platform", "Creature", "Propel", "ASTRA"];

const verticalColors: Record<Vertical, string> = {
  Evolve:   "bg-teal-100 text-teal-800 border-teal-200",
  Health:   "bg-green-100 text-green-800 border-green-200",
  Ventures: "bg-violet-100 text-violet-800 border-violet-200",
  Sift:     "bg-orange-100 text-orange-800 border-orange-200",
  Platform: "bg-sky-100 text-sky-800 border-sky-200",
  Creature: "bg-lime-100 text-lime-800 border-lime-200",
  Propel:   "bg-pink-100 text-pink-800 border-pink-200",
  ASTRA:    "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const verticalActiveColors: Record<Vertical, string> = {
  Evolve:   "bg-teal-600 text-white border-teal-600",
  Health:   "bg-green-600 text-white border-green-600",
  Ventures: "bg-violet-600 text-white border-violet-600",
  Sift:     "bg-orange-500 text-white border-orange-500",
  Platform: "bg-sky-600 text-white border-sky-600",
  Creature: "bg-lime-600 text-white border-lime-600",
  Propel:   "bg-pink-600 text-white border-pink-600",
  ASTRA:    "bg-indigo-600 text-white border-indigo-600",
};

interface VerticalFilterProps {
  selected: Vertical[];
  onChange: (verticals: Vertical[]) => void;
}

export function VerticalFilter({ selected, onChange }: VerticalFilterProps) {
  const toggle = (v: Vertical) => {
    if (selected.includes(v)) {
      onChange(selected.filter((x) => x !== v));
    } else {
      onChange([...selected, v]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Filter by vertical:</span>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ALL_VERTICALS.map((v) => {
          const isActive = selected.includes(v);
          return (
            <button
              key={v}
              onClick={() => toggle(v)}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                isActive ? verticalActiveColors[v] : verticalColors[v],
                "hover:opacity-80"
              )}
            >
              {v}
              <X className={cn("h-3 w-3 transition-opacity shrink-0", isActive ? "opacity-100" : "opacity-0")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { roleColors, roleActiveColors, ALL_ROLES, ALL_VERTICALS, verticalColors };
