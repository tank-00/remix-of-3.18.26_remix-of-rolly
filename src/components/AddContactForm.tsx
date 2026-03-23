import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronDown } from "lucide-react";
import { User, Role, Vertical } from "@/types/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ALL_ROLES: Role[] = ["operator", "founder", "technical", "investor", "expert", "angel"];
const ALL_VERTICALS: Vertical[] = ["Evolve", "Health", "Ventures", "Sift", "Platform", "Creature", "Propel", "ASTRA"];

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email("Valid email required").max(255),
  linkedinUrl: z.string().min(1, "LinkedIn User ID is required").max(500),
  roles: z.array(z.string()).optional(),
  vertical: z.string().optional(),
  currentRole: z.string().max(200).optional(),
  currentCompany: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddContactFormProps {
  onAddContact: (user: User) => void;
}

export function AddContactForm({ onAddContact }: AddContactFormProps) {
  const { toast } = useToast();
  const [rolesOpen, setRolesOpen] = useState(false);
  const [verticalOpen, setVerticalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { roles: [], vertical: "" },
  });

  const onSubmit = (data: FormValues) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      firstName: data.firstName.trim(),
      lastName: (data.lastName ?? "").trim(),
      email: data.email.trim(),
      linkedinUrl: data.linkedinUrl.trim(),
      roles: (data.roles ?? []) as Role[],
      vertical: (data.vertical || undefined) as Vertical | undefined,
      currentRole: (data.currentRole ?? "").trim(),
      currentCompany: (data.currentCompany ?? "").trim(),
      industry: (data.industry ?? "").trim(),
      avatarInitials: `${data.firstName[0] ?? ""}${data.lastName?.[0] ?? ""}`.toUpperCase(),
      lastUpdated: new Date().toISOString(),
    };
    onAddContact(newUser);
    toast({ title: "Contact added", description: `${newUser.firstName} ${newUser.lastName} has been added.` });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Required fields */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Required</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base" htmlFor="firstName">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input className="h-12 text-base" id="firstName" placeholder="Jane" {...register("firstName")} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-base" htmlFor="lastName">Last name</Label>
            <Input className="h-12 text-base" id="lastName" placeholder="Smith" {...register("lastName")} />
          </div>

          <div className="space-y-2">
            <Label className="text-base" htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input className="h-12 text-base" id="email" type="email" placeholder="jane@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-base" htmlFor="linkedinUrl">
              LinkedIn <span className="text-destructive">*</span>
            </Label>
            <Input className="h-12 text-base" id="linkedinUrl" placeholder="linkedin.com/in/janesmith" {...register("linkedinUrl")} />
            {errors.linkedinUrl && <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>}
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="space-y-2">
        <Label className="text-base">Role</Label>
        <Controller
          control={control}
          name="roles"
          render={({ field }) => {
            const selected: string[] = field.value ?? [];
            return (
              <Popover open={rolesOpen} onOpenChange={setRolesOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-base text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
                      {selected.length === 0 ? "Select roles…" : selected.join(", ")}
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  {ALL_ROLES.map((role) => {
                    const checked = selected.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          field.onChange(
                            checked ? selected.filter((r) => r !== role) : [...selected, role]
                          );
                        }}
                        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-base hover:bg-muted transition-colors"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border border-input",
                            checked && "bg-primary border-primary"
                          )}
                        >
                          {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                        </span>
                        <span className="capitalize">{role}</span>
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </div>

      {/* Dynamic / time-bound fields */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Current</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-base" htmlFor="currentRole">Current role</Label>
            <Input className="h-12 text-base" id="currentRole" placeholder="CEO" {...register("currentRole")} />
          </div>
          <div className="space-y-2">
            <Label className="text-base" htmlFor="currentCompany">Current company</Label>
            <Input className="h-12 text-base" id="currentCompany" placeholder="Acme Inc." {...register("currentCompany")} />
          </div>
          <div className="space-y-2">
            <Label className="text-base" htmlFor="industry">Industry</Label>
            <Input className="h-12 text-base" id="industry" placeholder="SaaS" {...register("industry")} />
          </div>
        </div>
      </div>

      {/* 25m Vertical */}
      <div className="space-y-2">
        <Label className="text-base">25m Vertical</Label>
        <Controller
          control={control}
          name="vertical"
          render={({ field }) => {
            const selected = field.value ?? "";
            return (
              <Popover open={verticalOpen} onOpenChange={setVerticalOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-base text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span className={cn("truncate", !selected && "text-muted-foreground")}>
                      {selected || "Select vertical…"}
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  {selected && (
                    <button
                      type="button"
                      onClick={() => { field.onChange(""); setVerticalOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors mb-1 border-b border-border pb-2"
                    >
                      Clear selection
                    </button>
                  )}
                  {ALL_VERTICALS.map((v) => {
                    const checked = selected === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { field.onChange(v); setVerticalOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-base hover:bg-muted transition-colors"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border border-input",
                            checked && "bg-primary border-primary"
                          )}
                        >
                          {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                        </span>
                        <span>{v}</span>
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-base">
        Add Contact
      </Button>
    </form>
  );
}
