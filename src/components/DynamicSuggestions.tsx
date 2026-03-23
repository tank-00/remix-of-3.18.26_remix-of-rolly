import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const SUGGESTION_POOL: string[] = [
  "Title insurance expert",
  "Operator in FinTech",
  "CEO for a customs brokerage platform",
  "Angel investor for Facility Management tech",
  "AI infra engineer",
  "Fintech operator",
  "SaaS founder",
  "Go-to-market leader",
  "Seed investor",
  "Marketplace expert",
  "Operators turned founders",
  "Vertical SaaS builder",
  "Supply chain operator",
  "PropTech investor",
  "B2B sales leader",
  "Embedded finance expert",
  "Climate tech founder",
  "Healthcare SaaS operator",
  "Logistics tech builder",
  "Dev tools engineer",
  "Enterprise software founder",
  "Insurance tech expert",
  "Seed-stage investor",
  "Revenue leader in SaaS",
  "Construction tech founder",
  "Legal tech operator",
  "Growth marketer",
  "Series A investor",
  "Compliance expert in FinTech",
  "Workforce tech founder",
  "CFO for early-stage startups",
  "Real estate tech operator",
  "Deep tech investor",
];

// Topic clusters for adjacency biasing
const TOPIC_CLUSTERS: Record<string, string[]> = {
  fintech: ["Fintech operator", "Embedded finance expert", "Compliance expert in FinTech", "Title insurance expert", "Operator in FinTech"],
  saas: ["SaaS founder", "Vertical SaaS builder", "Enterprise software founder", "Revenue leader in SaaS", "Dev tools engineer"],
  ai: ["AI infra engineer", "Dev tools engineer", "Deep tech investor"],
  real_estate: ["Title insurance expert", "PropTech investor", "Real estate tech operator", "Construction tech founder"],
  investing: ["Seed investor", "Angel investor for Facility Management tech", "Series A investor", "Deep tech investor", "PropTech investor"],
  operations: ["Operator in FinTech", "Operators turned founders", "Supply chain operator", "Go-to-market leader", "B2B sales leader"],
};

function getAdjacentTopics(query: string): string[] {
  const q = query.toLowerCase();
  for (const [topic, suggestions] of Object.entries(TOPIC_CLUSTERS)) {
    if (q.includes(topic) || suggestions.some(s => s.toLowerCase().includes(q))) {
      return suggestions;
    }
  }
  return [];
}

function pickSuggestions(
  count: number,
  recentQueries: string[],
  excluded: string[]
): string[] {
  // Build a weighted pool
  const adjacent = recentQueries.flatMap(q => getAdjacentTopics(q));
  const available = SUGGESTION_POOL.filter(s => !excluded.includes(s));

  // Weight: adjacent suggestions appear 3x more likely
  const weighted: string[] = [];
  for (const s of available) {
    const weight = adjacent.includes(s) ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(s);
  }

  const picked: string[] = [];
  const seen = new Set<string>();
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);

  for (const s of shuffled) {
    if (!seen.has(s) && picked.length < count) {
      seen.add(s);
      picked.push(s);
    }
  }

  // Pad with random if not enough
  for (const s of SUGGESTION_POOL) {
    if (!seen.has(s) && picked.length < count) {
      seen.add(s);
      picked.push(s);
    }
  }

  return picked;
}

interface SuggestionChip {
  id: number;
  text: string;
  state: "visible" | "exiting" | "entering";
}

interface DynamicSuggestionsProps {
  onSelect: (query: string) => void;
  recentQueries?: string[];
  compact?: boolean;
}

let idCounter = 0;

export function DynamicSuggestions({ onSelect, recentQueries = [], compact = false }: DynamicSuggestionsProps) {
  const VISIBLE_COUNT = compact ? 4 : 6;
  const REPLACE_COUNT = 2; // how many to swap per rotation

  const [chips, setChips] = useState<SuggestionChip[]>(() =>
    pickSuggestions(VISIBLE_COUNT, [], []).map(text => ({
      id: idCounter++,
      text,
      state: "visible" as const,
    }))
  );

  const chipsRef = useRef(chips);
  chipsRef.current = chips;
  const recentRef = useRef(recentQueries);
  recentRef.current = recentQueries;

  const rotate = useCallback(() => {
    const current = chipsRef.current;
    const visibleChips = current.filter(c => c.state === "visible");
    if (visibleChips.length < VISIBLE_COUNT) return;

    // Pick random indices to replace
    const indices = [...Array(visibleChips.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, REPLACE_COUNT);

    const exitingTexts = indices.map(i => visibleChips[i].text);
    const newTexts = pickSuggestions(REPLACE_COUNT, recentRef.current, current.map(c => c.text));

    // Mark exiting
    setChips(prev =>
      prev.map(c =>
        exitingTexts.includes(c.text) ? { ...c, state: "exiting" as const } : c
      )
    );

    // After exit animation, replace with entering
    setTimeout(() => {
      setChips(prev => {
        const next = [...prev];
        let newIdx = 0;
        for (let i = 0; i < next.length; i++) {
          if (next[i].state === "exiting" && newIdx < newTexts.length) {
            next[i] = { id: idCounter++, text: newTexts[newIdx++], state: "entering" };
          }
        }
        return next;
      });

      // Transition entering → visible
      setTimeout(() => {
        setChips(prev =>
          prev.map(c => c.state === "entering" ? { ...c, state: "visible" } : c)
        );
      }, 50);
    }, 300);
  }, [VISIBLE_COUNT]);

  useEffect(() => {
    const delay = 3000 + Math.random() * 2000; // 3-5s
    const timer = setInterval(rotate, delay);
    return () => clearInterval(timer);
  }, [rotate]);

  // Re-seed when recentQueries changes significantly
  useEffect(() => {
    if (recentQueries.length > 0) {
      // Nudge a rotation immediately
      const t = setTimeout(rotate, 800);
      return () => clearTimeout(t);
    }
  }, [recentQueries.length, rotate]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "" : "")}>
      {!compact && (
        <span className="text-sm text-muted-foreground shrink-0">Try:</span>
      )}
      {chips.map(chip => (
        <button
          key={chip.id}
          onClick={() => chip.state === "visible" && onSelect(chip.text)}
          style={{
            opacity: chip.state === "exiting" ? 0 : chip.state === "entering" ? 0 : 1,
            transform:
              chip.state === "exiting"
                ? "translateY(-4px) scale(0.95)"
                : chip.state === "entering"
                ? "translateY(4px) scale(0.95)"
                : "translateY(0) scale(1)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
            pointerEvents: chip.state === "visible" ? "auto" : "none",
          }}
          className={cn(
            "rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors shrink-0",
            compact ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
          )}
        >
          {chip.text}
        </button>
      ))}
    </div>
  );
}
