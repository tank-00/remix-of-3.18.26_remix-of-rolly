export type Role = "operator" | "founder" | "technical" | "investor" | "expert" | "angel";

export type Vertical = "Evolve" | "Health" | "Ventures" | "Sift" | "Platform" | "Creature" | "Propel" | "ASTRA";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  linkedinUrl: string;
  currentRole: string;
  currentCompany: string;
  industry: string;
  roles: Role[];
  vertical?: Vertical;
  avatarInitials?: string;
  lastUpdated: string; // ISO date — most recent of upload or refresh
}

export interface ContactList {
  id: string;
  name: string;
  contactIds: string[];
  createdAt: string; // ISO date string
}

export interface Note {
  id: string;
  contactId: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO date string
}
