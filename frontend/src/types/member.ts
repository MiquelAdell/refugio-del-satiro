export interface CurrentMember {
  readonly id: number;
  readonly member_number: number | null;
  readonly first_name: string;
  readonly last_name: string;
  readonly nickname: string | null;
  readonly phone: string | null;
  readonly email: string;
  readonly display_name: string;
  readonly is_admin: boolean;
  readonly is_active: boolean;
  readonly last_payment: string | null;
}

export const genderLabels = ["socio", "socia", "socio/a"] as const;
export type GenderLabel = (typeof genderLabels)[number];

export interface ValidateMemberResponse {
  readonly member_number: number;
  readonly first_name: string;
  readonly last_name: string;
  readonly active: boolean;
  readonly last_payment: string | null;
  readonly gender_label: GenderLabel;
}
