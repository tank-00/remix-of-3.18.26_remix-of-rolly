import shell from "@/assets/spiral-shell.png";

export function ShellSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 select-none flex-1 min-h-full">
      <div
        style={{
          borderRadius: "50%",
          overflow: "hidden",
          width: 160,
          height: 160,
          animation: "shell-spin 2.4s linear infinite",
          boxShadow:
            "0 0 32px hsl(30 80% 40% / 0.5), 0 0 64px hsl(20 70% 30% / 0.3)",
        }}
      >
        <img
          src={shell}
          alt="loading"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <p
        className="text-sm text-muted-foreground tracking-widest uppercase"
        style={{ animation: "disco-text 1s ease-in-out infinite alternate" }}
      >
        🐚 Finding your contacts…
      </p>

      <style>{`
        @keyframes shell-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes disco-text {
          from { opacity: 0.4; letter-spacing: 0.1em; }
          to   { opacity: 1;   letter-spacing: 0.22em; }
        }
      `}</style>
    </div>
  );
}
