// 수면일기 — 질문 하나 = 화면 하나 (StepFlow).
// 취침시각 → 입면시간 → 밤중 각성 → 기상시각 → 수면의 질 → 요약(수면효율 자동 계산) → 저장.
// 저장 시 'habits' 자가검사로 기록되어 추이 리포트의 수면효율 히어로에 반영됩니다.

import { useState } from 'react'
import { useStore } from '../store'
import { StepFlow } from '../components/StepFlow'
import { sleepEfficiency, interpretSE, fmtMinutes } from '../lib/assessments'

type StepKey = 'bed' | 'onset' | 'waso' | 'wake' | 'quality' | 'summary'
const STEPS: StepKey[] = ['bed', 'onset', 'waso', 'wake', 'quality', 'summary']

const ONSET_OPTS = [
  { label: '5분 이내', v: 5 },
  { label: '15분쯤', v: 15 },
  { label: '30분쯤', v: 30 },
  { label: '45분쯤', v: 45 },
  { label: '1시간쯤', v: 60 },
  { label: '1시간 넘게', v: 90 },
]
const WASO_OPTS = [
  { label: '안 깼어요', v: 0 },
  { label: '10분쯤', v: 10 },
  { label: '20분쯤', v: 20 },
  { label: '30분쯤', v: 30 },
  { label: '1시간 이상', v: 60 },
]
const QUALITY_OPTS = [
  { label: '😴 매우 나빴어요', v: 1 },
  { label: '🙁 나빴어요', v: 2 },
  { label: '😐 보통이에요', v: 3 },
  { label: '🙂 좋았어요', v: 4 },
  { label: '😄 매우 좋았어요', v: 5 },
]

export function SleepDiary({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const { addAssessment } = useStore()
  const [i, setI] = useState(0)
  const [bedTime, setBedTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [onsetMin, setOnsetMin] = useState<number | null>(null)
  const [wasoMin, setWasoMin] = useState<number | null>(null)
  const [quality, setQuality] = useState<number | null>(null)

  const total = STEPS.length
  const key = STEPS[i]
  const go = (d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d)))

  const { se, tib, tst } = sleepEfficiency({ bedTime, outTime: wakeTime, onsetMin: onsetMin ?? 0, wasoMin: wasoMin ?? 0 })
  const band = interpretSE(se).band
  const isSummary = key === 'summary'

  function save() {
    addAssessment({
      kind: 'habits',
      score: se,
      meta: { tib, tst, bedTime, wakeTime, onsetMin: onsetMin ?? 0, wasoMin: wasoMin ?? 0, quality: quality ?? 0 },
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
      onNext={isSummary ? save : () => go(1)}
    >
      {key === 'bed' && (
        <div>
          <div style={EYE}>어젯밤</div>
          <h2 style={H}>몇 시에<br />잠자리에 누웠나요?</h2>
          <input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} style={TIME} />
        </div>
      )}

      {key === 'onset' && (
        <div>
          <div style={EYE}>어젯밤</div>
          <h2 style={H}>잠드는 데<br />얼마나 걸렸나요?</h2>
          <Options opts={ONSET_OPTS} selected={onsetMin} onPick={(v) => { setOnsetMin(v); go(1) }} />
        </div>
      )}

      {key === 'waso' && (
        <div>
          <div style={EYE}>어젯밤</div>
          <h2 style={H}>밤중에 깨어 있던<br />시간은요?</h2>
          <Options opts={WASO_OPTS} selected={wasoMin} onPick={(v) => { setWasoMin(v); go(1) }} />
        </div>
      )}

      {key === 'wake' && (
        <div>
          <div style={EYE}>오늘 아침</div>
          <h2 style={H}>몇 시에<br />잠자리에서 나왔나요?</h2>
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} style={TIME} />
        </div>
      )}

      {key === 'quality' && (
        <div>
          <div style={EYE}>오늘 아침</div>
          <h2 style={H}>간밤 수면은<br />어땠나요?</h2>
          <Options opts={QUALITY_OPTS} selected={quality} onPick={(v) => { setQuality(v); go(1) }} />
        </div>
      )}

      {key === 'summary' && (
        <div style={{ textAlign: 'center' }}>
          <div style={EYE}>오늘의 수면효율</div>
          <div style={{ position: 'relative', width: 200, height: 200, margin: '12px auto 4px' }}>
            <Ring value={se} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {se}
                <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>%</span>
              </span>
            </div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8 }}>{band}</div>
          <p className="tiny" style={{ marginTop: 8 }}>침대 {fmtMinutes(tib)} 중 {fmtMinutes(tst)} 수면 · 목표 85%</p>
        </div>
      )}
    </StepFlow>
  )
}

function Options({ opts, selected, onPick }: { opts: { label: string; v: number }[]; selected: number | null; onPick: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {opts.map((o) => (
        <button
          key={o.v}
          className={`chip chip--block ${selected === o.v ? 'chip--on' : ''}`}
          style={{ fontSize: 17, padding: '16px', textAlign: 'center', fontWeight: 700 }}
          onClick={() => onPick(o.v)}
        >
          {o.label}
        </button>
      ))}
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

const H = { fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, margin: '0 0 24px', whiteSpace: 'pre-line' } as const
const EYE = { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const
const TIME = {
  width: '100%',
  background: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 14,
  padding: '18px',
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'center' as const,
}
