import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User } from "@/types/contacts";
import { roleColors } from "@/components/RoleFilter";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface UserTableProps {
  users: User[];
  hasSearched: boolean;
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
  checkedIds: Set<string>;
  onCheckChange: (userId: string, checked: boolean) => void;
  onCheckAll: (checked: boolean) => void;
}

export function UserTable({
  users,
  hasSearched,
  onSelectUser,
  selectedUserId,
  checkedIds,
  onCheckChange,
  onCheckAll,
}: UserTableProps) {
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">Search your contacts</p>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a name, role, company, or industry above to get started.
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">No contacts found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  const allChecked = users.length > 0 && users.every((u) => checkedIds.has(u.id));
  const someChecked = users.some((u) => checkedIds.has(u.id)) && !allChecked;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="w-10 px-4 py-3">
              <Checkbox
                checked={allChecked}
                data-state={someChecked ? "indeterminate" : allChecked ? "checked" : "unchecked"}
                onCheckedChange={(v) => onCheckAll(!!v)}
                aria-label="Select all"
                onClick={(e) => e.stopPropagation()}
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Industry</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">25m Vertical</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Updated</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">LinkedIn</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => {
            const isChecked = checkedIds.has(user.id);
            return (
              <tr
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={cn(
                  "border-b border-border cursor-pointer transition-colors",
                  i % 2 === 1 ? "bg-muted/20" : "bg-background",
                  isChecked
                    ? "bg-accent/60"
                    : selectedUserId === user.id
                    ? "bg-accent"
                    : "hover:bg-muted/40"
                )}
              >
                <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(v) => onCheckChange(user.id, !!v)}
                    aria-label={`Select ${user.firstName} ${user.lastName}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.currentRole}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                          roleColors[role]
                        )}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.currentCompany}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.industry}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.vertical ?? <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(user.lastUpdated), { addSuffix: true })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
