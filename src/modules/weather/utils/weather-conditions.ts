export const weeklySky = {
    WB01: '맑음',
    WB02: '구름조금',
    WB03: '구름많음',
    WB04: '흐림',
};

export const dailySky = {
    DB01:'맑음',
    DB02:'구름조금',
    DB03:'구름많음',
    DB04:'흐림',
};
  
export const preMap = {
    WB00: '',
    WB09: '비',
    WB11: '비/눈',
    WB13: '눈/비',
    WB12: '눈',
};

export const SkyCondition: Record<number,string> = {
    1: '맑음',
    2: '보통',
    3: '구름많음',
    4: '흐림',
}

export const PrecipitationType: Record<number, string> = {
    0: '없음',
    1: '비',
    2: '비/눈',
    3: '눈',
    4: '소나기',
}