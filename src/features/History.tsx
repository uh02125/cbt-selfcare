// 기록 히스토리 + 감정 추이 그래프 + 내보내기.
// 무료: 최근 N개만 표시. 프리미엄: 무제한 + 그래프 + JSON 내보내기.

import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { distortionById } from '../lib/cbt'
import { FREE_HISTORY_LIMIT } from '../lib/premium'
import { exportJson } from '../lib/storage'
import type { WorryEntry } from '../types'
import { ProBadge, formatDate } from '../components/common'

export function History({ onUpgrade }: { onUpgrade: () => void }) {
  const { data, deleteEntry } = useStore()
  const isPro = data.premium.active
  const entries = data.entries

  const visible = isPro ? entries : entries.slice(0, FREE_HISTORY_LIMIT)
  const hiddenCount = entries.length - visible.length

  if (entries.length === 0) {
    return (
      <div className="empty">
        <div className="empty__emoji">🕊️</div>
        <p>아직 기록이 없어요.</p>
        <p className="tiny">‘기록’ 탭에서 첫 걱정을 적어보면 여기에 쌓입니다.</p>
      </div>
    )
  }

  return (
    <div>
      <TrendSection entries={entries} isPro={isPro} onUpgrade={onUpgrade} />

      <div className="row-between" style={{ margin: '22px 4px 10px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          기록 ({entries.length})
        </h3>
        <ExportButton isPro={isPro} onUpgrade={onUpgrade} json={() => exportJson(data)} />
      </div>

      {visible.map((e) => (
        <EntryCard key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />
      ))}

      {hiddenCount > 0 && (
        <button className="locked" onClick={onUpgrade} style={{ width: '100%', marginTop: 4 }}>
          <div>
            <span className="pro-badge">PRO</span>
          </div>
          <p style={{ margin: '10px 0 2px', fontWeight: 700 }}>이전 기록 {hiddenCount}개 더 있어요</p>
          <p className="tiny">프리미엄에서 전체 기록을 열어볼 수 있어요.</p>
        </button>
      )}
    </div>
  )
}

/* ── 추이 그래프 영역 ──────────────────────────────────────────────── */
function TrendSection({
  entries,
  isPro,
  onUpgrade,
}: {
  entries: WorryEntry[]
  isPro: boolean
  onUpgrade: () => void
}) {
  if (!isPro) {
    return (
      <button className="locked" onClick={onUpgrade} style={{ width: '100%' }}>
        <span className="pro-badge">PRO</span>
        <p style={{ margin: '10px 0 2px', fontWeight: 700 }}>📈 감정 추이 그래프</p>
        <p className="tiny">재구성 전/후 강도가 시간에 따라 어떻게 변하는지 확인해요.</p>
      </button>
    )
  }
  if (entries.length < 2) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          기록이 2개 이상 쌓이면 추이 그래프가 나타납니다.
        </p>
      </div>
    )
  }
  return (
    <div className="card">
      <h3 className="section-title" style={{ margin: '0 0 4px' }}>
        감정 추이
      </h3>
      <p className="tiny" style={{ marginBottom: 12 }}>
        최근 기록의 재구성 전(파랑) → 후(초록) 강도
      </p>
      <TrendChart entries={entries} />
    </div>
  )
}

/** 의존성 없이 직접 그린 SVG 라인 차트 */
function TrendChart({ entries }: { entries: WorryEntry[] }) {
  const points = useMemo(() => {
    // 오래된 것 → 최신 순, 최근 14개
    const list = [...entries].sort((a, b) => a.createdAt - b.createdAt).slice(-14)
    return list
  }, [entries])

  const W = 320
  const H = 160
  const padX = 10
  const padY = 16
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const n = points.length
  const x = (i: number) => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
  const y = (v: number) => padY + innerH * (1 - v / 100)

  const line = (sel: (e: WorryEntry) => number) =>
    points.map((e, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(sel(e)).toFixed(1)}`).join(' ')

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="감정 강도 추이 그래프">
        {/* 가로 기준선 */}
        {[0, 25, 50, 75, 100].map((v) => (
          <line
            key={v}
            x1={padX}
            x2={W - padX}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        <path d={line((e) => e.intensityBefore)} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={line((e) => e.intensityAfter)} fill="none" stroke="var(--good)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((e, i) => (
          <g key={e.id}>
            <circle cx={x(i)} cy={y(e.intensityBefore)} r={2.6} fill="var(--accent)" />
            <circle cx={x(i)} cy={y(e.intensityAfter)} r={2.6} fill="var(--good)" />
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        <span>
          <i style={{ background: 'var(--accent)' }} />전
        </span>
        <span>
          <i style={{ background: 'var(--good)' }} />후
        </span>
      </div>
    </div>
  )
}

/* ── 기록 카드 ────────────────────────────────────────────────────── */
function EntryCard({ entry, onDelete }: { entry: WorryEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const diff = entry.intensityBefore - entry.intensityAfter
  const deltaClass = diff > 0 ? 'delta--down' : diff < 0 ? 'delta--up' : 'delta--flat'
  const deltaText = diff > 0 ? `▼ ${diff}` : diff < 0 ? `▲ ${-diff}` : '― 0'

  return (
    <div className="entry">
      <div className="entry__top">
        <span className="entry__date">{formatDate(entry.createdAt)}</span>
        <span className={`delta ${deltaClass}`} title="감정 강도 변화">
          {entry.emotion || '감정'} {deltaText}
        </span>
      </div>
      <p className="entry__thought">“{entry.automaticThought}”</p>

      {entry.distortions.length > 0 && (
        <div className="chips" style={{ marginTop: 6 }}>
          {entry.distortions.map((id) => (
            <span key={id} className="chip chip--on" style={{ pointerEvents: 'none', fontSize: 11 }}>
              {distortionById(id)?.name}
            </span>
          ))}
        </div>
      )}

      {entry.balancedThought && <div className="entry__balanced">💡 {entry.balancedThought}</div>}

      {open && (
        <div style={{ marginTop: 10 }}>
          {entry.situation && <DetailRow label="상황" value={entry.situation} />}
          {entry.evidenceFor && <DetailRow label="뒷받침 사실" value={entry.evidenceFor} />}
          {entry.evidenceAgainst && <DetailRow label="반대 사실" value={entry.evidenceAgainst} />}
          {entry.friendAdvice && <DetailRow label="친구에게라면" value={entry.friendAdvice} />}
          <div className="row-between" style={{ marginTop: 6 }}>
            <span className="tiny">강도 {entry.intensityBefore} → {entry.intensityAfter}</span>
            <button className="btn btn--danger" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={onDelete}>
              삭제
            </button>
          </div>
        </div>
      )}

      <button
        className="btn btn--ghost"
        style={{ width: '100%', marginTop: 10, padding: '8px', fontSize: 12.5 }}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '접기' : '자세히'}
      </button>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ margin: '0 0 6px', fontSize: 13 }}>
      <span className="tiny" style={{ display: 'block', marginBottom: 1 }}>
        {label}
      </span>
      <span className="muted">{value}</span>
    </p>
  )
}

/* ── 내보내기 ─────────────────────────────────────────────────────── */
function ExportButton({
  isPro,
  onUpgrade,
  json,
}: {
  isPro: boolean
  onUpgrade: () => void
  json: () => string
}) {
  function download() {
    if (!isPro) {
      onUpgrade()
      return
    }
    const blob = new Blob([json()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maeum-shim-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={download}>
      내보내기 {!isPro && <ProBadge />}
    </button>
  )
}
