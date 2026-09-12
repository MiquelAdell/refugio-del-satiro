export const ACTIVE_LOAN_ITEM_TYPES = ["boardgame", "rpgitem"] as const;

export type ActiveLoanItemType = (typeof ACTIVE_LOAN_ITEM_TYPES)[number];

export interface ActiveLoan {
  readonly loan_id: number;
  readonly game_id: number;
  readonly game_slug: string;
  readonly item_type: ActiveLoanItemType;
  readonly game_name: string;
  readonly game_thumbnail_url: string;
  readonly game_image_url: string;
  readonly borrowed_at: string;
}

export interface LoanHistoryEntry {
  readonly member_display_name: string | null;
  readonly borrowed_at: string;
  readonly returned_at: string | null;
}

export interface ReturnLoanResponse {
  readonly forced_return_email_sent: boolean | null;
}
