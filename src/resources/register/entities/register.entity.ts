export interface Register {
  // 인덱스
  uid: string;
  // 사용자 입력 정보
  email: string;
  name: string;
  dob: string;
  sex: 'm' | 'f';
  contact: string;
  geo: string;
  isMember: boolean;
  joins: number[];
  consent: RequiredConsent;
  // 대회 참여 정보
  group: string;
  isLeader?: boolean;
  room?: string;
  checkIn: boolean;
  // 데이터 입출력
  createdAt: number; // unix
  updatedAt: number; // unix
}

export interface RequiredConsent {
  portraitRight: string | number;
  churchStandard: string | number;
  useOfInformation: string | number;
}
