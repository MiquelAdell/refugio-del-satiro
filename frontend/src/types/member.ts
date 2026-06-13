export interface CurrentMember {
  readonly id: number;
  readonly display_name: string;
  readonly email: string;
  readonly is_admin: boolean;
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
