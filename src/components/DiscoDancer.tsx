import { useState, useEffect } from "react";
import dancer from "@/assets/dancer-normal.png";

interface DiscoDancerProps {
  visible: boolean;
}

export function DiscoDancer({ visible }: DiscoDancerProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setIsFlipped((f) => !f), 350);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div
          className="flex flex-col items-center gap-4 select-none rounded-2xl px-10 py-8"
          style={{
            background: "hsl(var(--card) / 0.7)",
            border: "1px solid hsl(var(--border) / 0.5)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 40px hsl(280 90% 65% / 0.15), 0 2px 12px hsl(0 0% 0% / 0.08)",
          }}
        >
          {/* Dancer */}
          <div
            style={{
              transform: isFlipped ? "scaleX(-1)" : "scaleX(1)",
              filter:
                "drop-shadow(0 0 18px hsl(280 90% 65%)) drop-shadow(0 0 40px hsl(320 80% 60%))",
              transition: "transform 0.05s",
            }}
          >
            <img
              src={dancer}
              alt="loading"
              style={{
                width: "120px",
                display: "block",
                animation: "disco-bounce 0.7s ease-in-out infinite",
              }}
            />
          </div>

          {/* Colour dots */}
          <div
            className="flex gap-2.5"
            style={{ animation: "disco-lights 0.6s ease-in-out infinite alternate" }}
          >
            {[
              "hsl(320 90% 60%)",
              "hsl(45 100% 55%)",
              "hsl(195 100% 55%)",
              "hsl(130 80% 50%)",
              "hsl(260 90% 65%)",
            ].map((c, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: c,
                  boxShadow: `0 0 8px ${c}, 0 0 18px ${c}`,
                  animation: `disco-dot 0.6s ease-in-out ${i * 0.12}s infinite alternate`,
                }}
              />
            ))}
          </div>

          {/* Label */}
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase"
            style={{ animation: "disco-text 1s ease-in-out infinite alternate" }}
          >
            Finding your contacts…
          </p>
        </div>
      </div>

      <style>{`
        @keyframes disco-bounce {
          0%, 100% { transform: translateY(0px) rotate(-4deg) scale(1); }
          50%       { transform: translateY(-14px) rotate(4deg) scale(1.05); }
        }
        @keyframes disco-dot {
          from { opacity: 0.3; transform: scale(0.7); }
          to   { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes disco-lights {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(180deg); }
        }
        @keyframes disco-text {
          from { opacity: 0.4; letter-spacing: 0.1em; }
          to   { opacity: 1;   letter-spacing: 0.22em; }
        }
      `}</style>
    </>
  );
}
