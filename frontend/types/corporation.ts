export interface Corporation {
  corpCode: string;
  name: string;
  stockCode?: string | null;
  market?: string | null;
  listed?: boolean | null;
}
