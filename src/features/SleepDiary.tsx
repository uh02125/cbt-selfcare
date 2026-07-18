// 수면일기 — 질문 하나 = 화면 하나 (StepFlow). 조건 분기 포함.
// 흐름: 취침 → 입면(분) → 수면제(예/아니오→시각) → 각성 횟수(휠) →
//   [각성≥1일 때] 재입면 평균 / 추가 복용(예/아니오→시간대) / 깬 뒤 행동 →
//   기상 → 침대 밖 → 수면의 질 → 요약(수면효율) → 저장.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../store'
import { StepFlow } from '../components/StepFlow'
import { minutesBetween, interpretSE, fmtMinutes } from '../lib/assessments'

type Key =
  | 'bed'
  | 'sol'
  | 'med'
  | 'medTime'
  | 'awak'
  | 'wakeAvg'
  | 'wakeMed'
  | 'wakeMedTime'
  | 'wakeAct'
  | 'wake'
  | 'outBed'
  | 'quality'
  | 'summary'

// 재입면 평균 구간 → 중간값(분)
const WAKE_AVG_OPTS = [
  { key: 'a', label: '5분 이내', mid: 2.5 },
  { key: 'b', label: '5~15분', mid: 10 },
  { key: 'c', label: '15~30분', mid: 22.5 },
  { key: 'd', label: '30분 이상', mid: 40 },
]

const MED_TIME_BANDS = [
  { key: 'b0', label: '자정~새벽 1시' },
  { key: 'b1', label: '새벽 1~2시' },
  { key: 'b2', label: '새벽 2~3시' },
  { key: 'b3', label: '새벽 3~4시' },
  { key: 'b4', label: '새벽 4시 이후' },
]

const QUALITY_OPTS = [
  { label: '😴 매우 나빴어요', v: 1 },
  { label: '🙁 나빴어요', v: 2 },
  { label: '😐 보통이에요', v: 3 },
  { label: '🙂 좋았어요', v: 4 },
  { label: '😄 매우 좋았어요', v: 5 },
]

interface Answers {
  bed: string
  sol: number
  med: boolean | null
  medTime: string
  awak: number // 0~5 (5 = 5회 이상)
  wakeAvg: string | null // WAKE_AVG_OPTS.key
  wakeMed: boolean | null
  wakeMedTime: string | null // MED_TIME_BANDS.key
  wakeActChoice: 'phone' | 'outbed' | 'custom' | null
  wakeActText: string
  wake: string
  outBed: string
  quality: number | null
}

const init: Answers = {
  bed: '23:00',
  sol: 20,
  med: null,
  medTime: '23:00',
  awak: 0,
  wakeAvg: null,
  wakeMed: null,
  wakeMedTime: null,
  wakeActChoice: null,
  wakeActText: '',
  wake: '07:00',
  outBed: '07:00',
  quality: null,
}

function buildSteps(a: Answers): Key[] {
  const s: Key[] = ['bed', 'sol', 'med']
  if (a.med === true) s.push('medTime')
  s.push('awak')
  if (a.awak >= 1) {
    s.push('wakeAvg', 'wakeMed')
    if (a.wakeMed === true) s.push('wakeMedTime')
    s.push('wakeAct')
  }
  s.push('wake', 'outBed', 'quality', 'summary')
  return s
}

export function SleepDiary({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const { addAssessment } = useStore()
  const [a, setA] = useState<Answers>(init)
  const [rawI, setRawI] = useState(0)
  const set = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }))

  const steps = buildSteps(a)
  const total = steps.length
  const i = Math.min(rawI, total - 1)
  const key = steps[i]
  const go = (d: number) => setRawI(() => Math.min(total - 1, Math.max(0, i + d)))
  const next = () => go(1)

  // 수면효율 계산
  const tib = minutesBetween(a.bed, a.outBed)
  const mid = WAKE_AVG_OPTS.find((o) => o.key === a.wakeAvg)?.mid ?? 0
  const waso = a.awak >= 1 ? Math.round(mid * a.awak) : 0
  const tstRaw = tib - a.sol - waso
  const se = tib > 0 ? Math.max(0, Math.min(100, Math.round((tstRaw / tib) * 100))) : 0
  const tst = Math.max(0, tstRaw)

  const isSummary = key === 'summary'

  function save() {
    addAssessment({
      kind: 'habits',
      score: se,
      meta: {
        tib,
        tst,
        bed: a.bed,
        outBed: a.outBed,
        wake: a.wake,
        sol: a.sol,
        awak: a.awak,
        waso,
        med: a.med ? 1 : 0,
        quality: a.quality ?? 0,
      },
    })
    onSaved()
    onClose()
  }

  return (
    <StepFlow
      step={i}
      total={total}
      onClose={onClose}
      onPrev={() => go(-1)}
      nextLabel={isSummary ? '저장하기' : '다음'}
      onNext={isSummary ? save : next}
    >
      {key === 'bed' && (
        <Q eyebrow="어젯밤" title={'몇 시에\n잠자리에 들었나요?'}>
          <TimeInput value={a.bed} onChange={(v) => set({ bed: v })} />
        </Q>
      )}

      {key === 'sol' && (
        <Q eyebrow="어젯밤" title={'잠드는 데\n얼마나 걸렸나요?'}>
          <NumberInput value={a.sol} onChange={(v) => set({ sol: v })} suffix="분" />
        </Q>
      )}

      {key === 'med' && (
        <Q eyebrow="어젯밤" title={'오늘 수면제를\n복용하셨나요?'}>
          <YesNo value={a.med} onPick={(yes) => { set({ med: yes }); next() }} />
        </Q>
      )}

      {key === 'medTime' && (
        <Q eyebrow="수면제" title={'몇 시에\n복용하셨나요?'}>
          <TimeInput value={a.medTime} onChange={(v) => set({ medTime: v })} />
        </Q>
      )}

      {key === 'awak' && (
        <Q eyebrow="어젯밤" title={'밤중에\n몇 번 깨셨나요?'}>
          <NumberWheel value={a.awak} onChange={(v) => set({ awak: v })} />
        </Q>
      )}

      {key === 'wakeAvg' && (
        <Q eyebrow="깼을 때" title={'다시 잠드는 데\n평균 얼마나 걸렸나요?'}>
          <Choices
            options={WAKE_AVG_OPTS.map((o) => ({ label: o.label, value: o.key }))}
            selected={a.wakeAvg}
            onPick={(v) => { set({ wakeAvg: v }); next() }}
          />
        </Q>
      )}

      {key === 'wakeMed' && (
        <Q eyebrow="깼을 때" title={'수면제를 추가로\n복용한 적이 있나요?'}>
          <YesNo value={a.wakeMed} onPick={(yes) => { set({ wakeMed: yes }); next() }} />
        </Q>
      )}

      {key === 'wakeMedTime' && (
        <Q eyebrow="추가 복용" title={'몇 시쯤\n복용하셨나요?'}>
          <Choices
            options={MED_TIME_BANDS.map((o) => ({ label: o.label, value: o.key }))}
            selected={a.wakeMedTime}
            onPick={(v) => { set({ wakeMedTime: v }); next() }}
          />
        </Q>
      )}

      {key === 'wakeAct' && (
        <Q eyebrow="깬 다음" title={'주로 무엇을\n하셨나요?'}>
          <Choices
            options={[
              { label: '📱 휴대폰 사용', value: 'phone' },
              { label: '🚶 침대 밖으로 이동', value: 'outbed' },
              { label: '✏️ 직접 입력', value: 'custom' },
            ]}
            selected={a.wakeActChoice}
            onPick={(v) => {
              const choice = v as Answers['wakeActChoice']
              set({ wakeActChoice: choice })
              if (choice !== 'custom') next()
            }}
          />
          {a.wakeActChoice === 'custom' && (
            <textarea
              value={a.wakeActText}
              onChange={(e) => set({ wakeActText: e.target.value })}
              placeholder="예: 물 마시고 스트레칭"
              style={{ marginTop: 12, minHeight: 70, fontSize: 16 }}
              autoFocus
            />
          )}
        </Q>
      )}

      {key === 'wake' && (
        <Q eyebrow="오늘 아침" title={'몇 시에\n눈이 떠졌나요?'}>
          <TimeInput value={a.wake} onChange={(v) => set({ wake: v })} />
        </Q>
      )}

      {key === 'outBed' && (
        <Q eyebrow="오늘 아침" title={'몇 시에\n침대에서 나오셨나요?'}>
          <TimeInput value={a.outBed} onChange={(v) => set({ outBed: v })} />
        </Q>
      )}

      {key === 'quality' && (
        <Q eyebrow="오늘 아침" title={'오늘 수면의 질은\n어땠나요?'}>
          <Choices
            options={QUALITY_OPTS.map((o) => ({ label: o.label, value: String(o.v) }))}
            selected={a.quality != null ? String(a.quality) : null}
            onPick={(v) => { set({ quality: Number(v) }); next() }}
          />
        </Q>
      )}

      {key === 'summary' && (
        <div style={{ textAlign: 'center' }}>
          <div style={EYE}>오늘의 수면효율</div>
          <div style={{ position: 'relative', width: 200, maxWidth: '100%', height: 200, margin: '10px auto 4px' }}>
            <Ring value={se} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {se}
                <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>%</span>
              </span>
            </div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{interpretSE(se).band}</div>
          <p className="tiny" style={{ marginTop: 8 }}>
            침대 {fmtMinutes(tib)} 중 약 {fmtMinutes(tst)} 수면
            {a.awak >= 1 ? ` · ${a.awak === 5 ? '5회 이상' : a.awak + '회'} 깸` : ' · 안 깸'}
          </p>
        </div>
      )}
    </StepFlow>
  )
}

/* ── 질문 래퍼 ── */
function Q({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div>
      <div style={EYE}>{eyebrow}</div>
      <h2 style={H}>{title}</h2>
      {children}
    </div>
  )
}

/* ── 입력 UI ── */
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="time" value={value} onChange={(e) => onChange(e.target.value)} style={TIME} />
}

function NumberInput({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        style={{ ...TIME, width: 160, fontSize: 40 }}
      />
      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-dim)' }}>{suffix}</span>
    </div>
  )
}

function YesNo({ value, onPick }: { value: boolean | null; onPick: (yes: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <button className={`chip ${value === true ? 'chip--on' : ''}`} style={BIG} onClick={() => onPick(true)}>
        예
      </button>
      <button className={`chip ${value === false ? 'chip--on' : ''}`} style={BIG} onClick={() => onPick(false)}>
        아니오
      </button>
    </div>
  )
}

function Choices({ options, selected, onPick }: { options: { label: string; value: string }[]; selected: string | null; onPick: (v: string) => void }) {
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

const WHEEL_OPTS = [
  { v: 0, label: '0회' },
  { v: 1, label: '1회' },
  { v: 2, label: '2회' },
  { v: 3, label: '3회' },
  { v: 4, label: '4회' },
  { v: 5, label: '5회 이상' },
]
const ROW = 60

function NumberWheel({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = WHEEL_OPTS.findIndex((o) => o.v === value)
    el.scrollTop = Math.max(0, idx) * ROW
  }, []) // 최초 진입 시 현재 값 위치로

  function onScroll() {
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, Math.min(WHEEL_OPTS.length - 1, Math.round(el.scrollTop / ROW)))
    if (WHEEL_OPTS[idx].v !== value) onChange(WHEEL_OPTS[idx].v)
  }

  function scrollTo(idx: number) {
    ref.current?.scrollTo({ top: idx * ROW, behavior: 'smooth' })
    onChange(WHEEL_OPTS[idx].v)
  }

  return (
    <div style={{ position: 'relative', height: ROW * 3 }}>
      {/* 가운데 선택 밴드 */}
      <div
        style={{
          position: 'absolute',
          top: ROW,
          height: ROW,
          left: 0,
          right: 0,
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          pointerEvents: 'none',
        }}
      />
      <div ref={ref} className="wheelpick" style={{ height: ROW * 3 }} onScroll={onScroll}>
        <div style={{ height: ROW }} />
        {WHEEL_OPTS.map((o, idx) => (
          <div
            key={o.v}
            className="wheelpick__row"
            style={{
              height: ROW,
              fontSize: o.v === value ? 28 : 20,
              fontWeight: o.v === value ? 800 : 600,
              opacity: o.v === value ? 1 : 0.35,
              transition: 'font-size 0.1s, opacity 0.1s',
            }}
            onClick={() => scrollTo(idx)}
          >
            {o.label}
          </div>
        ))}
        <div style={{ height: ROW }} />
      </div>
    </div>
  )
}

function Ring({ value }: { value: number }) {
  const R = 82
  const C = 2 * Math.PI * R
  const off = C * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <svg viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
      <circle
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={off}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

const H = { fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, margin: '0 0 26px', whiteSpace: 'pre-line' } as const
const EYE = { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const
const TIME = {
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
const BIG = { flex: 1, fontSize: 19, padding: '22px 0', fontWeight: 800, borderRadius: 14 } as const
