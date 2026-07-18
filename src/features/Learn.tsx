// 배우기 — 4세션 수면 교육 프로그램.
// 세션 목록 → 세션 리더(콘텐츠 블록 렌더링). 실천 버튼은 관련 탭으로 이동.

import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { SESSIONS, sessionByNo } from '../lib/program'
import type { Block, Session, TabId } from '../lib/program'
import { Disclaimer } from '../components/common'
import { IsiQuiz, DbasQuiz, HabitsForm, Dsm5Check } from './Assessments'

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

/* ── 세션 리더 (스토리형 페이지: 한 화면 = 한 조각, 큰 글씨) ── */

type Page =
  | { type: 'intro' }
  | { type: 'outro' }
  | { type: 'block'; heading?: string; eyebrow?: string; block: Block }
  | { type: 'rule'; eyebrow: string; n: number; total: number; rule: string; why: string }

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
      pages.push({ type: 'block', block: b })
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
  const pages = useMemo(() => buildPages(session), [session])
  const [i, setI] = useState(0)

  const total = pages.length
  const page = pages[i]
  const atEnd = i === total - 1
  const go = (d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d)))

  return (
    <div style={{ minHeight: '74vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단: 닫기 + 진행바 */}
      <div className="row-between" style={{ marginBottom: 22, gap: 12 }}>
        <button
          className="btn btn--ghost"
          style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1, border: 'none' }}
          onClick={onBack}
          aria-label="목록으로"
        >
          ✕
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--bg-elev)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${((i + 1) / total) * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 0.25s',
            }}
          />
        </div>
        <span className="tiny" style={{ minWidth: 34, textAlign: 'right' }}>
          {i + 1}/{total}
        </span>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1 }}>
        {page.type === 'intro' && <IntroPage session={session} />}
        {page.type === 'outro' && <OutroPage session={session} />}
        {page.type === 'block' && (
          <div>
            {page.heading && <h2 style={styles.bigHeading}>{page.heading}</h2>}
            {page.eyebrow && <div style={styles.eyebrow}>{page.eyebrow}</div>}
            <BigBlock block={page.block} onNavigate={onNavigate} />
          </div>
        )}
        {page.type === 'rule' && (
          <div>
            {page.eyebrow && <div style={styles.eyebrow}>{page.eyebrow}</div>}
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', marginBottom: 10 }}>
              {page.n} <span style={{ color: 'var(--text-faint)' }}>/ {page.total}</span>
            </div>
            <h2 style={styles.bigHeading}>{page.rule}</h2>
            <p style={styles.para}>{page.why}</p>
          </div>
        )}
      </div>

      {/* 하단 내비 */}
      <div className="btn-row" style={{ marginTop: 24 }}>
        {i > 0 && (
          <button className="btn btn--ghost" style={{ flex: '0 0 88px', fontSize: 16, padding: '15px 0' }} onClick={() => go(-1)}>
            이전
          </button>
        )}
        {!atEnd ? (
          <button className="btn btn--primary" style={{ fontSize: 17, padding: '15px 0' }} onClick={() => go(1)}>
            다음
          </button>
        ) : (
          <button
            className={`btn ${isDone ? '' : 'btn--primary'}`}
            style={{ fontSize: 17, padding: '15px 0' }}
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

function IntroPage({ session }: { session: Session }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={styles.eyebrow}>세션 {session.no} · 약 {session.minutes}분</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, margin: '4px 0 8px' }}>
        {session.title}
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-dim)', margin: '0 0 26px' }}>{session.subtitle}</p>
      <p style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--text)' }}>{session.intro}</p>
    </div>
  )
}

function OutroPage({ session }: { session: Session }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🌱</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 20px' }}>핵심만 기억해요</h2>
      {session.takeaways.map((t, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--good)', fontWeight: 800, fontSize: 20, lineHeight: 1.4 }}>✓</span>
          <span style={{ fontSize: 18, lineHeight: 1.6 }}>{t}</span>
        </div>
      ))}
    </div>
  )
}

const styles = {
  bigHeading: { fontSize: 25, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, margin: '0 0 16px' } as const,
  eyebrow: { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 } as const,
  para: { fontSize: 18, lineHeight: 1.8, color: 'var(--text)', margin: '0 0 16px' } as const,
}

/* ── 콘텐츠 블록 렌더러 (큰 글씨) ── */
function BigBlock({ block, onNavigate }: { block: Block; onNavigate: (tab: TabId) => void }) {
  switch (block.type) {
    case 'h':
      return <h2 style={styles.bigHeading}>{block.text}</h2>
    case 'p':
      return <p style={styles.para}>{block.text}</p>
    case 'list':
      return (
        <ul style={{ margin: 0, paddingLeft: 4, listStyle: 'none' }}>
          {block.items.map((it, i) => (
            <li key={i} style={{ fontSize: 17, lineHeight: 1.65, marginBottom: 16, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 800 }}>·</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <div className="card" style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'var(--good)' }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7 }}>💡 {block.text}</p>
        </div>
      )
    case 'caution':
      return (
        <div className="disclaimer" style={{ fontSize: 15, lineHeight: 1.7 }}>
          ⚠️ {block.text}
        </div>
      )
    case 'key':
      return (
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-strong)' }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, fontWeight: 600 }}>🔑 {block.text}</p>
        </div>
      )
    case 'rules':
      // 페이지 분해에서 개별 rule 로 처리되므로 여기 도달하지 않음(안전망)
      return null
    case 'practice':
      return (
        <button
          className="card"
          style={{
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            borderColor: 'var(--good)',
            background: 'rgba(52, 211, 153, 0.06)',
            padding: 18,
          }}
          onClick={() => onNavigate(block.tab)}
        >
          <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--good)' }}>▶ 지금 해보기</p>
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{block.label}</p>
          <p className="tiny" style={{ margin: 0, fontSize: 13.5 }}>{block.desc}</p>
        </button>
      )
    case 'assessment':
      switch (block.kind) {
        case 'isi':
          return <IsiQuiz />
        case 'dbas':
          return <DbasQuiz />
        case 'habits':
          return <HabitsForm />
        case 'dsm5':
          return <Dsm5Check />
      }
  }
}
