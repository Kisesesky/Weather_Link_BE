export interface RegionInfo {
  sido: string;
  guguns: string[];
}

export interface RegIdMapping {
  regId: string;
  sido: string;
  gugun: string;
}

export interface RegionMapping {
  regId: string;
  regions: {
    sido: string;
    guguns?: string[];
  }[];
}