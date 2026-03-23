import { useState } from "react";
import { ArrowLeft, List, Users, Download, Clock } from "lucide-react";
import { ContactList, User } from "@/types/contacts";
import { UserTable } from "@/components/UserTable";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MyListsViewProps {
  lists: ContactList[];
  allUsers: User[];
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

function exportListCsv(list: ContactList, allUsers: User[]) {
  const contacts = allUsers.filter((u) => list.contactIds.includes(u.id));
  const headers = ["firstName", "lastName", "email", "linkedinUrl", "roles", "currentRole", "currentCompany", "industry"];
  const rows = contacts.map((u) =>
    [u.firstName, u.lastName, u.email, u.linkedinUrl, u.roles.join(";"), u.currentRole, u.currentCompany, u.industry]
      .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${list.name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MyListsView({ lists, allUsers, onSelectUser, selectedUserId }: MyListsViewProps) {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [checkedListIds, setCheckedListIds] = useState<Set<string>>(new Set());

  const activeList = lists.find((l) => l.id === activeListId);
  const listContacts = activeList
    ? allUsers.filter((u) => activeList.contactIds.includes(u.id))
    : [];

  const allChecked = lists.length > 0 && lists.every((l) => checkedListIds.has(l.id));
  const someChecked = lists.some((l) => checkedListIds.has(l.id)) && !allChecked;

  function toggleCheck(id: string, checked: boolean) {
    setCheckedListIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setCheckedListIds(checked ? new Set(lists.map((l) => l.id)) : new Set());
  }

  if (activeList) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-border px-10 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setActiveListId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            My Lists
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{activeList.name}</span>
          <span className="ml-auto text-sm text-muted-foreground">
            {listContacts.length} contact{listContacts.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-6">
          {listContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No contacts in this list yet.</p>
            </div>
          ) : (
            <UserTable
              users={listContacts}
              hasSearched={true}
              onSelectUser={onSelectUser}
              selectedUserId={selectedUserId}
              checkedIds={new Set()}
              onCheckChange={() => {}}
              onCheckAll={() => {}}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        <div className="mb-6 flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-foreground">My Lists</h1>
          {lists.length > 0 && (
            <span className="text-sm text-muted-foreground">{lists.length}</span>
          )}
        </div>

        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3 rounded-2xl border border-dashed border-border">
            <List className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No lists yet. Select contacts and use "Add to List" to create one.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={allChecked}
                      data-state={someChecked ? "indeterminate" : allChecked ? "checked" : "unchecked"}
                      onCheckedChange={(v) => toggleAll(!!v)}
                      aria-label="Select all"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wide text-xs">
                    List Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wide text-xs">
                    # of Records
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wide text-xs">
                    Last Modified ↓
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wide text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list, i) => {
                  const isChecked = checkedListIds.has(list.id);
                  return (
                    <tr
                      key={list.id}
                      onClick={() => setActiveListId(list.id)}
                      className={cn(
                        "border-b border-border last:border-0 cursor-pointer transition-colors",
                        i % 2 === 1 ? "bg-muted/10" : "bg-background",
                        isChecked ? "bg-accent/40" : "hover:bg-muted/30"
                      )}
                    >
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(v) => toggleCheck(list.id, !!v)}
                          aria-label={`Select ${list.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground underline underline-offset-2 font-medium hover:text-primary transition-colors">
                          {list.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {list.contactIds.length}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => exportListCsv(list, allUsers)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          aria-label="Download CSV"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
