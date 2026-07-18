// localStorage 기반 영속화 계층.
// 모든 데이터는 이 기기의 브라우저에만 저장되며 외부로 전송되지 않습니다.

import type { AppData } from '../types'

const STORAGE_KEY = 'maeum-shim.data.v1'
const CURRENT_VERSION = 1

export const DEFAULT_DATA: AppData = {
  version: CURRENT_VERSION,
  entries: [],
  sleepNotes: [],
  premium: { active: false, unlockedAt: null, lastCheckoutSessionId: null },
  settings: { reminderHour: null, theme: 'system' },
  program: { completedSessions: [] },
  assessments: [],
}

/** 저장된 데이터를 읽어옵니다. 손상/부재 시 기본값 반환. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_DATA)
    const parsed = JSON.parse(raw) as Partial<AppData>
    return migrate(parsed)
  } catch (err) {
    console.warn('데이터를 읽지 못해 기본값을 사용합니다.', err)
    return structuredClone(DEFAULT_DATA)
  }
}

/** 전체 데이터를 저장합니다. */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    // 저장 공간 초과 등
    console.error('데이터 저장 실패', err)
  }
}

/** 향후 스키마 변경에 대비한 마이그레이션 지점 */
function migrate(parsed: Partial<AppData>): AppData {
  const base = structuredClone(DEFAULT_DATA)
  return {
    ...base,
    ...parsed,
    version: CURRENT_VERSION,
    entries: parsed.entries ?? base.entries,
    sleepNotes: parsed.sleepNotes ?? base.sleepNotes,
    premium: { ...base.premium, ...parsed.premium },
    settings: { ...base.settings, ...parsed.settings },
    program: { ...base.program, ...parsed.program },
    assessments: parsed.assessments ?? base.assessments,
  }
}

/** 전체 데이터를 내보내기용 JSON 문자열로 직렬화 */
export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** 간단한 고유 id 생성 (crypto 사용 가능 시 UUID) */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY)
}
