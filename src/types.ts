// 앱 전역에서 쓰는 데이터 모델 정의
// 모든 데이터는 사용자의 브라우저(localStorage)에만 저장됩니다. 서버 전송 없음.

/** 인지 왜곡 유형 식별자 */
export type DistortionId =
  | 'all-or-nothing'
  | 'catastrophizing'
  | 'overgeneralization'
  | 'mind-reading'
  | 'emotional-reasoning'
  | 'should-statements'
  | 'personalization'
  | 'disqualifying-positive'
  | 'mental-filter'
  | 'labeling'

/** 걱정 기록 + 인지 재구성 한 세트 */
export interface WorryEntry {
  id: string
  createdAt: number // epoch ms

  // 1단계: 걱정 기록
  situation: string // 상황/계기
  automaticThought: string // 자동적 사고(걱정)
  emotion: string // 감정 이름 (예: 불안, 두려움)
  intensityBefore: number // 0~100

  // 2단계: 인지 재구성
  distortions: DistortionId[] // 식별한 인지 왜곡
  evidenceFor: string // 생각을 뒷받침하는 증거
  evidenceAgainst: string // 반대되는 증거
  friendAdvice: string // 친구에게라면 뭐라고?
  balancedThought: string // 대안적/균형 잡힌 생각

  // 3단계: 재평가
  intensityAfter: number // 0~100
}

/** 수면 전 '생각 비우기' 기록 */
export interface SleepNote {
  id: string
  createdAt: number
  worries: string // 머릿속 걱정 쏟아내기
  tomorrowPlan: string // 내일 처리할 일 (걱정 미루기)
  hygieneChecked: string[] // 체크한 수면 위생 항목 id
}

/** 앱 저장 데이터 루트 */
export interface AppData {
  version: number
  entries: WorryEntry[]
  sleepNotes: SleepNote[]
  premium: PremiumState
  settings: AppSettings
  program: ProgramState
  assessments: AssessmentResult[]
}

/** 자가검사 결과 (ISI, DBAS-16, 수면효율, DSM-5) */
export interface AssessmentResult {
  id: string
  kind: 'isi' | 'dbas' | 'habits' | 'dsm5'
  createdAt: number
  score: number // isi: 총점 0~28 / dbas: 평균*10 (0~100) / habits: 수면효율 % / dsm5: 1(해당) 0(비해당)
  meta?: Record<string, string | number | boolean>
}

/** 4세션 교육 프로그램 진도 */
export interface ProgramState {
  completedSessions: number[] // 완료한 세션 번호 (1~4)
  // 복습 모드 이어보기 위치: 세션번호 → 마지막으로 본 페이지 인덱스(0-based).
  // 학습 진행/완료 상태와 무관하며, 복습 모드에서만 읽고 쓴다.
  reviewProgress: Record<number, number>
}

export interface PremiumState {
  active: boolean
  // 결제 확인 시각. 로컬 신뢰 기반(서버 검증 아님) — README/코드 주석 참고.
  unlockedAt: number | null
  // Stripe Checkout 세션 id (성공 리다이렉트에서 수신, 참고용)
  lastCheckoutSessionId: string | null
}

export interface AppSettings {
  reminderHour: number | null // 하루 체크인 알림 희망 시각(로컬 표시용)
  theme: 'system' | 'dark' | 'light'
}
