// CBT(인지행동치료) '콘텐츠' — 인지 왜곡 목록과 인지 재구성 질문.
// 근거: 인지행동치료에서 널리 쓰이는 일반적 심리교육 자료를 참고한 것으로,
// 특정 개인에 대한 의학적 조언이 아니라 자가관리용 안내 문구입니다.

import type { DistortionId } from '../types'

export interface Distortion {
  id: DistortionId
  name: string // 한국어 명칭
  short: string // 한 줄 설명
  example: string // 예시 생각
}

/** 흔한 인지 왜곡 10가지 */
export const DISTORTIONS: Distortion[] = [
  {
    id: 'all-or-nothing',
    name: '흑백논리',
    short: '중간이 없는 극단적 판단 ("완벽하지 않으면 실패")',
    example: '하나라도 틀리면 나는 완전히 망한 거야.',
  },
  {
    id: 'catastrophizing',
    name: '재앙화',
    short: '최악의 결과를 기정사실처럼 예상',
    example: '이 발표를 망치면 내 커리어는 끝장이야.',
  },
  {
    id: 'overgeneralization',
    name: '과잉일반화',
    short: '한 번의 일을 "항상/절대"로 확장',
    example: '이번에 거절당했으니 난 늘 거절당할 거야.',
  },
  {
    id: 'mind-reading',
    name: '넘겨짚기(독심술)',
    short: '근거 없이 타인의 생각을 단정',
    example: '저 사람은 분명 날 한심하게 볼 거야.',
  },
  {
    id: 'emotional-reasoning',
    name: '감정적 추론',
    short: '"느낌"을 사실의 증거로 사용',
    example: '불안하니까 분명 위험한 일이 생길 거야.',
  },
  {
    id: 'should-statements',
    name: '당위적 사고',
    short: '"~해야만 한다"는 경직된 규칙',
    example: '나는 절대 실수하면 안 돼.',
  },
  {
    id: 'personalization',
    name: '개인화',
    short: '내 탓이 아닌 일까지 자기 책임으로',
    example: '팀이 실패한 건 다 나 때문이야.',
  },
  {
    id: 'disqualifying-positive',
    name: '긍정 격하',
    short: '잘한 일을 "운"이나 "당연"으로 깎아내림',
    example: '이번에 잘된 건 그냥 운이 좋았을 뿐이야.',
  },
  {
    id: 'mental-filter',
    name: '정신적 여과',
    short: '부정적인 한 가지에만 초점',
    example: '칭찬 열 개보다 지적 하나가 전부처럼 느껴져.',
  },
  {
    id: 'labeling',
    name: '낙인찍기',
    short: '행동이 아닌 사람 전체에 부정적 딱지',
    example: '실수했으니 나는 무능한 사람이야.',
  },
]

export function distortionById(id: DistortionId): Distortion | undefined {
  return DISTORTIONS.find((d) => d.id === id)
}

/** 인지 재구성 단계에서 안내하는 소크라테스식 질문 */
export interface SocraticStep {
  key: 'evidenceFor' | 'evidenceAgainst' | 'friendAdvice' | 'balancedThought'
  title: string
  prompt: string
  placeholder: string
}

export const SOCRATIC_STEPS: SocraticStep[] = [
  {
    key: 'evidenceFor',
    title: '이 생각을 뒷받침하는 사실',
    prompt: '감정이나 추측이 아니라, 실제로 관찰 가능한 "사실"만 적어보세요.',
    placeholder: '예: 지난주 회의에서 내 제안이 채택되지 않았다.',
  },
  {
    key: 'evidenceAgainst',
    title: '이 생각과 반대되는 사실',
    prompt: '이 걱정이 100% 맞지는 않다는 증거는 무엇이 있나요?',
    placeholder: '예: 다른 제안은 여러 번 채택된 적이 있다.',
  },
  {
    key: 'friendAdvice',
    title: '친한 친구에게라면?',
    prompt: '같은 상황의 친구가 이 생각을 한다면, 당신은 뭐라고 말해줄까요?',
    placeholder: '예: 한 번의 결과가 네 능력 전부를 말해주는 건 아니야.',
  },
  {
    key: 'balancedThought',
    title: '균형 잡힌 대안적 생각',
    prompt: '위 내용을 모아, 더 현실적이고 균형 잡힌 문장으로 다시 써보세요.',
    placeholder: '예: 이번엔 아쉬웠지만, 그것이 내 가치를 결정하지는 않는다. 다음에 개선할 점을 찾으면 된다.',
  },
]

/** 감정 강도 라벨 (0~100 구간) */
export function intensityLabel(v: number): string {
  if (v <= 20) return '약함'
  if (v <= 40) return '다소'
  if (v <= 60) return '보통'
  if (v <= 80) return '강함'
  return '매우 강함'
}

/** 자주 쓰는 감정 후보 */
export const EMOTION_SUGGESTIONS = [
  '불안',
  '두려움',
  '초조',
  '우울',
  '분노',
  '수치심',
  '죄책감',
  '외로움',
  '무기력',
]

/** 수면 위생 체크리스트 */
export interface HygieneItem {
  id: string
  label: string
}

export const SLEEP_HYGIENE: HygieneItem[] = [
  { id: 'no-caffeine', label: '오후 2시 이후 카페인 피하기' },
  { id: 'screen-off', label: '잠들기 30분 전 화면 끄기' },
  { id: 'dim-light', label: '조명 어둡게 하기' },
  { id: 'same-time', label: '매일 비슷한 시각에 눕기' },
  { id: 'no-clock', label: '시계 반복 확인하지 않기' },
  { id: 'get-up', label: '20분 넘게 안 오면 잠자리에서 나오기' },
]
