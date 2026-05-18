export type BeatPattern = {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  patterns: {
    kick: number[] | boolean[];
    snare: number[] | boolean[];
    hihat: number[] | boolean[];
    percussion: number[] | boolean[];
    [key: string]: number[] | boolean[];
  };
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
};

export type BeatPatternPartial = Partial<BeatPattern> & { id: string };
export type NewBeatPattern = Omit<BeatPattern, 'id' | 'createdAt' | 'updatedAt'>;
