// 세션1 온보딩 자가점검 설문 — 기본값·선택지·요약·코멘트 로직.
//
// 코멘트 톤 원칙(반드시 유지):
//  1) 공감/정상화 — "많은 분들이 그러세요" 식으로 비난하지 않고 시작
//  2) 그런데   — 이 습관이 수면에 주는 영향을 CBT-I 원리와 연결해 설명
//  → "흔한 습관이에요"로 끝내지 않고 "흔하지만 개선이 필요하다"까지,
//     그리고 항상 "추후 세션에서 더 다뤄본다"로 자연스럽게 연결한다.

import type { SurveyAnswers } from '../types'

/** 설문 진입 시 기본 응답값 */
export const DEFAULT_SURVEY: SurveyAnswers = {
  bedTime: '23:00',
  wakeTime: '07:00',
  sleepHours: 6,
  cantSleepAct: 'lie',
  cantSleepActText: '',
  checkClock: 'sometimes',
  dayLie: 'sometimes',
  bedActivity: 'none',
  bedActivityText: '',
  napHours: 0,
  napDaysPerWeek: 0,
}

/** 0.5시간 단위 휠 옵션 생성 (0 ~ max) */
export function hourOptions(max: number): { v: number; label: string }[] {
  const out: { v: number; label: string }[] = []
  for (let v = 0; v <= max; v += 0.5) {
    out.push({ v, label: `${v % 1 === 0 ? v : v.toFixed(1)}시간` })
  }
  return out
}

/** 0 ~ 7일 휠 옵션 */
export const DAY_OPTIONS: { v: number; label: string }[] = Array.from({ length: 8 }, (_, v) => ({
  v,
  label: `${v}일`,
}))

export const SLEEP_HOURS_OPTIONS = hourOptions(12)
export const NAP_HOURS_OPTIONS = hourOptions(6)

/** 잠 안 올 때 하는 것 */
export const CANT_SLEEP_OPTIONS = [
  { value: 'lie', label: '그냥 가만히 누워있는다' },
  { value: 'tv', label: 'TV를 본다' },
  { value: 'phone', label: '스마트폰을 본다' },
  { value: 'custom', label: '기타 (직접 입력)' },
] as const

/** 시간 확인 여부 */
export const CHECK_CLOCK_OPTIONS = [
  { value: 'always', label: '항상 확인한다' },
  { value: 'sometimes', label: '종종 확인한다' },
  { value: 'never', label: '안 한다' },
] as const

/** 낮에 눕는 정도 */
export const DAY_LIE_OPTIONS = [
  { value: 'often', label: '자주 눕는다' },
  { value: 'sometimes', label: '간혹 눕는다' },
  { value: 'never', label: '절대 안 눕는다' },
] as const

/** 낮에 잠자리에서 하는 활동 */
export const BED_ACTIVITY_OPTIONS = [
  { value: 'tv', label: 'TV를 본다' },
  { value: 'book', label: '책을 본다' },
  { value: 'other', label: '다른 활동을 한다 (직접 입력)' },
  { value: 'none', label: '안 한다' },
] as const

/** "23:00" → "오후 11:00" */
export function formatKoreanTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const ampm = h < 12 ? '오전' : '오후'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${hh}:${String(m).padStart(2, '0')}`
}

function hourLabel(v: number): string {
  return `${v % 1 === 0 ? v : v.toFixed(1)}시간`
}

/** 요약 화면에 보여줄 질문→응답 행 */
export function summaryRows(a: SurveyAnswers): { label: string; value: string }[] {
  const cantSleep =
    a.cantSleepAct === 'custom'
      ? a.cantSleepActText.trim() || '기타'
      : CANT_SLEEP_OPTIONS.find((o) => o.value === a.cantSleepAct)?.label ?? ''
  const bedAct =
    a.bedActivity === 'other'
      ? a.bedActivityText.trim() || '다른 활동'
      : BED_ACTIVITY_OPTIONS.find((o) => o.value === a.bedActivity)?.label ?? ''
  return [
    { label: '잠자리에 드는 시각', value: formatKoreanTime(a.bedTime) },
    { label: '일어나는 시각', value: formatKoreanTime(a.wakeTime) },
    { label: '실제 수면', value: `약 ${hourLabel(a.sleepHours)}` },
    { label: '잠이 안 오면', value: cantSleep },
    { label: '시간 확인', value: CHECK_CLOCK_OPTIONS.find((o) => o.value === a.checkClock)?.label ?? '' },
    { label: '낮에 눕기', value: DAY_LIE_OPTIONS.find((o) => o.value === a.dayLie)?.label ?? '' },
    { label: '낮에 잠자리에서', value: bedAct },
    {
      label: '낮잠',
      value: a.napDaysPerWeek === 0 || a.napHours === 0 ? '거의 안 잠' : `주 ${a.napDaysPerWeek}일 · 약 ${hourLabel(a.napHours)}`,
    },
  ]
}

/** 세션 안내 코멘트 (공감→"그런데"→차후 세션 연결). 해당 항목만 반환. */
export function surveyComments(a: SurveyAnswers): string[] {
  const out: string[] = []

  // Q4: 잠 안 올 때 스마트폰을 본다
  if (a.cantSleepAct === 'phone') {
    out.push(
      '많은 분들이 그러세요. 다만 침대에서 스마트폰을 보면, 뇌가 ‘침대 = 깨어있는 곳’으로 학습하게 돼서 오히려 잠들기 더 어려워질 수 있어요. 이 부분은 세션 2에서 더 다뤄볼게요.',
    )
  }

  // Q5: 시간을 항상/종종 확인한다
  if (a.checkClock === 'always' || a.checkClock === 'sometimes') {
    out.push(
      '흔한 습관이지만, 시간을 확인할 때마다 ‘아직도 못 잤네’라는 생각이 들면서 오히려 각성 상태가 높아질 수 있어요. 이 생각을 다루는 방법은 세션 3에서 더 배워볼게요.',
    )
  }

  // Q6·Q7: 낮에 자주 눕는다 / 낮에 잠자리에서 활동한다 (하나로 묶어 한 번만)
  const daytimeInBed = a.dayLie === 'often' || a.bedActivity !== 'none'
  if (daytimeInBed) {
    out.push(
      '많은 분들이 그러세요. 다만 낮 동안 침대에서 시간을 보내면, 밤에 쌓여야 할 ‘졸림’이 줄어들고 침대와 수면의 연결이 약해질 수 있어요. 이 부분은 세션 2에서 더 자세히 다뤄볼게요.',
    )
  }

  // Q8: 낮잠이 주 3회 이상
  if (a.napDaysPerWeek >= 3 && a.napHours > 0) {
    out.push(
      '낮잠 자체가 나쁜 건 아니지만, 낮잠이 잦으면 밤에 잠들 힘(수면압)이 줄어들 수 있어요. 관련 내용은 세션 2에서 더 다뤄볼게요.',
    )
  }

  return out
}
