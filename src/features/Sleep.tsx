// 불면증 완화 루틴: 잠들기 전 '생각 비우기'(thought download) + '걱정 미루기'(worry postponement)
// + 수면 위생 체크리스트. CBT-I 에서 널리 쓰는 기법을 자가관리용으로 단순화한 것.

import { useState } from 'react'
import { useStore } from '../store'
import { SLEEP_HYGIENE } from '../lib/cbt'
import { formatDate } from '../components/common'

export function Sleep({ onSaved }: { onSaved: () => void }) {
  const { data, addSleepNote, deleteSleepNote } = useStore()
  const [worries, setWorries] = useState('')
  const [tomorrowPlan, setTomorrowPlan] = useState('')
  const [checked, setChecked] = useState<string[]>([])

  function toggle(id: string) {
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  function save() {
    addSleepNote({ worries, tomorrowPlan, hygieneChecked: checked })
    setWorries('')
    setTomorrowPlan('')
    setChecked([])
    onSaved()
  }

  const canSave = worries.trim() || tomorrowPlan.trim() || checked.length > 0

  return (
    <div>
      <div className="card">
        <h3 className="section-title" style={{ margin: '0 0 4px' }}>
          🌙 잠들기 전, 머리 비우기
        </h3>
        <p className="tiny" style={{ marginBottom: 14 }}>
          머릿속을 맴도는 걱정을 종이에 옮기듯 적어두면, 뇌가 "이제 놓아도 된다"고 느낍니다.
        </p>

        <label className="field">
          <span className="field__label">지금 머릿속 걱정들</span>
          <p className="field__hint">떠오르는 대로, 정리하지 말고 쏟아내세요.</p>
          <textarea
            value={worries}
            onChange={(e) => setWorries(e.target.value)}
            placeholder="예: 내일 회의, 답장 못 한 메시지, 통장 잔고…"
            style={{ minHeight: 96 }}
          />
        </label>

        <label className="field">
          <span className="field__label">내일의 '나'에게 미루기</span>
          <p className="field__hint">지금 할 수 없는 일은 내일 언제 처리할지 한 줄로 적고 넘겨보내세요.</p>
          <textarea
            value={tomorrowPlan}
            onChange={(e) => setTomorrowPlan(e.target.value)}
            placeholder="예: 회의 준비는 내일 아침 9시에 30분만 하기"
          />
        </label>
      </div>

      <div className="card">
        <h3 className="section-title" style={{ margin: '0 0 10px' }}>
          오늘의 수면 위생
        </h3>
        <div className="chips" style={{ flexDirection: 'column' }}>
          {SLEEP_HYGIENE.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`chip chip--block ${checked.includes(h.id) ? 'chip--on' : ''}`}
              onClick={() => toggle(h.id)}
            >
              {checked.includes(h.id) ? '✓ ' : '○ '}
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn--primary btn--block" style={{ marginTop: 14 }} onClick={save} disabled={!canSave}>
        오늘 밤 기록 저장하고 내려놓기
      </button>

      {data.sleepNotes.length > 0 && (
        <>
          <h3 className="section-title">지난 밤들</h3>
          {data.sleepNotes.slice(0, 10).map((n) => (
            <div className="entry" key={n.id}>
              <div className="entry__top">
                <span className="entry__date">{formatDate(n.createdAt)}</span>
                <button
                  className="btn btn--danger"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => deleteSleepNote(n.id)}
                >
                  삭제
                </button>
              </div>
              {n.worries && <p style={{ margin: '2px 0', fontSize: 13.5 }} className="muted">{n.worries}</p>}
              {n.tomorrowPlan && (
                <p className="entry__balanced" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                  ➜ {n.tomorrowPlan}
                </p>
              )}
              {n.hygieneChecked.length > 0 && (
                <p className="tiny" style={{ marginTop: 6 }}>
                  수면 위생 {n.hygieneChecked.length}/{SLEEP_HYGIENE.length} 실천
                </p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
