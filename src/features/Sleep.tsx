// 잠들기 전 루틴 — 스텝 플로우.
// 걱정 쏟아내기 → 내일로 미루기 → 수면위생 한 항목씩 → 부족한 것 요약 & 저장.
// 한 스텝 = 한 화면(StepFlow).

import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { SLEEP_HYGIENE } from '../lib/cbt'
import { StepFlow } from '../components/StepFlow'

type Step =
  | { type: 'worries' }
  | { type: 'tomorrow' }
  | { type: 'hygiene'; idx: number }
  | { type: 'summary' }

const STEPS: Step[] = [
  { type: 'worries' },
  { type: 'tomorrow' },
  ...SLEEP_HYGIENE.map((_, idx) => ({ type: 'hygiene', idx }) as Step),
  { type: 'summary' },
]

const inputStyle = {
  width: '100%',
  background: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 12,
  padding: '14px',
  fontSize: 18,
  minHeight: 130,
  lineHeight: 1.6,
} as const

export function Sleep({ onSaved, onClose }: { onSaved: () => void; onClose?: () => void }) {
  const { addSleepNote } = useStore()
  const [i, setI] = useState(0)
  const [worries, setWorries] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [done, setDone] = useState<Record<string, boolean>>({})

  const total = STEPS.length
  const step = STEPS[i]
  const go = (d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d)))

  const lacking = useMemo(() => SLEEP_HYGIENE.filter((h) => !done[h.id]), [done])
  const isSummary = step.type === 'summary'

  function pickHygiene(id: string, ok: boolean) {
    setDone((d) => ({ ...d, [id]: ok }))
    go(1)
  }

  function save() {
    const checked = SLEEP_HYGIENE.filter((h) => done[h.id]).map((h) => h.id)
    addSleepNote({ worries, tomorrowPlan: tomorrow, hygieneChecked: checked })
    onSaved()
    if (onClose) onClose()
  }

  return (
    <StepFlow
      step={i}
      total={total}
      onClose={onClose}
      onPrev={() => go(-1)}
      nextLabel={isSummary ? '저장하고 내려놓기' : '다음'}
      onNext={isSummary ? save : () => go(1)}
    >
      {step.type === 'worries' && (
        <div>
          <h2 style={H}>지금 머릿속 걱정을<br />쏟아내 볼까요?</h2>
          <p style={P}>떠오르는 대로, 정리하지 말고.</p>
          <textarea value={worries} onChange={(e) => setWorries(e.target.value)} placeholder="예: 내일 회의, 못 한 답장…" style={inputStyle} autoFocus />
        </div>
      )}

      {step.type === 'tomorrow' && (
        <div>
          <h2 style={H}>내일의 나에게<br />미뤄둘까요?</h2>
          <p style={P}>지금 못 할 일은 내일 언제 할지만.</p>
          <textarea value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} placeholder="예: 회의 준비는 내일 아침 9시에" style={inputStyle} autoFocus />
        </div>
      )}

      {step.type === 'hygiene' && (
        <div>
          <div style={EYE}>오늘의 수면 위생</div>
          <h2 style={{ ...H, marginBottom: 32 }}>{SLEEP_HYGIENE[step.idx].label}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className={`chip ${done[SLEEP_HYGIENE[step.idx].id] === true ? 'chip--on' : ''}`}
              style={BIGBTN}
              onClick={() => pickHygiene(SLEEP_HYGIENE[step.idx].id, true)}
            >
              ✓ 실천했어요
            </button>
            <button
              className={`chip ${done[SLEEP_HYGIENE[step.idx].id] === false ? 'chip--on' : ''}`}
              style={BIGBTN}
              onClick={() => pickHygiene(SLEEP_HYGIENE[step.idx].id, false)}
            >
              아직이요
            </button>
          </div>
        </div>
      )}

      {step.type === 'summary' && (
        <div>
          <div style={{ fontSize: 44, marginBottom: 10 }}>{lacking.length === 0 ? '🌟' : '🌙'}</div>
          <h2 style={H}>{lacking.length === 0 ? '오늘 수면 위생을\n모두 지켰어요!' : `오늘 챙기면 좋을 게\n${lacking.length}가지 있어요`}</h2>
          {lacking.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {lacking.map((h) => (
                <div key={h.id} className="card" style={{ marginBottom: 10, padding: '14px 16px' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>· {h.label}</span>
                </div>
              ))}
              <p style={{ ...P, marginTop: 12, marginBottom: 0 }}>한 번에 다 말고, 오늘은 하나만.</p>
            </div>
          )}
        </div>
      )}
    </StepFlow>
  )
}

const H = { fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, margin: '0 0 12px', whiteSpace: 'pre-line' } as const
const P = { fontSize: 17, lineHeight: 1.7, color: 'var(--text-dim)', margin: '0 0 18px' } as const
const EYE = { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const
const BIGBTN = { flex: 1, fontSize: 17, padding: '22px 0', fontWeight: 800, borderRadius: 14 } as const
