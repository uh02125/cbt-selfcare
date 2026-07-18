// 잠들기 전 루틴 — 스토리형 위저드.
// 걱정 쏟아내기 → 내일로 미루기 → 수면위생 한 항목씩 체크 → 부족한 것 요약 & 저장.

import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { SLEEP_HYGIENE } from '../lib/cbt'
import { formatDate } from '../components/common'

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

export function Sleep({ onSaved }: { onSaved: () => void }) {
  const { data, addSleepNote, deleteSleepNote } = useStore()
  const [i, setI] = useState(0)
  const [worries, setWorries] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  // 실천한 항목 id 집합
  const [done, setDone] = useState<Record<string, boolean>>({})

  const total = STEPS.length
  const step = STEPS[i]
  const go = (d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d)))

  const lacking = useMemo(() => SLEEP_HYGIENE.filter((h) => !done[h.id]), [done])

  function pickHygiene(id: string, ok: boolean) {
    setDone((d) => ({ ...d, [id]: ok }))
    go(1)
  }

  function save() {
    const checked = SLEEP_HYGIENE.filter((h) => done[h.id]).map((h) => h.id)
    addSleepNote({ worries, tomorrowPlan: tomorrow, hygieneChecked: checked })
    setWorries('')
    setTomorrow('')
    setDone({})
    setI(0)
    onSaved()
  }

  return (
    <div style={{ minHeight: '76vh', display: 'flex', flexDirection: 'column' }}>
      {/* 진행바 */}
      <div className="row-between" style={{ marginBottom: 24, gap: 12 }}>
        <span className="tiny" style={{ minWidth: 40 }}>🌙 {i + 1}/{total}</span>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--bg-elev)', overflow: 'hidden' }}>
          <div style={{ width: `${((i + 1) / total) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.25s' }} />
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1 }}>
        {step.type === 'worries' && (
          <div>
            <h2 style={H}>지금 머릿속 걱정을<br />쏟아내 볼까요?</h2>
            <p style={P}>떠오르는 대로, 정리하지 말고 적어요.</p>
            <textarea value={worries} onChange={(e) => setWorries(e.target.value)} placeholder="예: 내일 회의, 못 한 답장, 통장 잔고…" style={inputStyle} autoFocus />
          </div>
        )}

        {step.type === 'tomorrow' && (
          <div>
            <h2 style={H}>내일의 나에게<br />미뤄둘까요?</h2>
            <p style={P}>지금 못 할 일은 내일 언제 할지만 적고 넘겨요.</p>
            <textarea value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} placeholder="예: 회의 준비는 내일 아침 9시에 30분만" style={inputStyle} autoFocus />
          </div>
        )}

        {step.type === 'hygiene' && (
          <div>
            <div style={EYE}>오늘의 수면 위생 · {step.idx + 1}/{SLEEP_HYGIENE.length}</div>
            <h2 style={{ ...H, marginBottom: 28 }}>{SLEEP_HYGIENE[step.idx].label}</h2>
            <p style={{ ...P, marginBottom: 24 }}>오늘 이걸 지키셨나요?</p>
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
              <div style={{ marginTop: 8 }}>
                {lacking.map((h) => (
                  <div key={h.id} className="card" style={{ marginBottom: 10, padding: '14px 16px' }}>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>· {h.label}</span>
                  </div>
                ))}
                <p style={{ ...P, marginTop: 12 }}>한 번에 다 말고, 오늘은 하나만 골라 실천해봐요.</p>
              </div>
            )}
            <button className="btn btn--primary btn--block" style={{ marginTop: 16, fontSize: 18, padding: '16px 0' }} onClick={save}>
              저장하고 내려놓기
            </button>
          </div>
        )}
      </div>

      {/* 하단 내비 (요약 제외) */}
      {step.type !== 'summary' && (
        <div className="btn-row" style={{ marginTop: 24 }}>
          {i > 0 && (
            <button className="btn btn--ghost" style={{ flex: '0 0 84px', fontSize: 16, padding: '16px 0' }} onClick={() => go(-1)}>
              이전
            </button>
          )}
          <button className="btn btn--primary" style={{ fontSize: 18, padding: '16px 0' }} onClick={() => go(1)}>
            다음
          </button>
        </div>
      )}

      {/* 지난 밤들 (첫 화면에서만) */}
      {i === 0 && data.sleepNotes.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 className="section-title" style={{ marginLeft: 0 }}>지난 밤들</h3>
          {data.sleepNotes.slice(0, 5).map((n) => (
            <div className="entry" key={n.id}>
              <div className="entry__top">
                <span className="entry__date">{formatDate(n.createdAt)}</span>
                <button className="btn btn--danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteSleepNote(n.id)}>
                  삭제
                </button>
              </div>
              {n.tomorrowPlan && <p className="entry__balanced" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>➜ {n.tomorrowPlan}</p>}
              <p className="tiny" style={{ marginTop: 6 }}>수면 위생 {n.hygieneChecked.length}/{SLEEP_HYGIENE.length} 실천</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const H = { fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, margin: '0 0 12px', whiteSpace: 'pre-line' } as const
const P = { fontSize: 17, lineHeight: 1.7, color: 'var(--text-dim)', margin: '0 0 18px' } as const
const EYE = { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const
const BIGBTN = { flex: 1, fontSize: 17, padding: '22px 0', fontWeight: 800, borderRadius: 14 } as const
