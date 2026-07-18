// 리포트(추이) 화면 — 슬립루틴 스타일 리디자인.
// 원칙: 가장 중요한 수치 1개(수면효율)를 원형 링으로 크게, 나머지는 아래 카드로.
// 단일 포인트 컬러(액센트)만 강조, 나머지는 무채색. 여백 넉넉하게.

import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { distortionById } from '../lib/cbt'
import { FREE_HISTORY_LIMIT } from '../lib/premium'
import { exportJson } from '../lib/storage'
import { interpretISI, interpretDBAS, interpretSE, fmtMinutes } from '../lib/assessments'
import type { AssessmentResult, WorryEntry } from '../types'
import { ProBadge, formatDate } from '../components/common'

export function History({ onUpgrade }: { onUpgrade: () => void }) {
  const { data, deleteEntry } = useStore()
  const isPro = data.premium.active
  const entries = data.entries

  const latest = (kind: AssessmentResult['kind']) => data.assessments.find((a) => a.kind === kind)
  const habits = latest('habits')
  const isi = latest('isi')
  const dbas = latest('dbas')
  const dsm5 = latest('dsm5')

  const hasAnything = entries.length > 0 || data.assessments.length > 0
  if (!hasAnything) {
    return (
      <div className="empty">
        <div className="empty__emoji">🌙</div>
        <p>아직 리포트가 없어요.</p>
        <p className="tiny">‘배우기’에서 수면 검사를 하거나 ‘기록’을 남기면 여기에 모여요.</p>
      </div>
    )
  }

  const visible = isPro ? entries : entries.slice(0, FREE_HISTORY_LIMIT)
  const hiddenCount = entries.length - visible.length

  return (
    <div className="report">
      {/* 히어로: 수면 효율 원형 링 */}
      {habits ? <SleepEfficiencyHero result={habits} /> : <EmptyHero />}

      {/* 지표 카드 (스크롤) */}
      {(isi || dbas) && (
        <div className="report-metrics">
          {isi && (
            <MetricCard label="😴 불면증 지수" value={`${isi.score}`} unit="/28" band={interpretISI(isi.score).band} />
          )}
          {dbas && (
            <MetricCard
              label="💭 수면 생각"
              value={(dbas.score / 10).toFixed(1)}
              unit="/10"
              band={interpretDBAS(dbas.score / 10).band}
            />
          )}
        </div>
      )}

      {dsm5 && (
        <div className="report-card">
          <div className="report-card__label">🔎 불면장애 자가점검</div>
          <div className="report-card__num" style={{ fontSize: 20 }}>
            {dsm5.score === 1 ? 'DSM-5 기준에 해당' : '기준에 해당하지 않음'}
          </div>
          <div className="report-card__band">교육용 자가점검 · 진단이 아니에요</div>
        </div>
      )}

      {/* 감정 추이 (프리미엄) */}
      <TrendSection entries={entries} isPro={isPro} onUpgrade={onUpgrade} />

      {/* 기록 목록 */}
      {entries.length > 0 && (
        <div>
          <div className="row-between" style={{ margin: '0 4px 12px' }}>
            <h3 className="report-section-title" style={{ margin: 0 }}>
              기록 {entries.length}
            </h3>
            <ExportButton isPro={isPro} onUpgrade={onUpgrade} json={() => exportJson(data)} />
          </div>

          {visible.map((e) => (
            <EntryCard key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />
          ))}

          {hiddenCount > 0 && (
            <button className="locked" onClick={onUpgrade} style={{ width: '100%', marginTop: 4 }}>
              <span className="pro-badge">PRO</span>
              <p style={{ margin: '10px 0 2px', fontWeight: 700 }}>이전 기록 {hiddenCount}개 더</p>
              <p className="tiny">프리미엄에서 전체 기록을 볼 수 있어요.</p>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 히어로: 수면 효율 원형 링 ─────────────────────────────────────── */
function SleepEfficiencyHero({ result }: { result: AssessmentResult }) {
  const se = Math.max(0, Math.min(100, result.score))
  const R = 82
  const C = 2 * Math.PI * R
  const offset = C * (1 - se / 100)
  const band = interpretSE(se).band
  const tib = Number(result.meta?.tib ?? 0)
  const tst = Number(result.meta?.tst ?? 0)

  return (
    <div className="report-hero">
      <div className="report-hero__label">수면 효율</div>
      <div style={{ position: 'relative', width: 208, maxWidth: '100%', height: 208, margin: '0 auto' }}>
        <svg viewBox="0 0 208 208" width="208" height="208">
          <circle cx="104" cy="104" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
          <circle
            cx="104"
            cy="104"
            r={R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 104 104)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="report-hero__num">
            {se}
            <small>%</small>
          </span>
        </div>
      </div>
      <div className="report-hero__band">{band}</div>
      {tib > 0 && (
        <div className="tiny" style={{ marginTop: 6 }}>
          침대 {fmtMinutes(tib)} 중 {fmtMinutes(tst)} 수면
        </div>
      )}
    </div>
  )
}

function EmptyHero() {
  return (
    <div className="report-hero">
      <div className="report-hero__label">수면 효율</div>
      <div style={{ fontSize: 56, margin: '8px 0 4px' }}>🌙</div>
      <div className="report-hero__band" style={{ color: 'var(--text-dim)', fontWeight: 600, fontSize: 15 }}>
        아직 데이터가 없어요
      </div>
      <p className="tiny" style={{ margin: '8px 24px 0' }}>‘배우기’ 세션 1에서 수면 검사를 하면 여기에 표시돼요.</p>
    </div>
  )
}

function MetricCard({ label, value, unit, band }: { label: string; value: string; unit: string; band: string }) {
  return (
    <div className="report-card">
      <div className="report-card__label">{label}</div>
      <div className="report-card__num">
        {value}
        <small> {unit}</small>
      </div>
      <div className="report-card__band">{band}</div>
    </div>
  )
}

/* ── 감정 추이 (프리미엄) ─────────────────────────────────────────── */
function TrendSection({ entries, isPro, onUpgrade }: { entries: WorryEntry[]; isPro: boolean; onUpgrade: () => void }) {
  if (!isPro) {
    return (
      <button className="locked" onClick={onUpgrade} style={{ width: '100%' }}>
        <span className="pro-badge">PRO</span>
        <p style={{ margin: '10px 0 2px', fontWeight: 700 }}>📈 감정 추이 그래프</p>
        <p className="tiny">재구성 전/후 강도 변화를 확인해요.</p>
      </button>
    )
  }
  if (entries.length < 2) return null
  return (
    <div className="report-card">
      <div className="report-card__label" style={{ marginBottom: 14 }}>📈 감정 강도 추이 (전 → 후)</div>
      <TrendChart entries={entries} />
    </div>
  )
}

/** 의존성 없이 직접 그린 SVG 라인 차트 */
function TrendChart({ entries }: { entries: WorryEntry[] }) {
  const points = useMemo(() => [...entries].sort((a, b) => a.createdAt - b.createdAt).slice(-14), [entries])

  const W = 320
  const H = 150
  const padX = 8
  const padY = 14
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
        {[0, 50, 100].map((v) => (
          <line key={v} x1={padX} x2={W - padX} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
        ))}
        <path d={line((e) => e.intensityBefore)} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={line((e) => e.intensityAfter)} fill="none" stroke="var(--text-faint)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="chart-legend">
        <span><i style={{ background: 'var(--accent)' }} />전</span>
        <span><i style={{ background: 'var(--text-faint)' }} />후</span>
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
      <span className="tiny" style={{ display: 'block', marginBottom: 1 }}>{label}</span>
      <span className="muted">{value}</span>
    </p>
  )
}

/* ── 내보내기 ─────────────────────────────────────────────────────── */
function ExportButton({ isPro, onUpgrade, json }: { isPro: boolean; onUpgrade: () => void; json: () => string }) {
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
