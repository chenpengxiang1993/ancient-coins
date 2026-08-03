export interface GeneratePublicDataResult {
  dynastyCount: number;
  summarySizeKB: number;
  detailSizeKB: number;
}

export function generatePublicData(): GeneratePublicDataResult;
