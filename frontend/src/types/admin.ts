export const memberGenders = ["Masculino", "Femenino", ""] as const;
export type MemberGender = (typeof memberGenders)[number];

export interface AdminMember {
  readonly id: number;
  readonly member_number: number | null;
  readonly first_name: string;
  readonly last_name: string;
  readonly nickname: string | null;
  readonly display_name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly is_admin: boolean;
  readonly is_active: boolean;
  readonly active_loan_count: number;
  readonly last_payment?: string | null;
  readonly gender?: MemberGender | null;
}

export interface CreateMemberRequest {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly nickname?: string | null;
  readonly phone?: string | null;
  readonly member_number?: number | null;
  readonly last_payment?: string | null;
  readonly gender?: MemberGender | null;
}

export interface EditMemberRequest {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly nickname?: string | null;
  readonly phone?: string | null;
  readonly member_number?: number | null;
  readonly last_payment?: string | null;
  readonly gender?: MemberGender | null;
  readonly is_admin: boolean;
}

export interface CreateMemberResponse {
  readonly member: AdminMember;
  readonly token_url: string;
}

export interface SendLinkResponse {
  readonly email_sent: boolean;
  readonly token_url: string;
}

export interface ImportedMember {
  readonly display_name: string;
  readonly email: string;
  readonly token_url: string;
}

export interface ImportMembersResponse {
  readonly created: readonly ImportedMember[];
  readonly total_rows: number;
  readonly skipped_rows: number;
}

export interface OkResponse {
  readonly ok: boolean;
}
