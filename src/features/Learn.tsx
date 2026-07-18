// 배우기 — 4세션 수면 교육 프로그램.
// 세션 목록 → 세션 리더(콘텐츠 블록 렌더링). 실천 버튼은 관련 탭으로 이동.

import { useState } from 'react'
import { useStore } from '../store'
import { SESSIONS, sessionByNo } from '../lib/program'
import type { Block, Session, TabId } from '../lib/program'
import { Disclaimer } from '../components/common'

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

  const progress = Math.round((done.length / SESSIONS.length) * 100)

  return (
    <div>
      <div className="card">
        <div className="row-between">
          <div>
            <b style={{ fontSize: 15 }}>수면 교육 4주 과정</b>
            <p className="tiny" style={{ margin: '3px 0 0' }}>
              하루 5~7분, 잠을 이해하고 다스리는 법을 배워요
            </p>
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
        {progress === 100 && (
          <p className="tiny" style={{ color: 'var(--good)', marginTop: 10, marginBottom: 0 }}>
            🎉 모든 세션을 마쳤어요! 언제든 다시 읽어볼 수 있습니다.
          </p>
        )}
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
              <span className="step-eyebrow" style={{ margin: 0 }}>
                세션 {s.no} · {s.minutes}분
              </span>
              {isDone ? (
                <span className="delta delta--down">✓ 완료</span>
              ) : (
                <span className="delta delta--flat">읽기 →</span>
              )}
            </div>
            <p className="entry__thought" style={{ margin: '0 0 2px' }}>
              {s.title}
            </p>
            <p className="tiny" style={{ margin: 0 }}>
              {s.subtitle}
            </p>
          </button>
        )
      })}

      <div style={{ marginTop: 16 }}>
        <Disclaimer />
      </div>
    </div>
  )
}

/* ── 세션 리더 ────────────────────────────────────────────────────── */
function SessionReader({
  session,
  onBack,
  onNavigate,
}: {
  session: Session
  onBack: () => void
  onNavigate: (tab: TabId) => void
}) {
  const { data, toggleSessionComplete } = useStore()
  const isDone = data.program.completedSessions.includes(session.no)

  return (
    <div>
      <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 13, marginBottom: 12 }} onClick={onBack}>
        ← 목록
      </button>

      <div className="step-eyebrow">세션 {session.no} · 약 {session.minutes}분</div>
      <h2 className="step-title">{session.title}</h2>
      <p className="step-desc">{session.subtitle}</p>

      <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-strong)' }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65 }}>{session.intro}</p>
      </div>

      <div style={{ marginTop: 4 }}>
        {session.blocks.map((b, i) => (
          <BlockView key={i} block={b} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <b style={{ fontSize: 14 }}>🌱 핵심만 기억해요</b>
        <ul className="feature-list" style={{ margin: '10px 0 0' }}>
          {session.takeaways.map((t, i) => (
            <li key={i} style={{ padding: '8px 0' }}>
              <span className="check">✓</span>
              <span style={{ fontSize: 13.5 }}>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        className={`btn ${isDone ? '' : 'btn--primary'} btn--block`}
        style={{ marginTop: 16 }}
        onClick={() => {
          toggleSessionComplete(session.no)
          if (!isDone) onBack()
        }}
      >
        {isDone ? '완료 취소' : '이 세션 완료하기 ✓'}
      </button>
    </div>
  )
}

/* ── 콘텐츠 블록 렌더러 ───────────────────────────────────────────── */
function BlockView({ block, onNavigate }: { block: Block; onNavigate: (tab: TabId) => void }) {
  switch (block.type) {
    case 'h':
      return <h3 className="section-title" style={{ marginLeft: 0, marginRight: 0 }}>{block.text}</h3>
    case 'p':
      return <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text)', margin: '0 0 12px' }}>{block.text}</p>
    case 'list':
      return (
        <ul style={{ margin: '0 0 14px', paddingLeft: 18 }}>
          {block.items.map((it, i) => (
            <li key={i} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 8, color: 'var(--text-dim)' }}>
              {it}
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <div className="entry__balanced" style={{ marginBottom: 14 }}>
          💡 {block.text}
        </div>
      )
    case 'caution':
      return (
        <div className="disclaimer" style={{ marginBottom: 14 }}>
          ⚠️ {block.text}
        </div>
      )
    case 'key':
      return (
        <div
          className="card"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-strong)', padding: 14, marginBottom: 14 }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, fontWeight: 600 }}>🔑 {block.text}</p>
        </div>
      )
    case 'rules':
      return (
        <div style={{ marginBottom: 14 }}>
          {block.items.map((r, i) => (
            <div key={i} className="entry" style={{ marginBottom: 8, padding: '11px 13px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700 }}>
                {i + 1}. {r.rule}
              </p>
              <p className="tiny" style={{ margin: 0, lineHeight: 1.55 }}>
                {r.why}
              </p>
            </div>
          ))}
        </div>
      )
    case 'practice':
      return (
        <button
          className="card"
          style={{
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            marginBottom: 14,
            borderColor: 'var(--good)',
            background: 'rgba(52, 211, 153, 0.06)',
          }}
          onClick={() => onNavigate(block.tab)}
        >
          <div className="row-between">
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--good)' }}>
                ▶ 지금 해보기 · {block.label}
              </p>
              <p className="tiny" style={{ margin: 0 }}>
                {block.desc}
              </p>
            </div>
            <span style={{ color: 'var(--good)', fontSize: 20 }}>→</span>
          </div>
        </button>
      )
  }
}
