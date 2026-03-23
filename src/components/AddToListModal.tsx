import { useState } from "react";
import { Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactList } from "@/types/contacts";
import { cn } from "@/lib/utils";

interface AddToListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: ContactList[];
  selectedCount: number;
  onAddToExistingList: (listId: string) => void;
  onCreateAndAddList: (name: string) => void;
}

export function AddToListModal({
  open,
  onOpenChange,
  lists,
  selectedCount,
  onAddToExistingList,
  onCreateAndAddList,
}: AddToListModalProps) {
  const [showNewInput, setShowNewInput] = useState(false);
  const [newListName, setNewListName] = useState("");

  const handleCreateAndAdd = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    onCreateAndAddList(trimmed);
    setNewListName("");
    setShowNewInput(false);
    onOpenChange(false);
  };

  const handleAddToExisting = (listId: string) => {
    onAddToExistingList(listId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          Adding {selectedCount} contact{selectedCount !== 1 ? "s" : ""} to a list.
        </p>

        <div className="space-y-1 mt-1">
          {lists.length === 0 && !showNewInput && (
            <p className="text-sm text-muted-foreground py-2">No lists yet — create one below.</p>
          )}

          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleAddToExisting(list.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left"
            >
              <span className="font-medium text-foreground">{list.name}</span>
              <span className="text-muted-foreground text-xs">
                {list.contactIds.length} contact{list.contactIds.length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>

        {/* Create new list */}
        <div className="border-t border-border pt-3 mt-1">
          {!showNewInput ? (
            <button
              onClick={() => setShowNewInput(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create new list
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleCreateAndAdd} disabled={!newListName.trim()} className="h-8 px-3 gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
