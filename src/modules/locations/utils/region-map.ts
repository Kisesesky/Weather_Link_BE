import { RegionMapping } from "../../weather/interface/weather-interface";

export const SIDO_NAME_MAP: Record<string, string> = {
    '서울': '서울특별시',
    '부산': '부산광역시',
    '대구': '대구광역시',
    '인천': '인천광역시',
    '광주': '광주광역시',
    '대전': '대전광역시',
    '울산': '울산광역시',
    '세종': '세종특별자치시',
    '경기': '경기도',
    '강원': '강원도',
    '충북': '충청북도',
    '충남': '충청남도',
    '전북': '전라북도',
    '전남': '전라남도',
    '경북': '경상북도',
    '경남': '경상남도',
    '제주': '제주특별자치도'
  };

  export const REGION_MAPPINGS: RegionMapping[] = [
    // 수도권
    {
      regId: '11B00000',
      regions: [
        { sido: '서울' }, { sido: '경기' }, { sido: '인천' }
      ]
    },
    // 충청북도, 세종
    {
      regId: '11C10000',
      regions: [
        { sido: '충북' }, { sido: '세종' }
      ]
    },
    // 충청남도, 대전
    {
      regId: '11C20000',
      regions: [
        { sido: '충남' }, { sido: '대전' }
      ]
    },
    // 강원도 영서
    {
      regId: '11D10000',
      regions: [
        { 
          sido: '강원',
          guguns: [ '철원군', '화천군', '양구군', '인제군', '춘천시', '홍천군', '횡성군', '원주시', '평창군', '영월군', '정선군' ]
        }
      ]
    },
    // 강원도 영동
    {
      regId: '11D20000',
      regions: [
        {
          sido: '강원',
          guguns: [ '강릉시', '동해시', '속초시', '삼척시', '태백시', '고성군', '양양군', '통천군' ]
        }
      ]
    },
    // 전라북도
    {
      regId: '11F10000',
      regions: [
        { sido: '전북' }
      ]
    },
    // 전라남도, 광주
    {
      regId: '11F20000',
      regions: [
        { sido: '전남' }, { sido: '광주' }
      ]
    },
    // 제주도
    {
      regId: '11G00000',
      regions: [
        { sido: '제주' }
      ]
    },
    // 경상북도, 대구
    {
      regId: '11H10000',
      regions: [
        { sido: '경북' }, { sido: '대구' }
      ]
    },
    // 경상남도, 부산, 울산
    {
      regId: '11H20000',
      regions: [
        { sido: '경남' }, { sido: '울산' }, { sido: '부산' }
      ]
    }
  ];