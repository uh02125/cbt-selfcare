// 불안 완화용 호흡 가이드. 4-7-8 호흡 애니메이션.
// 무료로 기본 제공(누구나 힘들 때 바로 쓸 수 있어야 하는 기능이므로).

import { useEffect, useReducer, useRef } from 'react'

type Phase = { label: string; secs: number; scale: number }

const PATTERN: Phase[] = [
  { label: '들이쉬기', secs: 4, scale: 1 },
  { label: '멈추기', secs: 7, scale: 1 },
  { label: '내쉬기', secs: 8, scale: 0.6 },
]

interface State {
  running: boolean
  phaseIdx: number
  remaining: number
  cycles: number
}

type Action = { type: 'start' } | { type: 'stop' } | { type: 'tick' }

const initial: State = { running: false, phaseIdx: 0, remaining: PATTERN[0].secs, cycles: 0 }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'start':
      return { running: true, phaseIdx: 0, remaining: PATTERN[0].secs, cycles: 0 }
    case 'stop':
      return { ...s, running: false }
    case 'tick': {
      if (!s.running) return s
      if (s.remaining > 1) return { ...s, remaining: s.remaining - 1 }
      // 현재 단계 종료 → 다음 단계로
      const nextIdx = (s.phaseIdx + 1) % PATTERN.length
      return {
        ...s,
        phaseIdx: nextIdx,
        remaining: PATTERN[nextIdx].secs,
        cycles: nextIdx === 0 ? s.cycles + 1 : s.cycles,
      }
    }
  }
}

export function Breathing() {
  const [s, dispatch] = useReducer(reducer, initial)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!s.running) return
    timer.current = window.setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [s.running])

  const phase = PATTERN[s.phaseIdx]

  return (
    <div>
      <div className="card">
        <h3 className="section-title" style={{ margin: '0 0 4px' }}>
          4-7-8 호흡
        </h3>
        <p className="tiny" style={{ marginBottom: 4 }}>
          4초 들이쉬고, 7초 멈추고, 8초 천천히 내쉽니다. 긴장을 가라앉히는 데 도움이 돼요.
        </p>

        <div className="breath">
          <div
            className="breath__circle"
            style={{
              transform: `scale(${s.running ? phase.scale : 0.8})`,
              transitionDuration: s.running ? `${phase.secs}s` : '0.4s',
            }}
          >
            {s.running ? `${phase.label} ${s.remaining}` : '준비'}
          </div>
          <div className="breath__phase">
            {s.running ? `${phase.label} · ${s.remaining}초` : '시작을 누르면 안내가 시작돼요'}
            <div className="tiny" style={{ marginTop: 4 }}>
              완료한 호흡: {s.cycles}회
            </div>
          </div>
        </div>

        <div className="btn-row">
          {!s.running ? (
            <button className="btn btn--primary btn--block" onClick={() => dispatch({ type: 'start' })}>
              시작
            </button>
          ) : (
            <button className="btn btn--block" onClick={() => dispatch({ type: 'stop' })}>
              멈추기
            </button>
          )}
        </div>
      </div>

      <p className="tiny" style={{ textAlign: 'center', marginTop: 14, padding: '0 20px' }}>
        어지럽거나 불편하면 즉시 멈추고 평소 호흡으로 돌아오세요.
      </p>
    </div>
  )
}
