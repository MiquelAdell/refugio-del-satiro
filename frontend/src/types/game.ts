export interface Game {
  readonly id: number;
  readonly bgg_id: number;
  readonly name: string;
  readonly slug: string;
  readonly thumbnail_url: string;
  readonly image_url: string;
  readonly year_published: number;
  readonly min_players: number;
  readonly max_players: number;
  readonly playing_time: number;
  readonly bgg_rating: number;
  readonly location: string;
}

export interface GameWithStatus extends Game {
  readonly status: "available" | "lent";
  readonly borrower_display_name: string | null;
  readonly loan_id: number | null;
}
