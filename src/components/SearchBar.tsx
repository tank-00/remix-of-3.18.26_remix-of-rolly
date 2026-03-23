import { useState, KeyboardEvent, useEffect, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Suggestion pool & biasing logic ─────────────────────────────────────────

const SUGGESTION_POOL: string[] = [
  "title insurance expert",
  "operator in FinTech",
  "CEO for a customs brokerage platform",
  "angel investor for facility management tech",
  "AI infra engineer",
  "fintech operator",
  "SaaS founder",
  "go-to-market leader",
  "seed investor",
  "marketplace expert",
  "operators turned founders",
  "vertical SaaS builder",
  "supply chain operator",
  "PropTech investor",
  "B2B sales leader",
  "embedded finance expert",
  "climate tech founder",
  "healthcare SaaS operator",
  "logistics tech builder",
  "dev tools engineer",
  "enterprise software founder",
  "insurance tech expert",
  "seed-stage investor",
  "revenue leader in SaaS",
  "construction tech founder",
  "legal tech operator",
  "growth marketer",
  "Series A investor",
  "compliance expert in FinTech",
  "workforce tech founder",
  "CFO for early-stage startups",
  "real estate tech operator",
  "deep tech investor",
];

const TOPIC_CLUSTERS: Record<string, string[]> = {
  fintech: ["fintech operator", "embedded finance expert", "compliance expert in FinTech", "title insurance expert", "operator in FinTech"],
  saas: ["SaaS founder", "vertical SaaS builder", "enterprise software founder", "revenue leader in SaaS", "dev tools engineer"],
  ai: ["AI infra engineer", "dev tools engineer", "deep tech investor"],
  real_estate: ["title insurance expert", "PropTech investor", "real estate tech operator", "construction tech founder"],
  investing: ["seed investor", "angel investor for facility management tech", "Series A investor", "deep tech investor", "PropTech investor"],
  operations: ["operator in FinTech", "operators turned founders", "supply chain operator", "go-to-market leader", "B2B sales leader"],
};

function getAdjacentSuggestions(recentQueries: string[]): string[] {
  const hits: string[] = [];
  for (const q of recentQueries) {
    const lower = q.toLowerCase();
    for (const suggestions of Object.values(TOPIC_CLUSTERS)) {
      if (suggestions.some(s => s.toLowerCase().includes(lower)) || lower.split(" ").some(w => w.length > 3 && Object.keys(TOPIC_CLUSTERS).some(k => k.includes(w)))) {
        hits.push(...suggestions);
      }
    }
  }
  return hits;
}

function pickNextSuggestion(excluded: string, recentQueries: string[]): string {
  const adjacent = getAdjacentSuggestions(recentQueries);
  const available = SUGGESTION_POOL.filter(s => s !== excluded);

  const weighted: string[] = [];
  for (const s of available) {
    const weight = adjacent.includes(s) ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(s);
  }

  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  for (const s of shuffled) {
    if (s !== excluded) return s;
  }
  return available[0] ?? SUGGESTION_POOL[0];
}

// ── useTypewriterPlaceholder hook ────────────────────────────────────────────

type Phase = "typing" | "pausing" | "deleting" | "waiting";

function useTypewriterPlaceholder(recentQueries: string[]) {
  const [phrase, setPhrase] = useState(() => SUGGESTION_POOL[Math.floor(Math.random() * SUGGESTION_POOL.length)]);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  const phraseRef = useRef(phrase);
  phraseRef.current = phrase;
  const displayTextRef = useRef(displayText);
  displayTextRef.current = displayText;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const recentRef = useRef(recentQueries);
  recentRef.current = recentQueries;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback((fn: () => void, delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, delay);
  }, []);

  const tick = useCallback(() => {
    const p = phaseRef.current;
    const current = displayTextRef.current;
    const target = phraseRef.current;

    if (p === "typing") {
      if (current.length < target.length) {
        const next = target.slice(0, current.length + 1);
        setDisplayText(next);
        // jitter: 55–80ms per char
        schedule(tick, 55 + Math.random() * 25);
      } else {
        setPhase("pausing");
        phaseRef.current = "pausing";
        // hold: 1200–1600ms
        schedule(tick, 1200 + Math.random() * 400);
      }
    } else if (p === "pausing") {
      setPhase("deleting");
      phaseRef.current = "deleting";
      schedule(tick, 30 + Math.random() * 15);
    } else if (p === "deleting") {
      if (current.length > 0) {
        setDisplayText(current.slice(0, -1));
        // delete speed: 30–45ms per char
        schedule(tick, 30 + Math.random() * 15);
      } else {
        setPhase("waiting");
        phaseRef.current = "waiting";
        // wait gap: 350–500ms
        schedule(tick, 350 + Math.random() * 150);
      }
    } else if (p === "waiting") {
      const next = pickNextSuggestion(phraseRef.current, recentRef.current);
      setPhrase(next);
      phraseRef.current = next;
      setPhase("typing");
      phaseRef.current = "typing";
      schedule(tick, 55 + Math.random() * 25);
    }
  }, [schedule]);

  useEffect(() => {
    // small initial delay before starting
    schedule(tick, 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tick, schedule]);

  // Nudge on recent queries change
  useEffect(() => {
    if (recentQueries.length > 0 && phaseRef.current === "pausing") {
      setPhase("deleting");
      phaseRef.current = "deleting";
      schedule(tick, 100);
    }
  }, [recentQueries.length, tick, schedule]);

  return { displayText, phase };
}

// ── TypewriterOverlay component ──────────────────────────────────────────────

function TypewriterOverlay({
  displayText,
  phase,
  leftPad,
  fontSize,
  height,
  inputRef,
  showPrefix,
}: {
  displayText: string;
  phase: Phase;
  leftPad: string;
  fontSize: string;
  height: string;
  inputRef: React.RefObject<HTMLInputElement>;
  showPrefix?: boolean;
}) {
  const showCursor = phase === "typing" || phase === "pausing" || phase === "deleting" || phase === "waiting";

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center overflow-hidden"
      style={{ paddingLeft: leftPad, paddingRight: "0.75rem", height }}
      onClick={() => inputRef.current?.focus()}
    >
      <span
        className="select-none flex items-center min-w-0 w-full"
        style={{ fontSize }}
      >
        {showPrefix && (
          <span className="text-muted-foreground/50 font-normal shrink-0 whitespace-nowrap mr-1">
            Ask Rolly to find{" "}
          </span>
        )}
        <span className="text-muted-foreground whitespace-nowrap overflow-hidden">
          {displayText}
        </span>
        {showCursor && (
          <span
            className="text-muted-foreground/70 ml-px shrink-0"
            style={{
              animation: "tw-blink 0.65s steps(1) infinite",
              fontWeight: 300,
            }}
          >
            |
          </span>
        )}
      </span>
    </div>
  );
}

// ── SearchBar component ──────────────────────────────────────────────────────

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  compact?: boolean;
  landing?: boolean;
  recentQueries?: string[];
}

export function SearchBar({
  onSearch,
  initialValue = "",
  compact = false,
  landing = false,
  recentQueries = [],
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { displayText, phase } = useTypewriterPlaceholder(recentQueries);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSearch = () => onSearch(value);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const showOverlay = !focused && value === "";

  if (compact) {
    return (
      <div className="flex gap-2 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          {showOverlay && (
            <TypewriterOverlay
              displayText={displayText}
              phase={phase}
              leftPad="2.25rem"
              fontSize="0.875rem"
              height="2.5rem"
              inputRef={inputRef}
              showPrefix={false}
            />
          )}
          <Input
            ref={inputRef}
            className="pl-9 h-10 text-sm"
            placeholder=""
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <Button className="h-10 px-5 text-sm" onClick={handleSearch}>
          Search
        </Button>
      </div>
    );
  }

  if (landing) {
    return (
      <div className="flex gap-3 w-full">
        <div className="relative flex-1 min-w-0">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          {showOverlay && (
            <TypewriterOverlay
              displayText={displayText}
              phase={phase}
              leftPad="2.75rem"
              fontSize="1.0625rem"
              height="3.5rem"
              inputRef={inputRef}
              showPrefix={true}
            />
          )}
          <Input
            ref={inputRef}
            className="pl-11 h-14 text-base"
            placeholder=""
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <Button className="h-14 px-8 text-base shrink-0" onClick={handleSearch}>
          Search
        </Button>
      </div>
    );
  }

  // Default / sidebar (post-search) large variant — same proportions as landing
  return (
    <div className="flex gap-3">
      <div className="relative flex-1 min-w-0">
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        {showOverlay && (
          <TypewriterOverlay
            displayText={displayText}
            phase={phase}
            leftPad="2.75rem"
            fontSize="1.0625rem"
            height="3.5rem"
            inputRef={inputRef}
            showPrefix={true}
          />
        )}
        <Input
          ref={inputRef}
          className="pl-11 h-14 text-base"
          placeholder=""
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <Button className="h-14 px-8 text-base shrink-0" onClick={handleSearch}>
        Search
      </Button>
    </div>
  );
}
