// 배우기 — 4세션 수면 교육 프로그램.
// 스토리형 리더: 한 화면 = 한 조각(교육/규칙/자가검사 문항). 답을 고르면 자동으로 다음.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useStore } from '../store'
import { SESSIONS, sessionByNo } from '../lib/program'
import type { Block, Session, TabId } from '../lib/program'
import { StepFlow } from '../components/StepFlow'
import { formatDate } from '../components/common'
import type { SurveyAnswers } from '../types'
import {
  DEFAULT_SURVEY,
  SLEEP_HOURS_OPTIONS,
  NAP_HOURS_OPTIONS,
  DAY_OPTIONS,
  CANT_SLEEP_OPTIONS,
  CHECK_CLOCK_OPTIONS,
  DAY_LIE_OPTIONS,
  BED_ACTIVITY_OPTIONS,
  summaryRows,
  surveyComments,
} from '../lib/onboarding'
import {
  ISI_ITEMS,
  DBAS_ITEMS,
  DBAS_OPTIONS,
  DBAS_THRESHOLD,
  DSM5_CORE,
  DSM5_CRITERIA,
  interpretISI,
  interpretDBAS,
  interpretSE,
  sleepEfficiency,
  fmtMinutes,
  evaluateDsm5,
  type HabitsInput,
} from '../lib/assessments'

/* ─────────────────────────────── 목록 ─────────────────────────────── */
export function Learn({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data } = useStore()
  const [open, setOpen] = useState<{ no: number; review: boolean } | null>(null)
  const [started, setStarted] = useState(false)
  const [reviewSurvey, setReviewSurvey] = useState(false)
  const done = data.program.completedSessions

  if (open != null) {
    const session = sessionByNo(open.no)
    if (session) {
      return (
        <SessionReader
          session={session}
          review={open.review}
          startPage={open.review ? data.program.reviewProgress[open.no] ?? 0 : 0}
          onBack={() => setOpen(null)}
          onNavigate={onNavigate}
        />
      )
    }
  }

  // 세션1 설문 응답 다시 보기 (읽기 전용)
  if (reviewSurvey && data.onboarding) {
    return (
      <div>
        <button className="btn btn--ghost" style={{ marginBottom: 10 }} onClick={() => setReviewSurvey(false)}>
          ← 돌아가기
        </button>
        <SurveySummaryView survey={data.onboarding} heading="내 수면 습관 점검" />
        <p className="tiny" style={{ marginTop: 14, lineHeight: 1.6 }}>
          {formatDate(data.onboarding.updatedAt)} 응답 · 세션 1을 다시 열면 새로 답할 수 있어요.
        </p>
      </div>
    )
  }

  if (!started) return <LearnIntro onStart={() => setStarted(true)} />

  const completedSessions = SESSIONS.filter((s) => done.includes(s.no))
  const current = SESSIONS.find((s) => !done.includes(s.no)) // 첫 미완료 = 현재 진행 가능

  return (
    <div>
      <div className="card">
        <div className="row-between">
          <div>
            <b style={{ fontSize: 19 }}>수면 교육 4주 과정</b>
            <p className="tiny" style={{ margin: '4px 0 0', fontSize: 13.5 }}>하루 몇 분, 넘기면서 배워요</p>
          </div>
          <span className="slider-value" style={{ minWidth: 'auto' }}>
            {done.length}/{SESSIONS.length}
          </span>
        </div>
        <div className="steps" style={{ marginTop: 12, marginBottom: 0 }}>
          {SESSIONS.map((s) => (
            <span key={s.no} className={`steps__dot ${done.includes(s.no) ? 'steps__dot--done' : ''}`} />
          ))}
        </div>
      </div>

      {/* 세션1에서 답한 '내 수면 습관 점검' 다시 보기 진입점 */}
      {data.onboarding && (
        <button
          className="entry"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', marginTop: 12 }}
          onClick={() => setReviewSurvey(true)}
        >
          <div className="entry__top" style={{ marginBottom: 4 }}>
            <span className="step-eyebrow" style={{ margin: 0, fontSize: 13 }}>내 수면 습관 점검</span>
            <span className="delta" style={{ color: 'var(--accent)', background: 'transparent' }}>답변 다시 보기 →</span>
          </div>
          <p className="tiny" style={{ margin: 0, fontSize: 13.5 }}>세션 1에서 답한 내 수면 습관을 다시 볼 수 있어요.</p>
        </button>
      )}

      {/* 완료한 세션: 개별 탭 가능한 복습 칩 */}
      {completedSessions.length > 0 && (
        <div style={{ margin: '8px 2px 4px' }}>
          <p className="tiny" style={{ margin: '0 2px 6px', fontSize: 13 }}>완료한 세션 · 눌러서 복습</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {completedSessions.map((s) => {
              const resume = (data.program.reviewProgress[s.no] ?? 0) > 0
              return (
                <button
                  key={s.no}
                  className="chip"
                  style={{ fontSize: 13.5, fontWeight: 700, padding: '9px 13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setOpen({ no: s.no, review: true })}
                >
                  세션 {s.no} ✓
                  {resume && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-strong)',
                        borderRadius: 999,
                        padding: '1px 7px',
                      }}
                    >
                      이어보기
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 현재 진행 가능한 세션 1개만 카드로 */}
      {current ? (
        <button
          className="entry"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', borderColor: 'var(--accent-strong)', background: 'var(--accent-soft)', marginTop: 12 }}
          onClick={() => setOpen({ no: current.no, review: false })}
        >
          <div className="entry__top" style={{ marginBottom: 6 }}>
            <span className="step-eyebrow" style={{ margin: 0, fontSize: 13.5 }}>세션 {current.no} · {current.minutes}분</span>
            <span className="delta" style={{ color: 'var(--accent)', background: 'transparent' }}>지금 시작 →</span>
          </div>
          <p className="entry__thought" style={{ margin: '0 0 4px', fontSize: 22, lineHeight: 1.3 }}>{current.title}</p>
          <p className="tiny" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{current.subtitle}</p>
        </button>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>모든 세션을 마쳤어요!</p>
          <p className="tiny" style={{ margin: '4px 0 0' }}>배운 내용을 꾸준히 실천해봐요.</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── 소개 화면 ─────────────────────────── */
function LearnIntro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🌙</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 12px' }}>
        수면을 이해하는<br />4주 과정
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-dim)', margin: 0 }}>
        불면증 인지행동치료(CBT-I) 원리로 구성된 4개 세션이에요. 잠에 대한 오해를 풀고 습관과 생각을 하나씩
        다뤄, 더 편안한 잠에 다가갑니다.
      </p>
      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-faint)', margin: '16px 0 0' }}>
        이 콘텐츠는 자가관리를 돕기 위한 정보이며, 의학적 진단이나 치료를 대신하지 않습니다.
      </p>
      <button className="btn btn--primary btn--block" style={{ fontSize: 18, padding: '17px 0', marginTop: 28 }} onClick={onStart}>
        시작하기
      </button>
    </div>
  )
}

/* ─────────────────────────── 페이지 모델 ─────────────────────────── */
type AssessKind = 'isi' | 'dbas' | 'habits' | 'dsm5'

type Page =
  | { type: 'intro' }
  | { type: 'outro' }
  | { type: 'block'; heading?: string; eyebrow?: string; block: Block }
  | { type: 'rule'; eyebrow: string; n: number; total: number; rule: string; why: string }
  | { type: 'intake'; field: 'why' | 'hardest' }
  | { type: 'q-isi'; idx: number }
  | { type: 'q-dbas'; idx: number }
  | { type: 'q-dsm5core'; idx: number }
  | { type: 'q-dsm5crit'; idx: number }
  | { type: 'habits' }
  | { type: 'result'; kind: AssessKind }
  | { type: 'survey-intro' }
  | { type: 'survey-q'; q: SurveyQKey }
  | { type: 'survey-summary' }

type SurveyQKey = 'bed' | 'wake' | 'sleepHours' | 'cantSleep' | 'checkClock' | 'dayLie' | 'bedActivity' | 'nap'
const SURVEY_QS: SurveyQKey[] = ['bed', 'wake', 'sleepHours', 'cantSleep', 'checkClock', 'dayLie', 'bedActivity', 'nap']

function buildPages(session: Session): Page[] {
  const pages: Page[] = [{ type: 'intro' }]
  let eyebrow: string | undefined
  let firstInGroup = true

  for (const b of session.blocks) {
    if (b.type === 'h') {
      eyebrow = b.text
      firstInGroup = true
      continue
    }
    if (b.type === 'assessment') {
      if (b.kind === 'dsm5') {
        pages.push({ type: 'intake', field: 'why' }, { type: 'intake', field: 'hardest' })
        DSM5_CORE.forEach((_, idx) => pages.push({ type: 'q-dsm5core', idx }))
        DSM5_CRITERIA.forEach((_, idx) => pages.push({ type: 'q-dsm5crit', idx }))
        pages.push({ type: 'result', kind: 'dsm5' })
      } else if (b.kind === 'isi') {
        ISI_ITEMS.forEach((_, idx) => pages.push({ type: 'q-isi', idx }))
        pages.push({ type: 'result', kind: 'isi' })
      } else if (b.kind === 'dbas') {
        DBAS_ITEMS.forEach((_, idx) => pages.push({ type: 'q-dbas', idx }))
        pages.push({ type: 'result', kind: 'dbas' })
      } else {
        pages.push({ type: 'habits' }, { type: 'result', kind: 'habits' })
      }
      eyebrow = undefined
      firstInGroup = true
      continue
    }
    if (b.type === 'survey') {
      pages.push({ type: 'survey-intro' })
      SURVEY_QS.forEach((q) => pages.push({ type: 'survey-q', q }))
      pages.push({ type: 'survey-summary' })
      eyebrow = undefined
      firstInGroup = true
      continue
    }
    if (b.type === 'rules') {
      b.items.forEach((r, i) =>
        pages.push({ type: 'rule', eyebrow: eyebrow ?? '', n: i + 1, total: b.items.length, rule: r.rule, why: r.why }),
      )
      firstInGroup = false
      continue
    }
    pages.push({
      type: 'block',
      heading: firstInGroup ? eyebrow : undefined,
      eyebrow: firstInGroup ? undefined : eyebrow,
      block: b,
    })
    firstInGroup = false
  }

  pages.push({ type: 'outro' })
  return pages
}

/* ─────────────────────────── 답 상태 ─────────────────────────── */
interface Answers {
  isi: Record<number, number>
  dbas: Record<number, number>
  core: Record<string, boolean>
  crit: Record<string, boolean>
  why: string
  hardest: string
  habits: HabitsInput
  survey: SurveyAnswers
}

const emptyAnswers: Answers = {
  isi: {},
  dbas: {},
  core: {},
  crit: {},
  why: '',
  hardest: '',
  habits: { bedTime: '23:00', outTime: '07:00', onsetMin: 20, wasoMin: 20 },
  survey: DEFAULT_SURVEY,
}

/* ─────────────────────────── 리더 ─────────────────────────── */
function SessionReader({
  session,
  review = false,
  startPage = 0,
  onBack,
  onNavigate,
}: {
  session: Session
  review?: boolean
  startPage?: number
  onBack: () => void
  onNavigate: (tab: TabId) => void
}) {
  const { data, toggleSessionComplete, setReviewProgress, clearReviewProgress, addAssessment, saveOnboarding } = useStore()
  const isDone = data.program.completedSessions.includes(session.no)
  const pages = useMemo(() => buildPages(session), [session])
  const [i, setI] = useState(() => Math.min(pages.length - 1, Math.max(0, startPage)))
  // 이전에 온보딩 설문에 답했다면 그 값으로 시작(재응답 시 이어서 편집)
  const [ans, setAns] = useState<Answers>(() => ({ ...emptyAnswers, survey: data.onboarding ?? DEFAULT_SURVEY }))
  const [showExit, setShowExit] = useState(false) // 복습 모드 나가기 확인 모달
  const savedRef = useRef<Set<string>>(new Set())
  const savedSurveyRef = useRef(false)

  const total = pages.length
  const page = pages[i]
  const atEnd = i === total - 1
  const go = (d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d)))
  const next = () => go(1)

  // 결과 페이지에 도달하면 한 번 저장 (복습 모드에서는 저장하지 않음)
  useEffect(() => {
    if (review) return
    if (page.type !== 'result') return
    if (savedRef.current.has(page.kind)) return
    savedRef.current.add(page.kind)
    if (page.kind === 'isi') {
      const totalScore = Object.values(ans.isi).reduce((a, b) => a + b, 0)
      addAssessment({ kind: 'isi', score: totalScore })
    } else if (page.kind === 'dbas') {
      const vals = Object.values(ans.dbas)
      const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
      addAssessment({ kind: 'dbas', score: Math.round(mean * 10) })
    } else if (page.kind === 'habits') {
      const { se, tib, tst } = sleepEfficiency(ans.habits)
      addAssessment({ kind: 'habits', score: se, meta: { tib, tst } })
    } else {
      const { meets } = evaluateDsm5({ core: ans.core, criteria: ans.crit })
      addAssessment({ kind: 'dsm5', score: meets ? 1 : 0, meta: { why: ans.why, hardest: ans.hardest } })
    }
  }, [page, ans, addAssessment, review])

  // 온보딩 설문 요약에 도달하면 한 번 저장 (복습 모드 제외, 별도 네임스페이스)
  useEffect(() => {
    if (review) return
    if (page.type !== 'survey-summary') return
    if (savedSurveyRef.current) return
    savedSurveyRef.current = true
    saveOnboarding(ans.survey)
  }, [page, ans, review, saveOnboarding])

  const nextLabel = review
    ? atEnd
      ? '복습 마치기'
      : '다음'
    : atEnd
      ? isDone
        ? '완료 취소'
        : '세션 완료 ✓'
      : '다음'

  const onNext = atEnd
    ? review
      ? () => {
          // 복습 완주: 진행 상태 변경 없이, 이어보기 지점만 정리하고 목록으로
          clearReviewProgress(session.no)
          onBack()
        }
      : () => {
          toggleSessionComplete(session.no)
          if (!isDone) onBack()
        }
    : next

  // 닫기(X): 복습 모드는 확인 모달, 일반 모드는 바로 나가기
  const onClose = review ? () => setShowExit(true) : onBack

  return (
    <>
      <StepFlow
        step={i}
        total={total}
        onClose={onClose}
        onPrev={() => go(-1)}
        nextLabel={nextLabel}
        onNext={onNext}
        banner={review ? <div className="review-banner">복습 중 · 진행 상태에는 영향 없어요</div> : undefined}
      >
        <PageBody page={page} session={session} ans={ans} setAns={setAns} next={next} onNavigate={onNavigate} />
      </StepFlow>

      {showExit && (
        <div className="modal-backdrop" onClick={() => setShowExit(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-card__title">복습을 여기서 멈출까요?</h3>
            <p className="modal-card__desc">지금까지 본 위치를 저장하면 다음에 이어서 볼 수 있어요.</p>
            <button
              className="btn btn--primary btn--block"
              onClick={() => {
                setReviewProgress(session.no, i)
                onBack()
              }}
            >
              저장하고 나가기
            </button>
            <button
              className="btn btn--ghost btn--block"
              style={{ marginTop: 10 }}
              onClick={() => {
                // 저장 안 함: 기존 저장값이 있으면 그대로 유지(이번 시도 미반영)
                onBack()
              }}
            >
              저장하지 않고 나가기
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ─────────────────────────── 페이지 본문 ─────────────────────────── */
function PageBody({
  page,
  session,
  ans,
  setAns,
  next,
  onNavigate,
}: {
  page: Page
  session: Session
  ans: Answers
  setAns: Dispatch<SetStateAction<Answers>>
  next: () => void
  onNavigate: (tab: TabId) => void
}) {
  switch (page.type) {
    case 'intro':
      return <IntroPage session={session} />
    case 'outro':
      return <OutroPage session={session} />
    case 'block':
      return (
        <div>
          {page.heading && <h2 style={S.bigHeading}>{page.heading}</h2>}
          {page.eyebrow && <div style={S.eyebrow}>{page.eyebrow}</div>}
          <BigBlock block={page.block} onNavigate={onNavigate} />
        </div>
      )
    case 'rule':
      return (
        <div>
          {page.eyebrow && <div style={S.eyebrow}>{page.eyebrow}</div>}
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', marginBottom: 10 }}>
            {page.n} <span style={{ color: 'var(--text-faint)' }}>/ {page.total}</span>
          </div>
          <h2 style={S.bigHeading}>{page.rule}</h2>
          <p style={S.para}>{page.why}</p>
        </div>
      )
    case 'intake':
      return <IntakePage field={page.field} ans={ans} setAns={setAns} />
    case 'q-isi': {
      const item = ISI_ITEMS[page.idx]
      return (
        <QuestionPage eyebrow={`불면증 지수 · ${page.idx + 1}/${ISI_ITEMS.length}`} question={item.text}>
          <OptionList
            options={item.labels.map((label, v) => ({ label, v }))}
            selected={ans.isi[page.idx]}
            onPick={(v) => {
              setAns((a) => ({ ...a, isi: { ...a.isi, [page.idx]: v } }))
              next()
            }}
          />
        </QuestionPage>
      )
    }
    case 'q-dbas': {
      return (
        <QuestionPage eyebrow={`수면에 대한 생각 · ${page.idx + 1}/${DBAS_ITEMS.length}`} question={`"${DBAS_ITEMS[page.idx]}"`}>
          <p className="tiny" style={{ margin: '-6px 0 14px' }}>이 생각에 얼마나 동의하나요? (아래일수록 강하게 동의)</p>
          <OptionList
            options={DBAS_OPTIONS}
            selected={ans.dbas[page.idx]}
            onPick={(v) => {
              setAns((a) => ({ ...a, dbas: { ...a.dbas, [page.idx]: v } }))
              next()
            }}
          />
        </QuestionPage>
      )
    }
    case 'q-dsm5core': {
      const item = DSM5_CORE[page.idx]
      return (
        <QuestionPage eyebrow="요즘 내 잠은…" question={item.text}>
          <YesNo
            value={ans.core[item.key]}
            onPick={(yes) => {
              setAns((a) => ({ ...a, core: { ...a.core, [item.key]: yes } }))
              next()
            }}
          />
        </QuestionPage>
      )
    }
    case 'q-dsm5crit': {
      const item = DSM5_CRITERIA[page.idx]
      return (
        <QuestionPage eyebrow="이것도 맞나요?" question={item.text}>
          <YesNo
            value={ans.crit[item.key]}
            onPick={(yes) => {
              setAns((a) => ({ ...a, crit: { ...a.crit, [item.key]: yes } }))
              next()
            }}
          />
        </QuestionPage>
      )
    }
    case 'habits':
      return <HabitsPage ans={ans} setAns={setAns} />
    case 'result':
      return <ResultPage kind={page.kind} ans={ans} />
    case 'survey-intro':
      return <SurveyIntroPage />
    case 'survey-q':
      return (
        <SurveyQuestion
          q={page.q}
          survey={ans.survey}
          setSurvey={(patch) => setAns((a) => ({ ...a, survey: { ...a.survey, ...patch } }))}
          next={next}
        />
      )
    case 'survey-summary':
      return <SurveySummaryView survey={ans.survey} />
  }
}

/* ─────────────────────────── 개별 페이지 ─────────────────────────── */
function IntroPage({ session }: { session: Session }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>세션 {session.no} · 약 {session.minutes}분</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, margin: '4px 0 10px' }}>
        {session.title}
      </h1>
      <p style={{ fontSize: 17, color: 'var(--text-dim)', margin: '0 0 26px' }}>{session.subtitle}</p>
      <p style={{ fontSize: 19, lineHeight: 1.8 }}>{session.intro}</p>
    </div>
  )
}

function OutroPage({ session }: { session: Session }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
      <h2 style={{ fontSize: 27, fontWeight: 800, margin: '0 0 22px' }}>핵심만 기억해요</h2>
      {session.takeaways.map((t, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--good)', fontWeight: 800, fontSize: 22 }}>✓</span>
          <span style={{ fontSize: 19, lineHeight: 1.6 }}>{t}</span>
        </div>
      ))}
    </div>
  )
}

function IntakePage({
  field,
  ans,
  setAns,
}: {
  field: 'why' | 'hardest'
  ans: Answers
  setAns: Dispatch<SetStateAction<Answers>>
}) {
  const isWhy = field === 'why'
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>잠깐, 나에 대해</div>
      <h2 style={S.bigHeading}>{isWhy ? '어쩌다 이 프로그램을 찾게 되셨나요?' : '요즘 가장 힘든 점은 무엇인가요?'}</h2>
      <p className="tiny" style={{ margin: '-8px 0 14px' }}>편하게 한두 줄 · 건너뛰어도 괜찮아요</p>
      <textarea
        value={isWhy ? ans.why : ans.hardest}
        onChange={(e) => setAns((a) => ({ ...a, [field]: e.target.value }))}
        placeholder={isWhy ? '예: 3개월째 새벽에 자꾸 깨서…' : '예: 잠은 드는데 2~3시에 깨면 다시 못 잠'}
        style={{ minHeight: 120, fontSize: 17 }}
        autoFocus
      />
    </div>
  )
}

function QuestionPage({ eyebrow, question, children }: { eyebrow: string; question: string; children: ReactNode }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>{eyebrow}</div>
      <h2 style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.4, margin: '0 0 20px' }}>{question}</h2>
      {children}
    </div>
  )
}

function OptionList({
  options,
  selected,
  onPick,
}: {
  options: { label: string; v: number }[]
  selected: number | undefined
  onPick: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((o) => (
        <button
          key={o.v}
          className={`chip chip--block ${selected === o.v ? 'chip--on' : ''}`}
          style={{ fontSize: 17, padding: '16px 16px', textAlign: 'center', fontWeight: 700 }}
          onClick={() => onPick(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function YesNo({ value, onPick }: { value: boolean | undefined; onPick: (yes: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <button
        className={`chip ${value === true ? 'chip--on' : ''}`}
        style={{ flex: 1, fontSize: 19, padding: '22px 0', fontWeight: 800, borderRadius: 14 }}
        onClick={() => onPick(true)}
      >
        예
      </button>
      <button
        className={`chip ${value === false ? 'chip--on' : ''}`}
        style={{ flex: 1, fontSize: 19, padding: '22px 0', fontWeight: 800, borderRadius: 14 }}
        onClick={() => onPick(false)}
      >
        아니오
      </button>
    </div>
  )
}

function HabitsPage({ ans, setAns }: { ans: Answers; setAns: Dispatch<SetStateAction<Answers>> }) {
  const h = ans.habits
  const set = (patch: Partial<HabitsInput>) => setAns((a) => ({ ...a, habits: { ...a.habits, ...patch } }))
  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elev)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 12,
    padding: '14px 14px',
    fontSize: 18,
  } as const
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>나의 수면 습관</div>
      <h2 style={S.bigHeading}>어젯밤은 어땠나요?</h2>
      <label className="field">
        <span className="field__label" style={{ fontSize: 15 }}>잠자리에 누운 시각</span>
        <input type="time" value={h.bedTime} onChange={(e) => set({ bedTime: e.target.value })} style={inputStyle} />
      </label>
      <label className="field">
        <span className="field__label" style={{ fontSize: 15 }}>아침에 잠자리에서 나온 시각</span>
        <input type="time" value={h.outTime} onChange={(e) => set({ outTime: e.target.value })} style={inputStyle} />
      </label>
      <label className="field">
        <span className="field__label" style={{ fontSize: 15 }}>잠들기까지 걸린 시간 (분)</span>
        <input type="number" min={0} inputMode="numeric" value={h.onsetMin} onChange={(e) => set({ onsetMin: Math.max(0, Number(e.target.value)) })} style={inputStyle} />
      </label>
      <label className="field">
        <span className="field__label" style={{ fontSize: 15 }}>밤중에 깨어 있던 총 시간 (분)</span>
        <input type="number" min={0} inputMode="numeric" value={h.wasoMin} onChange={(e) => set({ wasoMin: Math.max(0, Number(e.target.value)) })} style={inputStyle} />
      </label>
      <p className="tiny">입력하고 ‘다음’을 누르면 수면효율이 계산돼요.</p>
    </div>
  )
}

/* ─────────────────────────── 결과 페이지 ─────────────────────────── */
function ResultPage({ kind, ans }: { kind: AssessKind; ans: Answers }) {
  if (kind === 'isi') {
    const total = Object.values(ans.isi).reduce((a, b) => a + b, 0)
    const v = interpretISI(total)
    return (
      <ResultShell title="불면증 지수 결과">
        <BigScore value={`${total}`} unit="/ 28" band={v.band} tone={v.tone} fill={(total / 28) * 100} />
        <p className="tiny" style={{ marginTop: 14 }}>기준: 0-7 없음 · 8-14 역치하 · 15-21 중등도 · 22-28 중증 (ISI, Morin)</p>
      </ResultShell>
    )
  }
  if (kind === 'dbas') {
    const vals = Object.values(ans.dbas)
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const v = interpretDBAS(mean)
    return (
      <ResultShell title="수면에 대한 생각 결과">
        <BigScore value={mean.toFixed(1)} unit="/ 10" band={v.band} tone={v.tone} fill={mean * 10} />
        <p style={{ fontSize: 15, lineHeight: 1.7, marginTop: 14 }}>
          점수가 <b>낮을수록</b> 잠에 대한 생각이 유연하고, <b>높을수록</b>(기준 {DBAS_THRESHOLD} 초과) 잠에 대한
          부담·걱정이 강한 편이에요. 세션 3에서 이런 생각을 다루는 법을 배웁니다.
        </p>
      </ResultShell>
    )
  }
  if (kind === 'habits') {
    const { se, tib, tst } = sleepEfficiency(ans.habits)
    const v = interpretSE(se)
    return (
      <ResultShell title="수면효율 결과">
        <BigScore value={`${se}`} unit="%" band={v.band} tone={v.tone} fill={se} />
        <p style={{ fontSize: 15, lineHeight: 1.7, marginTop: 14 }}>
          침대에 <b>{fmtMinutes(tib)}</b> 머무는 동안 약 <b>{fmtMinutes(tst)}</b> 주무셨어요. 목표는 <b>85% 이상</b>이에요.
        </p>
      </ResultShell>
    )
  }
  // dsm5
  const { meets, reasons } = evaluateDsm5({ core: ans.core, criteria: ans.crit })
  return (
    <ResultShell title="불면장애 자가점검 결과">
      <div
        className="card"
        style={{
          textAlign: 'center',
          borderColor: meets ? 'var(--warn)' : 'var(--good)',
          background: meets ? 'rgba(251,191,36,0.08)' : 'rgba(52,211,153,0.08)',
        }}
      >
        <div style={{ fontSize: 40 }}>{meets ? '🔎' : '🙂'}</div>
        <p style={{ fontWeight: 800, fontSize: 19, margin: '8px 0 6px', color: meets ? 'var(--warn)' : 'var(--good)' }}>
          {meets ? 'DSM-5 불면장애 기준에 해당해요' : '현재 기준에는 해당하지 않아요'}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: 'var(--text-dim)' }}>
          {meets
            ? '이 프로그램이 도움이 될 수 있어요. 다만 이건 교육용 자가점검이며 진단이 아닙니다.'
            : '그래도 수면이 불편하면 이 프로그램의 습관·생각 다루기가 도움이 됩니다.'}
        </p>
      </div>
      {reasons.length > 0 && (
        <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
          {reasons.map((r, idx) => (
            <li key={idx} className="tiny" style={{ marginBottom: 5 }}>{r}</li>
          ))}
        </ul>
      )}
    </ResultShell>
  )
}

function ResultShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>결과</div>
      <h2 style={S.bigHeading}>{title}</h2>
      {children}
    </div>
  )
}

const toneColor = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--danger)' } as const

function BigScore({
  value,
  unit,
  band,
  tone,
  fill,
}: {
  value: string
  unit: string
  band: string
  tone: 'good' | 'warn' | 'bad'
  fill: number
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: toneColor[tone] }}>{value}</span>
        <span style={{ fontSize: 18, color: 'var(--text-faint)', fontWeight: 700 }}>{unit}</span>
      </div>
      <p style={{ fontSize: 17, fontWeight: 700, color: toneColor[tone], margin: '4px 0 12px' }}>{band}</p>
      <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-elev)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(3, Math.min(100, fill))}%`, height: '100%', background: toneColor[tone] }} />
      </div>
    </div>
  )
}

/* ─────────────────────────── 교육 블록 (큰 글씨) ─────────────────────────── */
function BigBlock({ block, onNavigate }: { block: Block; onNavigate: (tab: TabId) => void }) {
  switch (block.type) {
    case 'h':
      return <h2 style={S.bigHeading}>{block.text}</h2>
    case 'p':
      return <p style={S.para}>{block.text}</p>
    case 'list':
      return (
        <ul style={{ margin: 0, paddingLeft: 2, listStyle: 'none' }}>
          {block.items.map((it, idx) => (
            <li key={idx} style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 18, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 800 }}>·</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <div className="card" style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'var(--good)' }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7 }}>💡 {block.text}</p>
        </div>
      )
    case 'caution':
      return (
        <div className="disclaimer" style={{ fontSize: 16, lineHeight: 1.7 }}>⚠️ {block.text}</div>
      )
    case 'key':
      return (
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-strong)' }}>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.7, fontWeight: 600 }}>🔑 {block.text}</p>
        </div>
      )
    case 'rules':
      return null // 페이지 분해에서 개별 처리
    case 'practice':
      return (
        <button
          className="card"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', borderColor: 'var(--good)', background: 'rgba(52, 211, 153, 0.06)', padding: 18 }}
          onClick={() => onNavigate(block.tab)}
        >
          <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--good)' }}>▶ 지금 해보기</p>
          <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{block.label}</p>
          <p className="tiny" style={{ margin: 0 }}>{block.desc}</p>
        </button>
      )
    case 'assessment':
      return null // 페이지 분해에서 문항 페이지로 처리
    case 'survey':
      return null // 페이지 분해에서 설문 페이지로 처리
  }
}

/* ─────────────────────────── 온보딩 설문 ─────────────────────────── */
const surveyH = {
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.4,
  margin: '0 0 22px',
  whiteSpace: 'pre-line',
} as const

const SURVEY_TIME = {
  width: '100%',
  background: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 14,
  padding: '18px',
  fontSize: 26,
  fontWeight: 700,
  textAlign: 'center' as const,
}

function SurveyQ({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>나의 수면 습관</div>
      <h2 style={surveyH}>{title}</h2>
      {children}
    </div>
  )
}

function SurveyIntroPage() {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>🛏️</div>
      <h2 style={surveyH}>{'나의 수면 습관에 대해\n생각해봅시다'}</h2>
      <p style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--text-dim)', margin: 0 }}>
        몇 가지 질문에 답하면서, 내 수면 습관을 스스로 점검해볼게요. 정답은 없어요 — 편하게 지금의 나를 떠올리며
        골라보세요.
      </p>
      <p className="tiny" style={{ margin: '18px 0 0', lineHeight: 1.6 }}>아래 ‘다음’을 눌러 시작하세요.</p>
    </div>
  )
}

function SurveyChoices({
  options,
  selected,
  onPick,
}: {
  options: readonly { value: string; label: string }[]
  selected: string
  onPick: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((o) => (
        <button
          key={o.value}
          className={`chip chip--block ${selected === o.value ? 'chip--on' : ''}`}
          style={{ fontSize: 17, padding: '16px', textAlign: 'center', fontWeight: 700 }}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const WHEEL_ROW = 56

function Wheel({
  options,
  value,
  onChange,
}: {
  options: { v: number; label: string }[]
  value: number
  onChange: (v: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, options.findIndex((o) => Math.abs(o.v - value) < 1e-6))
    el.scrollTop = idx * WHEEL_ROW
  }, []) // 최초 진입 시 현재 값 위치로

  function onScroll() {
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / WHEEL_ROW)))
    if (Math.abs(options[idx].v - value) > 1e-6) onChange(options[idx].v)
  }

  function scrollTo(idx: number) {
    ref.current?.scrollTo({ top: idx * WHEEL_ROW, behavior: 'smooth' })
    onChange(options[idx].v)
  }

  return (
    <div style={{ position: 'relative', height: WHEEL_ROW * 3 }}>
      <div
        style={{
          position: 'absolute',
          top: WHEEL_ROW,
          height: WHEEL_ROW,
          left: 0,
          right: 0,
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          pointerEvents: 'none',
        }}
      />
      <div ref={ref} className="wheelpick" style={{ height: WHEEL_ROW * 3 }} onScroll={onScroll}>
        <div style={{ height: WHEEL_ROW }} />
        {options.map((o, idx) => {
          const on = Math.abs(o.v - value) < 1e-6
          return (
            <div
              key={o.v}
              className="wheelpick__row"
              style={{
                height: WHEEL_ROW,
                fontSize: on ? 26 : 19,
                fontWeight: on ? 800 : 600,
                opacity: on ? 1 : 0.35,
                transition: 'font-size 0.1s, opacity 0.1s',
              }}
              onClick={() => scrollTo(idx)}
            >
              {o.label}
            </div>
          )
        })}
        <div style={{ height: WHEEL_ROW }} />
      </div>
    </div>
  )
}

function SurveyQuestion({
  q,
  survey,
  setSurvey,
  next,
}: {
  q: SurveyQKey
  survey: SurveyAnswers
  setSurvey: (patch: Partial<SurveyAnswers>) => void
  next: () => void
}) {
  switch (q) {
    case 'bed':
      return (
        <SurveyQ title={'평소(최근 2주 동안)\n몇 시에 잠자리에 드시나요?'}>
          <input type="time" value={survey.bedTime} onChange={(e) => setSurvey({ bedTime: e.target.value })} style={SURVEY_TIME} />
        </SurveyQ>
      )
    case 'wake':
      return (
        <SurveyQ title={'몇 시에\n잠자리에서 일어나시나요?'}>
          <input type="time" value={survey.wakeTime} onChange={(e) => setSurvey({ wakeTime: e.target.value })} style={SURVEY_TIME} />
        </SurveyQ>
      )
    case 'sleepHours':
      return (
        <SurveyQ title={'그렇다면 누워있는 시간 중\n몇 시간이나 주무시나요?'}>
          <Wheel options={SLEEP_HOURS_OPTIONS} value={survey.sleepHours} onChange={(v) => setSurvey({ sleepHours: v })} />
        </SurveyQ>
      )
    case 'cantSleep':
      return (
        <SurveyQ title={'잠이 안 오면\n뭘 하시나요?'}>
          <SurveyChoices
            options={CANT_SLEEP_OPTIONS}
            selected={survey.cantSleepAct}
            onPick={(v) => {
              setSurvey({ cantSleepAct: v as SurveyAnswers['cantSleepAct'] })
              if (v !== 'custom') next()
            }}
          />
          {survey.cantSleepAct === 'custom' && (
            <textarea
              value={survey.cantSleepActText}
              onChange={(e) => setSurvey({ cantSleepActText: e.target.value })}
              placeholder="예: 물을 마시거나 화장실에 다녀온다"
              style={{ marginTop: 12, minHeight: 70, fontSize: 16 }}
              autoFocus
            />
          )}
        </SurveyQ>
      )
    case 'checkClock':
      return (
        <SurveyQ title={'잠이 안 오거나 중간에 깨면\n시간을 확인하시나요?'}>
          <SurveyChoices
            options={CHECK_CLOCK_OPTIONS}
            selected={survey.checkClock}
            onPick={(v) => {
              setSurvey({ checkClock: v as SurveyAnswers['checkClock'] })
              next()
            }}
          />
        </SurveyQ>
      )
    case 'dayLie':
      return (
        <SurveyQ title={'혹시 낮에도\n누워서 지내지는 않으시나요?'}>
          <SurveyChoices
            options={DAY_LIE_OPTIONS}
            selected={survey.dayLie}
            onPick={(v) => {
              setSurvey({ dayLie: v as SurveyAnswers['dayLie'] })
              next()
            }}
          />
        </SurveyQ>
      )
    case 'bedActivity':
      return (
        <SurveyQ title={'낮에도 침대(잠자리)에서\n생활하시지는 않나요?'}>
          <SurveyChoices
            options={BED_ACTIVITY_OPTIONS}
            selected={survey.bedActivity}
            onPick={(v) => {
              setSurvey({ bedActivity: v as SurveyAnswers['bedActivity'] })
              if (v !== 'other') next()
            }}
          />
          {survey.bedActivity === 'other' && (
            <textarea
              value={survey.bedActivityText}
              onChange={(e) => setSurvey({ bedActivityText: e.target.value })}
              placeholder="예: 침대에서 일이나 공부를 한다"
              style={{ marginTop: 12, minHeight: 70, fontSize: 16 }}
              autoFocus
            />
          )}
        </SurveyQ>
      )
    case 'nap':
      return (
        <SurveyQ title={'낮잠은\n얼마나 주무시나요?'}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.eyebrow, textAlign: 'center' }}>낮잠 시간</div>
              <Wheel options={NAP_HOURS_OPTIONS} value={survey.napHours} onChange={(v) => setSurvey({ napHours: v })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.eyebrow, textAlign: 'center' }}>일주일에</div>
              <Wheel options={DAY_OPTIONS} value={survey.napDaysPerWeek} onChange={(v) => setSurvey({ napDaysPerWeek: v })} />
            </div>
          </div>
          <p className="tiny" style={{ marginTop: 14, textAlign: 'center' }}>낮잠을 거의 안 주무시면 둘 다 0으로 두세요.</p>
        </SurveyQ>
      )
  }
}

function SurveySummaryView({ survey, heading = '이렇게 답해주셨어요' }: { survey: SurveyAnswers; heading?: string }) {
  const rows = summaryRows(survey)
  const comments = surveyComments(survey)
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={S.eyebrow}>나의 수면 습관</div>
      <h2 style={S.bigHeading}>{heading}</h2>

      <div className="card" style={{ padding: '4px 14px' }}>
        {rows.map((r, idx) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '9px 0',
              borderTop: idx ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text-dim)', flexShrink: 0 }}>{r.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, textAlign: 'right' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {comments.length > 0 ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map((c, idx) => (
            <div key={idx} className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-strong)', padding: 14 }}>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>{c}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="tiny" style={{ marginTop: 14, lineHeight: 1.7 }}>
          지금 습관에서 특별히 걸리는 부분은 눈에 띄지 않았어요. 앞으로 세션을 따라가며 내 잠을 더 이해해봐요.
        </p>
      )}
    </div>
  )
}

const S = {
  bigHeading: { fontSize: 25, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.4, margin: '0 0 16px' } as const,
  eyebrow: { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const,
  para: { fontSize: 19, lineHeight: 1.8, color: 'var(--text)', margin: '0 0 16px' } as const,
}
