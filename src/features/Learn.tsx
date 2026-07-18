// 배우기 — 4세션 수면 교육 프로그램.
// 스토리형 리더: 한 화면 = 한 조각(교육/규칙/자가검사 문항). 답을 고르면 자동으로 다음.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useStore } from '../store'
import { SESSIONS, sessionByNo } from '../lib/program'
import type { Block, Session, TabId } from '../lib/program'
import { Disclaimer } from '../components/common'
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
  const [openNo, setOpenNo] = useState<number | null>(null)
  const done = data.program.completedSessions

  if (openNo != null) {
    const session = sessionByNo(openNo)
    if (session) {
      return <SessionReader session={session} onBack={() => setOpenNo(null)} onNavigate={onNavigate} />
    }
  }

  return (
    <div>
      <div className="card">
        <div className="row-between">
          <div>
            <b style={{ fontSize: 16 }}>수면 교육 4주 과정</b>
            <p className="tiny" style={{ margin: '3px 0 0' }}>하루 몇 분, 넘기면서 배워요</p>
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

      {SESSIONS.map((s) => {
        const isDone = done.includes(s.no)
        return (
          <button
            key={s.no}
            className="entry"
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--card)' }}
            onClick={() => setOpenNo(s.no)}
          >
            <div className="entry__top" style={{ marginBottom: 4 }}>
              <span className="step-eyebrow" style={{ margin: 0 }}>세션 {s.no} · {s.minutes}분</span>
              {isDone ? <span className="delta delta--down">✓ 완료</span> : <span className="delta delta--flat">시작 →</span>}
            </div>
            <p className="entry__thought" style={{ margin: '0 0 2px', fontSize: 17 }}>{s.title}</p>
            <p className="tiny" style={{ margin: 0 }}>{s.subtitle}</p>
          </button>
        )
      })}

      <div style={{ marginTop: 16 }}>
        <Disclaimer />
      </div>
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
}

const emptyAnswers: Answers = {
  isi: {},
  dbas: {},
  core: {},
  crit: {},
  why: '',
  hardest: '',
  habits: { bedTime: '23:00', outTime: '07:00', onsetMin: 20, wasoMin: 20 },
}

/* ─────────────────────────── 리더 ─────────────────────────── */
function SessionReader({
  session,
  onBack,
  onNavigate,
}: {
  session: Session
  onBack: () => void
  onNavigate: (tab: TabId) => void
}) {
  const { data, toggleSessionComplete, addAssessment } = useStore()
  const isDone = data.program.completedSessions.includes(session.no)
  const pages = useMemo(() => buildPages(session), [session])
  const [i, setI] = useState(0)
  const [ans, setAns] = useState<Answers>(emptyAnswers)
  const savedRef = useRef<Set<string>>(new Set())

  const total = pages.length
  const page = pages[i]
  const atEnd = i === total - 1
  const go = (d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d)))
  const next = () => go(1)

  // 결과 페이지에 도달하면 한 번 저장
  useEffect(() => {
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
  }, [page, ans, addAssessment])

  return (
    <div style={{ minHeight: '76vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단: 닫기 + 진행바 */}
      <div className="row-between" style={{ marginBottom: 24, gap: 12 }}>
        <button
          className="btn btn--ghost"
          style={{ padding: '4px 10px', fontSize: 20, lineHeight: 1, border: 'none' }}
          onClick={onBack}
          aria-label="목록으로"
        >
          ✕
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--bg-elev)', overflow: 'hidden' }}>
          <div style={{ width: `${((i + 1) / total) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.25s' }} />
        </div>
        <span className="tiny" style={{ minWidth: 40, textAlign: 'right' }}>{i + 1}/{total}</span>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1 }}>
        <PageBody page={page} session={session} ans={ans} setAns={setAns} next={next} onNavigate={onNavigate} />
      </div>

      {/* 하단 내비 */}
      <div className="btn-row" style={{ marginTop: 24 }}>
        {i > 0 && (
          <button className="btn btn--ghost" style={{ flex: '0 0 84px', fontSize: 16, padding: '16px 0' }} onClick={() => go(-1)}>
            이전
          </button>
        )}
        {!atEnd ? (
          <button className="btn btn--primary" style={{ fontSize: 18, padding: '16px 0' }} onClick={next}>
            다음
          </button>
        ) : (
          <button
            className={`btn ${isDone ? '' : 'btn--primary'}`}
            style={{ fontSize: 18, padding: '16px 0' }}
            onClick={() => {
              toggleSessionComplete(session.no)
              if (!isDone) onBack()
            }}
          >
            {isDone ? '완료 취소' : '세션 완료 ✓'}
          </button>
        )}
      </div>
    </div>
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
  }
}

const S = {
  bigHeading: { fontSize: 25, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.4, margin: '0 0 16px' } as const,
  eyebrow: { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const,
  para: { fontSize: 19, lineHeight: 1.8, color: 'var(--text)', margin: '0 0 16px' } as const,
}
