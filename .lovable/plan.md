
## Plan: Conditional Transcripts Tab UI

**Current behavior**: The Transcripts tab always shows both the upload area AND the chat input footer, regardless of whether any transcripts exist.

**Desired behavior**:
- **No transcripts uploaded** → Show a clean empty state ("No transcripts available") with just the upload area. No chatbot input at the bottom.
- **Transcripts uploaded** → Show the file list, the chat messages area, and the sticky chatbot input at the bottom.

### What to change in `ProfilePanel.tsx` (lines 484–617)

Replace the Transcripts `TabsContent` with two distinct layouts based on `transcripts.length`:

**Empty state (no transcripts)**:
- Centered empty state with a `FileText` or `Paperclip` icon, "No transcripts available" heading, and a sub-line like "Upload a PDF to start asking questions"
- A single upload drop zone / button
- Hidden file input
- **No chat input footer**

**Has transcripts**:
- Keep everything as-is: file list at top, scrollable chat area, sticky chat input footer at the bottom

The `input[type=file]` ref and upload handlers stay unchanged — only the rendered layout is conditional.
