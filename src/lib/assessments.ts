// 자가검사 문항 + 채점 + 문헌 기반 해석 기준.
//
// 참고 문헌(교육용 표기):
// - ISI 절단점: Bastien/Morin 등 널리 쓰이는 기준 (0-7/8-14/15-21/22-28)
// - DBAS-16: Morin et al., Sleep 2007. 항목평균 0~10, 3.8 초과 시 임상적 불면 수준의
//   역기능적 신념으로 알려짐 (낮을수록 좋음). 문항은 원 프로토콜의 한국어판을 사용.
// - 수면효율(SE) 85% 이상을 양호 기준으로 하는 것은 CBT-I 표준 목표치.
// 이 검사는 교육·자가점검용이며 의학적 진단이 아닙니다.

/* ─────────────────────────── ISI (불면증 지수) ─────────────────────────── */

export interface ScaleItem {
  key: string
  text: string
  labels: string[] // 0..4 각 눈금 라벨
}

export const ISI_ITEMS: ScaleItem[] = [
  { key: 'onset', text: '잠들기 어렵다', labels: ['없음', '약간', '중간', '심함', '매우 심함'] },
  { key: 'maintain', text: '자다가 자주 깬다', labels: ['없음', '약간', '중간', '심함', '매우 심함'] },
  { key: 'early', text: '너무 일찍 깬다', labels: ['없음', '약간', '중간', '심함', '매우 심함'] },
  { key: 'satisfaction', text: '요즘 내 수면에 대한 만족도는?', labels: ['매우 만족', '만족', '보통', '불만족', '매우 불만족'] },
  { key: 'interfere', text: '수면 문제가 낮 활동(피로·집중·기분 등)을 방해하는 정도는?', labels: ['전혀', '약간', '다소', '상당히', '매우 많이'] },
  { key: 'noticeable', text: '남들이 볼 때 수면 문제로 내 삶이 나빠 보이는 정도는?', labels: ['전혀', '약간', '다소', '상당히', '매우 많이'] },
  { key: 'worry', text: '요즘 수면 문제로 얼마나 걱정하나?', labels: ['전혀', '약간', '다소', '상당히', '매우 많이'] },
]

export function interpretISI(total: number): { band: string; tone: 'good' | 'warn' | 'bad' } {
  if (total <= 7) return { band: '유의한 불면 없음', tone: 'good' }
  if (total <= 14) return { band: '약한 불면 경향 (역치하)', tone: 'warn' }
  if (total <= 21) return { band: '중등도 임상적 불면', tone: 'bad' }
  return { band: '중증 임상적 불면', tone: 'bad' }
}

/* ───────────────────────── DBAS-16 (수면에 대한 생각) ───────────────────────── */
// 원 프로토콜 문항(한국어판) 그대로. 0(강한 부정) ~ 10(강한 긍정).

export const DBAS_ITEMS: string[] = [
  '낮에 기운을 차리고 일을 잘하려면 8시간은 자야 한다.',
  '전날 잠을 충분히 못 자면, 낮잠을 자거나 더 오래 자서 보충해야 한다.',
  '만성 불면증이 내 건강에 심각한 영향을 미칠까 봐 염려한다.',
  '잠을 잘 조절하는 능력을 잃어버릴까 봐 걱정한다.',
  '밤에 잘 못 자면 다음 날 일상 활동에 지장이 있다.',
  '맑은 정신으로 일하려면, 밤에 못 자느니 수면제를 먹는 게 낫다.',
  '낮에 짜증·우울·불안하면 대개 전날 밤 잘 못 잤기 때문이다.',
  '낮에 피곤하고 기력이 없으면 보통 전날 밤 잘 못 잤기 때문이다.',
  '충분히 못 자면 다음 날 낮에 제대로 기능하기 어렵다.',
  '밤에 잘 잘 수 있을지 전혀 예측할 수 없다.',
  '수면 문제로 생기는 어려움에 대처할 능력이 거의 없다.',
  '하룻밤 못 자면 그 주 전체의 수면이 흐트러진다.',
  '불면증은 근본적으로 몸의 화학적 불균형 때문이라고 생각한다.',
  '불면증 때문에 원하는 삶을 즐기지 못한다고 느낀다.',
  '잠을 못 잘 때 유일한 해결책은 약물일 것이다.',
  '밤에 못 잔 다음 날엔 해야 할 일을 미루거나 취소하게 된다.',
]

export const DBAS_THRESHOLD = 3.8 // 항목평균(0~10). 초과 시 임상적 불면 수준

export function interpretDBAS(mean: number): { band: string; tone: 'good' | 'warn' | 'bad' } {
  if (mean <= 2.5) return { band: '수면에 대한 생각이 유연한 편', tone: 'good' }
  if (mean <= DBAS_THRESHOLD) return { band: '다소 경직된 생각이 있음', tone: 'warn' }
  return { band: '수면에 대한 부담·걱정이 강한 편', tone: 'bad' }
}

/* ───────────────────────── 수면 효율 (나의 습관) ───────────────────────── */
// SE = 실제 잔 시간 / 침대에 머문 시간 × 100. 85% 이상이면 양호.

export interface HabitsInput {
  bedTime: string // "23:00" 잠자리에 누운 시각
  outTime: string // "07:00" 아침에 잠자리에서 나온 시각
  onsetMin: number // 잠들기까지 걸린 시간(분)
  wasoMin: number // 밤중에 깨어 있던 총 시간(분)
}

/** 두 time(HH:MM) 사이 분 계산 (자정 넘김 처리) */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diff = eh * 60 + em - (sh * 60 + sm)
  if (diff <= 0) diff += 24 * 60
  return diff
}

export function sleepEfficiency(h: HabitsInput): { tib: number; tst: number; se: number } {
  const tib = minutesBetween(h.bedTime, h.outTime)
  const tst = Math.max(0, tib - (h.onsetMin || 0) - (h.wasoMin || 0))
  const se = tib > 0 ? Math.round((tst / tib) * 100) : 0
  return { tib, tst, se }
}

export function interpretSE(se: number): { band: string; tone: 'good' | 'warn' | 'bad' } {
  if (se >= 85) return { band: '양호한 수면 효율', tone: 'good' }
  if (se >= 75) return { band: '조금 낮은 편', tone: 'warn' }
  return { band: '낮은 편 — 침대에 깨어 있는 시간이 많아요', tone: 'bad' }
}

/** 분 → "N시간 M분" */
export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

/* ───────────────────────── DSM-5 불면장애 자가점검 ───────────────────────── */

export interface Dsm5Item {
  key: string
  text: string
  group?: 'core' // A의 하위 증상(하나 이상이면 A 충족)
}

// A(수면 불만족 + 아래 중 하나 이상), B~E
export const DSM5_CORE: Dsm5Item[] = [
  { key: 'a_onset', text: '잠들기가 어렵다', group: 'core' },
  { key: 'a_maintain', text: '자주 깨거나, 깬 뒤 다시 잠들기 어렵다', group: 'core' },
  { key: 'a_early', text: '원하는 시각보다 너무 일찍 깨어 다시 못 잔다', group: 'core' },
]

export const DSM5_CRITERIA: Dsm5Item[] = [
  { key: 'b_impair', text: '수면 문제로 낮에 힘들거나(피로·기분·집중 등) 일상·직장·관계에 지장이 있다' },
  { key: 'c_freq', text: '이런 수면 문제가 일주일에 3일 이상 있다' },
  { key: 'd_dur', text: '이런 수면 문제가 3개월 이상 이어지고 있다' },
  { key: 'e_opp', text: '잘 수 있는 충분한 기회(시간·환경)가 있는데도 못 잔다' },
]

export interface Dsm5Answers {
  core: Record<string, boolean>
  criteria: Record<string, boolean>
}

/** DSM-5 불면장애 기준 충족 여부 판정 (교육용 스크리닝) */
export function evaluateDsm5(a: Dsm5Answers): { meets: boolean; reasons: string[] } {
  const coreYes = DSM5_CORE.some((i) => a.core[i.key])
  const b = !!a.criteria['b_impair']
  const c = !!a.criteria['c_freq']
  const d = !!a.criteria['d_dur']
  const e = !!a.criteria['e_opp']
  const reasons: string[] = []
  if (!coreYes) reasons.push('입면·유지·조기각성 중 해당하는 증상이 없어요')
  if (!b) reasons.push('낮 기능 저하·고통 기준이 충족되지 않아요')
  if (!c) reasons.push('빈도(주 3일 이상) 기준이 충족되지 않아요')
  if (!d) reasons.push('기간(3개월 이상) 기준이 충족되지 않아요')
  if (!e) reasons.push('충분한 수면 기회 조건이 충족되지 않아요')
  return { meets: coreYes && b && c && d && e, reasons }
}
