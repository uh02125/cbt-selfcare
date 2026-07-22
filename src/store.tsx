// 앱 전역 상태 스토어.
// AppData 를 메모리에서 관리하고, 변경 시마다 localStorage 에 저장합니다.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, SleepNote, WorryEntry, AppSettings, AssessmentResult, SurveyAnswers } from './types'
import { DEFAULT_DATA, loadData, makeId, saveData } from './lib/storage'

interface StoreValue {
  data: AppData
  addEntry: (e: Omit<WorryEntry, 'id' | 'createdAt'>) => WorryEntry
  deleteEntry: (id: string) => void
  addSleepNote: (n: Omit<SleepNote, 'id' | 'createdAt'>) => void
  deleteSleepNote: (id: string) => void
  setPremiumActive: (sessionId: string | null) => void
  toggleSessionComplete: (no: number) => void
  setReviewProgress: (no: number, page: number) => void
  clearReviewProgress: (no: number) => void
  addAssessment: (r: Omit<AssessmentResult, 'id' | 'createdAt'>) => void
  saveOnboarding: (answers: SurveyAnswers) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  replaceAll: (data: AppData) => void
  resetAll: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  // 변경 시마다 저장 (초기 마운트 포함해도 무해)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
    }
    saveData(data)
  }, [data])

  const addEntry = useCallback<StoreValue['addEntry']>((e) => {
    const entry: WorryEntry = { ...e, id: makeId(), createdAt: Date.now() }
    setData((d) => ({ ...d, entries: [entry, ...d.entries] }))
    return entry
  }, [])

  const deleteEntry = useCallback<StoreValue['deleteEntry']>((id) => {
    setData((d) => ({ ...d, entries: d.entries.filter((x) => x.id !== id) }))
  }, [])

  const addSleepNote = useCallback<StoreValue['addSleepNote']>((n) => {
    const note: SleepNote = { ...n, id: makeId(), createdAt: Date.now() }
    setData((d) => ({ ...d, sleepNotes: [note, ...d.sleepNotes] }))
  }, [])

  const deleteSleepNote = useCallback<StoreValue['deleteSleepNote']>((id) => {
    setData((d) => ({ ...d, sleepNotes: d.sleepNotes.filter((x) => x.id !== id) }))
  }, [])

  const setPremiumActive = useCallback<StoreValue['setPremiumActive']>((sessionId) => {
    setData((d) => ({
      ...d,
      premium: { active: true, unlockedAt: Date.now(), lastCheckoutSessionId: sessionId },
    }))
  }, [])

  const toggleSessionComplete = useCallback<StoreValue['toggleSessionComplete']>((no) => {
    setData((d) => {
      const done = d.program.completedSessions
      const next = done.includes(no) ? done.filter((x) => x !== no) : [...done, no].sort()
      return { ...d, program: { ...d.program, completedSessions: next } }
    })
  }, [])

  // 복습 이어보기 위치 저장 (학습 진행/완료 상태와 무관)
  const setReviewProgress = useCallback<StoreValue['setReviewProgress']>((no, page) => {
    setData((d) => ({
      ...d,
      program: { ...d.program, reviewProgress: { ...d.program.reviewProgress, [no]: page } },
    }))
  }, [])

  const clearReviewProgress = useCallback<StoreValue['clearReviewProgress']>((no) => {
    setData((d) => {
      const next = { ...d.program.reviewProgress }
      delete next[no]
      return { ...d, program: { ...d.program, reviewProgress: next } }
    })
  }, [])

  const addAssessment = useCallback<StoreValue['addAssessment']>((r) => {
    const result: AssessmentResult = { ...r, id: makeId(), createdAt: Date.now() }
    setData((d) => ({ ...d, assessments: [result, ...d.assessments] }))
  }, [])

  // 온보딩 설문 저장 (매일 수면일지와 별도 네임스페이스). 다시 하면 덮어쓴다.
  const saveOnboarding = useCallback<StoreValue['saveOnboarding']>((answers) => {
    setData((d) => ({ ...d, onboarding: { ...answers, updatedAt: Date.now() } }))
  }, [])

  const updateSettings = useCallback<StoreValue['updateSettings']>((patch) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  const replaceAll = useCallback<StoreValue['replaceAll']>((next) => {
    setData(next)
  }, [])

  const resetAll = useCallback<StoreValue['resetAll']>(() => {
    setData(structuredClone(DEFAULT_DATA))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      data,
      addEntry,
      deleteEntry,
      addSleepNote,
      deleteSleepNote,
      setPremiumActive,
      toggleSessionComplete,
      setReviewProgress,
      clearReviewProgress,
      addAssessment,
      saveOnboarding,
      updateSettings,
      replaceAll,
      resetAll,
    }),
    [data, addEntry, deleteEntry, addSleepNote, deleteSleepNote, setPremiumActive, toggleSessionComplete, setReviewProgress, clearReviewProgress, addAssessment, saveOnboarding, updateSettings, replaceAll, resetAll],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 는 StoreProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
