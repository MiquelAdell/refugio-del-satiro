export interface ActiveLoan {
  readonly loan_id: number;
  readonly game_id: number;
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
