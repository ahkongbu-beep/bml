export interface GrowthItem {
    months: number;
    value: number;
}

export interface GrowthResponse {
  [type: string]: {
    [gender: string]: {
      [percent: string]: GrowthItem[];
    };
  };
}

export interface GrowthPoint {
  months: number;
  value: number;
}

export interface GrowthPercentileData {
  [percentile: string]: GrowthPoint[];
}

export interface GrowthGenderData {
  M: GrowthPercentileData;
  W: GrowthPercentileData;
}

export interface GrowthData {
  height: GrowthGenderData;
  weight: GrowthGenderData;
}