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
  groupId: string;
  checkIn: boolean;
  // 데이터 입출력
  createdAt: number; // unix
  updatedAt: number; // unix
  canceledAt: number; // unix, 대회 참석 취소
}

export interface RequiredConsent {
  portraitRight: string | number;
  churchStandard: string | number;
  useOfInformation: string | number;
}
