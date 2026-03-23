import { useState, useRef, useEffect } from "react";
import { X, ExternalLink, Send, RefreshCw, AlertTriangle, Clock, FileText, Upload, Bot, Loader2, Paperclip } from "lucide-react";
import { User, Note } from "@/types/contacts";
import { roleColors } from "@/components/RoleFilter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { CURRENT_USER_ID } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Transcript {
  id: string;
  name: string;
  uploadedAt: string;
  text: string;
  dataUrl: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(user: User) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const avatarPalette = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function authorColor(userId: string) {
  const idx = userId.charCodeAt(userId.length - 1) % avatarPalette.length;
  return avatarPalette[idx];
}

const STARTER_PROMPTS = [
  "Summarize the key points",
  "What were the action items?",
  "What did they say about pricing?",
];

// ── Component ──────────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  user: User;
  notes: Note[];
  allUsers: User[];
  onClose: () => void;
  onAddNote: (contactId: string, text: string) => void;
  onRefresh: (userId: string) => Promise<void>;
}

export function ProfilePanel({ user, notes, allUsers, onClose, onAddNote, onRefresh }: ProfilePanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "transcripts">("details");

  // Notes state
  const [noteText, setNoteText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);

  // Transcripts state
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Reset chat when user changes
  useEffect(() => {
    setChatMessages([]);
    setTranscripts([]);
    setChatInput("");
  }, [user.id]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u]));

  // ── Notes handlers ────────────────────────────────────────────────────────

  const handleNoteSubmit = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    onAddNote(user.id, trimmed);
    setNoteText("");
  };

  const handleRefreshClick = () => setShowRefreshWarning(true);

  const handleRefreshConfirm = async () => {
    setShowRefreshWarning(false);
    setIsRefreshing(true);
    try {
      await onRefresh(user.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Transcript handlers ───────────────────────────────────────────────────

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload PDF files only.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Try to extract text — for native PDFs some text is in the binary; for scanned PDFs it won't work
        // We store the dataUrl for preview and a placeholder text until a richer extractor is added
        const newTranscript: Transcript = {
          id: `transcript-${Date.now()}-${Math.random()}`,
          name: file.name,
          uploadedAt: new Date().toISOString(),
          text: `[PDF: ${file.name}] — text extraction requires server-side processing. The AI will reference this document by name.`,
          dataUrl,
        };
        setTranscripts((prev) => [...prev, newTranscript]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleViewTranscript = (t: Transcript) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${t.dataUrl}" style="width:100%;height:100vh;border:none;" />`);
    }
  };

  // ── Chat handlers ─────────────────────────────────────────────────────────

  const sendChatMessage = async (content: string) => {
    if (!content.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: "user", content };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    const transcriptContext = transcripts.length > 0
      ? transcripts.map((t) => `=== ${t.name} ===\n${t.text}`).join("\n\n")
      : "No transcripts uploaded yet.";

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Fallback: show a helpful message if Cloud isn't enabled yet
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "The AI chatbot requires Lovable Cloud to be enabled. Please connect it in your project settings to start chatting about transcripts.",
          },
        ]);
        setIsChatLoading(false);
        return;
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/transcript-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          transcriptContext,
          contactName: `${user.firstName} ${user.lastName}`,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
        if (resp.status === 402) throw new Error("AI usage credits exhausted. Please top up in workspace settings.");
        throw new Error("Failed to get a response from the AI.");
      }

      // Stream the response token by token
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Add empty assistant message placeholder
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Chat error", description: msg, variant: "destructive" });
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Refresh warning dialog */}
      {showRefreshWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Use API credits?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Refreshing will use API credits. Only use this if you think this contact's information is outdated.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRefreshWarning(false)}>Cancel</Button>
              <Button size="sm" onClick={handleRefreshConfirm}>Refresh</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b border-border px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold shrink-0", authorColor(user.id))}>
            {getInitials(user)}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.currentRole} · {user.currentCompany}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh profile"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0 shrink-0">
          <TabsTrigger
            value="details"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 text-xs font-medium"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 text-xs font-medium"
          >
            Notes{notes.length > 0 && <span className="ml-1 text-muted-foreground">({notes.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="transcripts"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 text-xs font-medium"
          >
            Transcripts{transcripts.length > 0 && <span className="ml-1 text-muted-foreground">({transcripts.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="flex flex-col flex-1 overflow-hidden mt-0">
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
          {/* Primary */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Profile</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Role(s)</dt>
                <dd className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <span key={role} className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", roleColors[role])}>
                      {role}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Title</dt>
                <dd className="text-foreground text-xs">{user.currentRole}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Company</dt>
                <dd className="text-foreground text-xs">{user.currentCompany}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Industry</dt>
                <dd className="text-foreground text-xs">{user.industry}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Location</dt>
                <dd className="text-foreground text-xs text-muted-foreground">—</dd>
              </div>
            </dl>
          </section>

          <div className="h-px bg-border" />

          {/* Contact */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Contact</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Email</dt>
                <dd className="text-foreground text-xs break-all">{user.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">LinkedIn</dt>
                <dd>
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    View profile <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <div className="h-px bg-border" />

          {/* Meta */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Meta</h3>
            <dl className="space-y-2">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground text-xs">Last updated</dt>
                <dd className="text-foreground text-xs inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {formatDistanceToNow(new Date(user.lastUpdated), { addSuffix: true })}
                </dd>
              </div>
            </dl>
          </section>
          </div>
        </TabsContent>

        {/* ── Notes Tab ── */}
        <TabsContent value="notes" className="flex flex-col flex-1 overflow-hidden mt-0">
          {/* Scrollable notes list */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No notes yet. Add the first one below.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const author = userMap[note.authorId];
                  const isCurrentUser = note.authorId === CURRENT_USER_ID;
                  return (
                    <div key={note.id} className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm text-foreground leading-relaxed">{note.text}</p>
                      <div className="mt-3 flex items-center gap-2">
                        {author && (
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold shrink-0", authorColor(author.id))}>
                            {getInitials(author)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {author ? (
                            <span className="font-medium text-foreground">
                              {isCurrentUser ? "You" : `${author.firstName} ${author.lastName}`}
                            </span>
                          ) : (
                            <span className="italic">Unknown</span>
                          )}
                          <span>·</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add note footer — pinned to bottom */}
          <div className="border-t border-border px-5 py-2 flex gap-2 shrink-0 bg-background">
            <Textarea
              placeholder="Add a note…"
              className="resize-none text-xs min-h-[40px] max-h-[100px]"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNoteSubmit(); }}
            />
            <Button size="sm" className="self-end shrink-0" onClick={handleNoteSubmit} disabled={!noteText.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>

        {/* ── Transcripts Tab ── */}
        <TabsContent value="transcripts" className="flex flex-col flex-1 overflow-hidden mt-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          {transcripts.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center px-6 pt-4 text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <FileText className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No transcripts available</p>
                <p className="text-xs text-muted-foreground">Upload a PDF to start asking questions about this contact.</p>
              </div>
              <div
                className="w-full flex items-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground flex-1 text-left">Drop PDFs here or click to upload</p>
                <span className="text-[10px] font-medium text-primary shrink-0">+ Upload PDF</span>
              </div>
            </div>
          ) : (
            /* ── Has transcripts: file list + chat ── */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {/* Upload strip */}
                <div
                  className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">Drop PDFs here or click to upload</p>
                  <span className="text-[10px] font-medium text-primary shrink-0">+ Upload PDF</span>
                </div>

                {/* File list */}
                <div className="space-y-1.5">
                  {transcripts.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(t.uploadedAt)}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={() => handleViewTranscript(t)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border" />

                {/* Chat messages or starter prompts */}
                {chatMessages.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Suggested questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendChatMessage(prompt)}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mr-2 mt-0.5">
                          <Bot className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {msg.content || (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && chatMessages[chatMessages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mr-2">
                      <Bot className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat input — pinned to bottom */}
              <div className="border-t border-border px-5 py-4 pb-6 flex gap-2 shrink-0 bg-background">
                <Textarea
                  placeholder="Ask a question…"
                  className="resize-none text-xs min-h-[40px] max-h-[100px]"
                  value={chatInput}
                  disabled={isChatLoading}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage(chatInput);
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="self-end shrink-0"
                  disabled={!chatInput.trim() || isChatLoading}
                  onClick={() => sendChatMessage(chatInput)}
                >
                  {isChatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
