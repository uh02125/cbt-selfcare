// 1회기 자가검사 컴포넌트: ISI, DBAS-16, 수면효율(습관), DSM-5.
// 각 컴포넌트는 스스로 상태를 관리하고, 완료 시 결과를 저장하며,
// 지난 결과가 있으면 요약을 보여줍니다.

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../store'
import {
  ISI_ITEMS,
  DBAS_ITEMS,
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
  type Dsm5Answers,
} from '../lib/assessments'
import type { AssessmentResult } from '../types'

const toneColor = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--danger)' } as const

/* 공통: 결과 요약 막대 */
function ResultBar({
  scoreText,
  band,
  tone,
  fill,
  note,
}: {
  scoreText: string
  band: string
  tone: 'good' | 'warn' | 'bad'
  fill: number // 0~100
  note?: string
}) {
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: toneColor[tone] }}>{scoreText}</span>
        <span className="delta" style={{ background: 'transparent', color: toneColor[tone], fontSize: 13 }}>
          {band}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-elev)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(3, Math.min(100, fill))}%`, height: '100%', background: toneColor[tone] }} />
      </div>
      {note && <p className="tiny" style={{ marginTop: 8 }}>{note}</p>}
    </div>
  )
}

function lastOf(kind: AssessmentResult['kind'], list: AssessmentResult[]) {
  return list.find((r) => r.kind === kind)
}

/* ───────────────────────────── ISI ───────────────────────────── */
export function IsiQuiz() {
  const { data, addAssessment } = useStore()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [retake, setRetake] = useState(false)
  const last = lastOf('isi', data.assessments)

  const total = ISI_ITEMS.reduce((s, it) => s + (answers[it.key] ?? 0), 0)
  const allAnswered = ISI_ITEMS.every((it) => answers[it.key] != null)
  const view = interpretISI(total)

  function submit() {
    addAssessment({ kind: 'isi', score: total })
    setSubmitted(true)
  }

  if (!submitted && last && !retake) {
    const v = interpretISI(last.score)
    return (
      <QuizShell title="불면증 지수 (ISI)" subtitle="지난 검사 결과">
        <ResultBar scoreText={`${last.score} / 28`} band={v.band} tone={v.tone} fill={(last.score / 28) * 100} />
        <RetakeButton onClick={() => { setAnswers({}); setRetake(true) }} />
      </QuizShell>
    )
  }

  if (submitted) {
    return (
      <QuizShell title="불면증 지수 (ISI)" subtitle="결과">
        <ResultBar
          scoreText={`${total} / 28`}
          band={view.band}
          tone={view.tone}
          fill={(total / 28) * 100}
          note="기준: 0-7 없음 · 8-14 역치하 · 15-21 중등도 · 22-28 중증 (Morin, ISI)"
        />
      </QuizShell>
    )
  }

  return (
    <QuizShell title="불면증 지수 (ISI)" subtitle="최근 2주 기준으로 골라주세요 · 7문항">
      {ISI_ITEMS.map((it) => (
        <div key={it.key} style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 7px' }}>{it.text}</p>
          <div className="chips">
            {it.labels.map((lb, v) => (
              <button
                key={v}
                className={`chip ${answers[it.key] === v ? 'chip--on' : ''}`}
                style={{ flex: 1, padding: '7px 4px', fontSize: 11.5, textAlign: 'center' }}
                onClick={() => setAnswers((a) => ({ ...a, [it.key]: v }))}
              >
                {lb}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn btn--primary btn--block" disabled={!allAnswered} onClick={submit}>
        결과 보기
      </button>
    </QuizShell>
  )
}

/* ───────────────────────────── DBAS-16 ───────────────────────────── */
export function DbasQuiz() {
  const { data, addAssessment } = useStore()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [retake, setRetake] = useState(false)
  const last = lastOf('dbas', data.assessments)

  const answeredCount = Object.keys(answers).length
  const mean = answeredCount > 0 ? Object.values(answers).reduce((a, b) => a + b, 0) / DBAS_ITEMS.length : 0

  if (!submitted && last && !retake) {
    const savedMean = last.score / 10
    const v = interpretDBAS(savedMean)
    return (
      <QuizShell title="수면에 대한 나의 생각 (DBAS-16)" subtitle="지난 검사 결과">
        <ResultBar scoreText={`평균 ${savedMean.toFixed(1)} / 10`} band={v.band} tone={v.tone} fill={savedMean * 10} />
        <RetakeButton onClick={() => setRetake(true)} />
      </QuizShell>
    )
  }

  if (submitted) {
    const v = interpretDBAS(mean)
    return (
      <QuizShell title="수면에 대한 나의 생각 (DBAS-16)" subtitle="결과">
        <ResultBar
          scoreText={`평균 ${mean.toFixed(1)} / 10`}
          band={v.band}
          tone={v.tone}
          fill={mean * 10}
          note={`참고: 항목평균 ${DBAS_THRESHOLD} 초과면 불면 관련 생각이 강한 편 (Morin 2007). 낮을수록 유연해요.`}
        />
      </QuizShell>
    )
  }

  return (
    <QuizShell title="수면에 대한 나의 생각 (DBAS-16)" subtitle="동의하는 정도를 0~10으로 · 16문항">
      {DBAS_ITEMS.map((text, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, margin: '0 0 4px', lineHeight: 1.5 }}>
            <b className="faint" style={{ marginRight: 4 }}>{i + 1}.</b>
            {text}
          </p>
          <div className="slider-wrap">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={answers[i] ?? 5}
              onChange={(e) => setAnswers((a) => ({ ...a, [i]: Number(e.target.value) }))}
            />
            <span className="slider-value" style={{ minWidth: 60 }}>
              {answers[i] ?? '—'}
              <small style={{ display: 'block' }}>{answers[i] == null ? '미응답' : ''}</small>
            </span>
          </div>
        </div>
      ))}
      <p className="tiny" style={{ marginBottom: 8 }}>
        0 = 전혀 아니다 · 10 = 매우 그렇다 ({answeredCount}/{DBAS_ITEMS.length} 응답)
      </p>
      <button
        className="btn btn--primary btn--block"
        disabled={answeredCount < DBAS_ITEMS.length}
        onClick={() => {
          addAssessment({ kind: 'dbas', score: Math.round(mean * 10) })
          setSubmitted(true)
        }}
      >
        결과 보기
      </button>
    </QuizShell>
  )
}

/* ───────────────────────────── 수면효율 (습관) ───────────────────────────── */
export function HabitsForm() {
  const { data, addAssessment } = useStore()
  const [h, setH] = useState<HabitsInput>({ bedTime: '23:00', outTime: '07:00', onsetMin: 20, wasoMin: 20 })
  const [submitted, setSubmitted] = useState(false)
  const [retake, setRetake] = useState(false)
  const last = lastOf('habits', data.assessments)

  const { tib, tst, se } = sleepEfficiency(h)
  const v = interpretSE(se)

  if (!submitted && last && !retake) {
    const lv = interpretSE(last.score)
    return (
      <QuizShell title="나의 수면 습관 · 수면효율" subtitle="지난 결과">
        <ResultBar scoreText={`${last.score}%`} band={lv.band} tone={lv.tone} fill={last.score} />
        <RetakeButton onClick={() => setRetake(true)} />
      </QuizShell>
    )
  }

  if (submitted) {
    return (
      <QuizShell title="나의 수면 습관 · 수면효율" subtitle="결과">
        <ResultBar
          scoreText={`${se}%`}
          band={v.band}
          tone={v.tone}
          fill={se}
          note={`침대에 ${fmtMinutes(tib)} 머무는 동안 약 ${fmtMinutes(tst)} 잠. 목표: 85% 이상 (CBT-I 표준).`}
        />
      </QuizShell>
    )
  }

  return (
    <QuizShell title="나의 수면 습관 · 수면효율" subtitle="어젯밤(또는 평소) 기준으로 입력해요">
      <TimeField label="잠자리에 누운 시각" value={h.bedTime} onChange={(bedTime) => setH({ ...h, bedTime })} />
      <TimeField label="아침에 잠자리에서 나온 시각" value={h.outTime} onChange={(outTime) => setH({ ...h, outTime })} />
      <NumField label="잠들기까지 걸린 시간(분)" value={h.onsetMin} onChange={(onsetMin) => setH({ ...h, onsetMin })} />
      <NumField label="밤중에 깨어 있던 총 시간(분)" value={h.wasoMin} onChange={(wasoMin) => setH({ ...h, wasoMin })} />
      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: 6 }}
        onClick={() => {
          addAssessment({ kind: 'habits', score: se, meta: { tib, tst } })
          setSubmitted(true)
        }}
      >
        수면효율 계산하기
      </button>
    </QuizShell>
  )
}

/* ───────────────────────────── DSM-5 자가점검 ───────────────────────────── */
export function Dsm5Check() {
  const { data, addAssessment } = useStore()
  const [why, setWhy] = useState('')
  const [hardest, setHardest] = useState('')
  const [ans, setAns] = useState<Dsm5Answers>({ core: {}, criteria: {} })
  const [submitted, setSubmitted] = useState(false)
  const [retake, setRetake] = useState(false)
  const last = lastOf('dsm5', data.assessments)

  const result = evaluateDsm5(ans)

  if (!submitted && last && !retake) {
    return (
      <QuizShell title="불면장애 자가점검 (DSM-5 기준)" subtitle="지난 결과">
        <Verdict meets={last.score === 1} reasons={[]} />
        <RetakeButton onClick={() => setRetake(true)} />
      </QuizShell>
    )
  }

  if (submitted) {
    return (
      <QuizShell title="불면장애 자가점검 (DSM-5 기준)" subtitle="결과">
        <Verdict meets={result.meets} reasons={result.reasons} />
      </QuizShell>
    )
  }

  const toggleCore = (k: string) => setAns((a) => ({ ...a, core: { ...a.core, [k]: !a.core[k] } }))
  const toggleCrit = (k: string) => setAns((a) => ({ ...a, criteria: { ...a.criteria, [k]: !a.criteria[k] } }))

  return (
    <QuizShell title="불면장애 자가점검 (DSM-5 기준)" subtitle="해당하는 항목만 눌러주세요">
      <label className="field" style={{ marginBottom: 12 }}>
        <span className="field__label">어쩌다 이 프로그램(치료)을 찾게 되었나요? <span className="faint">(선택)</span></span>
        <textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="예: 3개월째 새벽에 자꾸 깨서…" style={{ minHeight: 56 }} />
      </label>
      <label className="field" style={{ marginBottom: 16 }}>
        <span className="field__label">요즘 가장 어려움을 겪는 부분은? <span className="faint">(선택)</span></span>
        <textarea value={hardest} onChange={(e) => setHardest(e.target.value)} placeholder="예: 잠은 드는데 2~3시에 깨면 다시 못 잠" style={{ minHeight: 56 }} />
      </label>

      <p style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 8px' }}>
        A. 다음 중 요즘 겪는 것 (하나 이상)
      </p>
      {DSM5_CORE.map((it) => (
        <CheckRow key={it.key} label={it.text} checked={!!ans.core[it.key]} onClick={() => toggleCore(it.key)} />
      ))}

      <p style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 8px' }}>그리고 아래가 모두 맞나요?</p>
      {DSM5_CRITERIA.map((it) => (
        <CheckRow key={it.key} label={it.text} checked={!!ans.criteria[it.key]} onClick={() => toggleCrit(it.key)} />
      ))}

      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: 14 }}
        onClick={() => {
          addAssessment({
            kind: 'dsm5',
            score: result.meets ? 1 : 0,
            meta: { why, hardest },
          })
          setSubmitted(true)
        }}
      >
        판정 보기
      </button>
    </QuizShell>
  )
}

function Verdict({ meets, reasons }: { meets: boolean; reasons: string[] }) {
  return (
    <div>
      <div
        className="card"
        style={{
          textAlign: 'center',
          borderColor: meets ? 'var(--warn)' : 'var(--good)',
          background: meets ? 'rgba(251,191,36,0.08)' : 'rgba(52,211,153,0.08)',
        }}
      >
        <div style={{ fontSize: 30 }}>{meets ? '🔎' : '🙂'}</div>
        <p style={{ fontWeight: 800, fontSize: 16, margin: '6px 0 4px', color: meets ? 'var(--warn)' : 'var(--good)' }}>
          {meets ? 'DSM-5 불면장애 기준에 해당해요' : '현재 기준에는 해당하지 않아요'}
        </p>
        <p className="tiny" style={{ margin: 0 }}>
          {meets
            ? '이 프로그램이 도움이 될 수 있어요. 다만 이건 교육용 자가점검이며 진단이 아닙니다. 힘들면 전문가 상담을 권합니다.'
            : '그래도 수면이 불편하다면 이 프로그램의 습관·생각 다루기가 도움이 됩니다.'}
        </p>
      </div>
      {reasons.length > 0 && (
        <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
          {reasons.map((r, i) => (
            <li key={i} className="tiny" style={{ marginBottom: 4 }}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ───────────────────────────── 공통 소품 ───────────────────────────── */
function QuizShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 2px' }}>{title}</p>
      <p className="tiny" style={{ margin: '0 0 14px' }}>{subtitle}</p>
      {children}
    </div>
  )
}

function RetakeButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn btn--ghost btn--block" style={{ marginTop: 12, fontSize: 13 }} onClick={onClick}>
      다시 검사하기
    </button>
  )
}

function CheckRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`chip chip--block ${checked ? 'chip--on' : ''}`}
      style={{ width: '100%', marginBottom: 7, display: 'flex', gap: 8, alignItems: 'flex-start' }}
      onClick={onClick}
    >
      <span style={{ fontWeight: 800 }}>{checked ? '☑' : '☐'}</span>
      <span style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 500 }}>{label}</span>
    </button>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: 10,
          padding: '11px 12px',
          fontSize: 15,
        }}
      />
    </label>
  )
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        style={{
          width: '100%',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: 10,
          padding: '11px 12px',
          fontSize: 15,
        }}
      />
    </label>
  )
}
