import { useState, useCallback } from "react";
import { UserPlus, List } from "lucide-react";
import { User, Note, Role, Vertical, ContactList } from "@/types/contacts";
import {
  mockUsers,
  mockNotes,
  mockSearch,
  CURRENT_USER_ID,
} from "@/data/mockData";
import { SearchBar } from "@/components/SearchBar";
import { RoleFilter, VerticalFilter } from "@/components/RoleFilter";
import { UserTable } from "@/components/UserTable";
import { ProfilePanel } from "@/components/ProfilePanel";
import { AddContactForm } from "@/components/AddContactForm";
import { CsvImport } from "@/components/CsvImport";
import { FloatingActionBar } from "@/components/FloatingActionBar";
import { AddToListModal } from "@/components/AddToListModal";
import { MyListsView } from "@/components/MyListsView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DiscoDancer } from "@/components/DiscoDancer";

type AppTab = "contacts" | "add-contact" | "my-lists";

export default function Index() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [query, setQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedVerticals, setSelectedVerticals] = useState<Vertical[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isDancing, setIsDancing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<AppTab>("contacts");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [addToListOpen, setAddToListOpen] = useState(false);

  const handleReset = useCallback(() => {
    setQuery("");
    setSelectedRoles([]);
    setSelectedVerticals([]);
    setHasSearched(false);
    setResults([]);
    setSelectedUser(null);
    setCheckedIds(new Set());
    setIsDancing(false);
    setSearchKey((k) => k + 1);
    setActiveTab("contacts");
  }, []);

  const handleBrowseAll = useCallback(() => {
    setActiveTab("contacts");
    setQuery("");
    setSelectedRoles([]);
    setSelectedVerticals([]);
    setResults(users);
    setHasSearched(true);
    setSelectedUser(null);
    setCheckedIds(new Set());
    setIsDancing(false);
    setSearchKey((k) => k + 1);
  }, [users]);

  const handleSearch = useCallback(
    (q: string, roles?: Role[]) => {
      const activeRoles = roles ?? selectedRoles;
      setQuery(q);
      setCheckedIds(new Set());
      setIsDancing(true);
      setHasSearched(false);
      
      if (q.trim()) {
        setRecentQueries((prev) => [q, ...prev.filter((r) => r !== q)].slice(0, 5));
      }
      setTimeout(() => {
        setResults(mockSearch(q, activeRoles, users, selectedVerticals));
        setHasSearched(true);
        setIsDancing(false);
      }, 5000);
    },
    [selectedRoles, selectedVerticals, users]
  );

  const handleRoleChange = useCallback(
    (roles: Role[]) => {
      setSelectedRoles(roles);
      if (hasSearched) {
        setResults(mockSearch(query, roles, users, selectedVerticals));
        setCheckedIds(new Set());
      }
    },
    [hasSearched, query, users, selectedVerticals]
  );

  const handleVerticalChange = useCallback(
    (verticals: Vertical[]) => {
      setSelectedVerticals(verticals);
      if (hasSearched) {
        setResults(mockSearch(query, selectedRoles, users, verticals));
        setCheckedIds(new Set());
      }
    },
    [hasSearched, query, selectedRoles, users]
  );

  const handleRefreshUser = useCallback(async (userId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const now = new Date().toISOString();
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, lastUpdated: now } : u)));
    setResults((prev) => prev.map((u) => (u.id === userId ? { ...u, lastUpdated: now } : u)));
    setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, lastUpdated: now } : prev));
    toast({ title: "Profile refreshed", description: "Latest data loaded for this contact." });
  }, [toast]);

  const handleAddNote = useCallback((contactId: string, text: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      contactId,
      authorId: CURRENT_USER_ID,
      text,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, newNote]);
  }, []);

  const handleCheckChange = useCallback((userId: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(userId) : next.delete(userId);
      return next;
    });
  }, []);

  const handleCheckAll = useCallback(
    (checked: boolean) => {
      setCheckedIds(checked ? new Set(results.map((u) => u.id)) : new Set());
    },
    [results]
  );

  const handleAddContact = useCallback((user: User) => {
    setUsers((prev) => [user, ...prev]);
  }, []);

  const handleImportContacts = useCallback((newUsers: User[]) => {
    setUsers((prev) => [...newUsers, ...prev]);
  }, []);

  const handleAddToExistingList = useCallback(
    (listId: string) => {
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== listId) return l;
          const merged = Array.from(new Set([...l.contactIds, ...Array.from(checkedIds)]));
          return { ...l, contactIds: merged };
        })
      );
      const list = lists.find((l) => l.id === listId);
      toast({
        title: "Added to list",
        description: `${checkedIds.size} contact${checkedIds.size !== 1 ? "s" : ""} added to "${list?.name}".`,
      });
    },
    [checkedIds, lists, toast]
  );

  const handleCreateAndAddList = useCallback(
    (name: string) => {
      const newList: ContactList = {
        id: `list-${Date.now()}`,
        name,
        contactIds: Array.from(checkedIds),
        createdAt: new Date().toISOString(),
      };
      setLists((prev) => [...prev, newList]);
      toast({
        title: "List created",
        description: `"${name}" created with ${checkedIds.size} contact${checkedIds.size !== 1 ? "s" : ""}.`,
      });
    },
    [checkedIds, toast]
  );

  const contactNotes = selectedUser
    ? notes.filter((n) => n.contactId === selectedUser.id)
    : [];

  const checkedUsers = users.filter((u) => checkedIds.has(u.id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="w-full flex items-center justify-between gap-4 px-10 py-4">
          {/* Left: logo + nav */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={handleReset}
              className="font-serif text-3xl font-black tracking-tight text-foreground hover:opacity-80 transition-opacity leading-none"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 900 }}
            >
              25madison
            </button>
            <span className="h-7 w-px bg-border" />
            <nav className="flex items-center gap-1">
              <button
                onClick={handleBrowseAll}
                className={cn(
                  "px-4 py-2 text-lg font-medium rounded-md transition-colors",
                  activeTab === "contacts"
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Contacts
              </button>
            </nav>
          </div>

          {/* Right: My Lists + Add Contact */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("my-lists")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-lg font-medium rounded-md transition-colors",
                activeTab === "my-lists"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <List className="h-5 w-5" />
              My Lists
              {lists.length > 0 && (
                <span className="ml-0.5 text-xs font-semibold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                  {lists.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("add-contact")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-lg font-medium rounded-md transition-colors",
                activeTab === "add-contact"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <UserPlus className="h-5 w-5" />
              Add Contact
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      {activeTab === "my-lists" ? (
        <MyListsView
          lists={lists}
          allUsers={users}
          onSelectUser={setSelectedUser}
          selectedUserId={selectedUser?.id}
        />
      ) : activeTab === "add-contact" ? (
        /* ── Add Contact page ── */
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-10">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Add Contact</h1>
              <p className="text-sm text-muted-foreground mt-1">Manually enter a contact or bulk import via CSV.</p>
            </div>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="mb-3">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">CSV Import</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                  <AddContactForm onAddContact={handleAddContact} />
                </div>
              </TabsContent>
              <TabsContent value="csv">
                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                  <CsvImport onImport={handleImportContacts} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex flex-1">
          <main className="flex-1 overflow-hidden flex flex-col">
            {!hasSearched && !isDancing ? (
              /* ── Pre-search: clean landing ── */
              <div className="flex items-center justify-center min-h-full px-8 py-16">
                <div className="w-full max-w-2xl space-y-5">
                  <div className="space-y-3 w-full text-center">
                    <h1 className="text-5xl font-semibold text-foreground w-full whitespace-nowrap">What are you looking for?</h1>
                    <p className="text-xl text-muted-foreground w-full">Tap into 25madison's <strong>rolodex</strong> to surface the right connections</p>
                  </div>
                  <SearchBar key={searchKey} onSearch={handleSearch} initialValue={query} landing recentQueries={recentQueries} />
                </div>
              </div>
            ) : isDancing ? (
              /* ── Loading: show landing beneath the overlay ── */
              <div className="flex items-center justify-center min-h-full px-8 py-16">
                <div className="w-full max-w-2xl space-y-5">
                  <div className="space-y-3 w-full text-center">
                    <h1 className="text-5xl font-semibold text-foreground w-full whitespace-nowrap">What are you looking for?</h1>
                    <p className="text-xl text-muted-foreground w-full">Tap into 25madison's <strong>rolodex</strong> to surface the right connections</p>
                  </div>
                  <SearchBar key={searchKey} onSearch={handleSearch} initialValue={query} landing recentQueries={recentQueries} />
                </div>
              </div>
            ) : (
              /* ── Post-search: sidebar + results ── */
              <div className="flex h-full animate-fade-in">
                {/* Left: search sidebar */}
                <aside className="w-[320px] shrink-0 border-r border-border overflow-y-auto px-5 py-6 space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      What are you looking for?
                    </label>
                    <SearchBar key={searchKey} onSearch={handleSearch} initialValue={query} compact recentQueries={recentQueries} />
                  </div>
                  <RoleFilter selected={selectedRoles} onChange={handleRoleChange} />
                  <VerticalFilter selected={selectedVerticals} onChange={handleVerticalChange} />
                </aside>

                {/* Right: scrollable results */}
                <div className="flex-1 px-6 py-6 pb-24">
                  <UserTable
                    users={results}
                    hasSearched={hasSearched}
                    onSelectUser={setSelectedUser}
                    selectedUserId={selectedUser?.id}
                    checkedIds={checkedIds}
                    onCheckChange={handleCheckChange}
                    onCheckAll={handleCheckAll}
                  />
                </div>
              </div>
            )}
          </main>

          {/* Profile side panel */}
          {selectedUser && (
            <aside className="w-[420px] shrink-0 border-l border-border flex flex-col shadow-lg sticky top-0 h-screen overflow-hidden">
              <ProfilePanel
                user={selectedUser}
                notes={contactNotes}
                allUsers={users}
                onClose={() => setSelectedUser(null)}
                onAddNote={handleAddNote}
                onRefresh={handleRefreshUser}
              />
            </aside>
          )}
        </div>
      )}

      {/* Disco Dancer loading overlay */}
      <DiscoDancer visible={isDancing} />

      {/* Floating Action Bar */}
      <FloatingActionBar
        selectedCount={checkedIds.size}
        selectedUsers={checkedUsers}
        onClear={() => setCheckedIds(new Set())}
        onAddToList={() => setAddToListOpen(true)}
      />

      {/* Add to List Modal */}
      <AddToListModal
        open={addToListOpen}
        onOpenChange={setAddToListOpen}
        lists={lists}
        selectedCount={checkedIds.size}
        onAddToExistingList={handleAddToExistingList}
        onCreateAndAddList={handleCreateAndAddList}
      />
    </div>
  );
}
