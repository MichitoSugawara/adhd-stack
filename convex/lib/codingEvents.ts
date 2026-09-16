export interface NormalizedTurn {
  commands: string[];
  diff?: string;
  error?: string;
  files: string[];
  status?: string;
  texts: string[];
  thinking: string[];
  work?: string;
}
