// 여러 화면에서 공용으로 쓰는 작은 UI 컴포넌트 모음.

import { useEffect } from 'react'
import { intensityLabel } from '../lib/cbt'

/** 최상단/설정에 노출되는 의료 면책 배너 (치료 아님을 명확히) */
export function Disclaimer() {
  return (
    <div className="disclaimer">
      <strong>안내</strong> · 마음쉼은 <strong>치료가 아니라</strong> 스스로를 돌보는 데
      도움을 주는 <strong>자가관리 보조 도구</strong>입니다. 진단·치료를 대신하지 않습니다.
      <div className="crisis">
        지금 많이 힘들다면 혼자 견디지 마세요. 자살예방상담{' '}
        <a href="tel:109">☎ 109</a> · 정신건강상담{' '}
        <a href="tel:1577-0199">☎ 1577-0199</a> (24시간)
      </div>
    </div>
  )
}

export function ProBadge() {
  return <span className="pro-badge">PRO</span>
}

/** 0~100 감정 강도 슬라이더 */
export function IntensitySlider({
  value,
  onChange,
  color = 'var(--accent)',
}: {
  value: number
  onChange: (v: number) => void
  color?: string
}) {
  return (
    <div className="slider-wrap">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        style={{ accentColor: color }}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="감정 강도"
      />
      <span className="slider-value">
        {value}
        <small> / {intensityLabel(value)}</small>
      </span>
    </div>
  )
}

/** 잠깐 떴다 사라지는 토스트 */
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="toast">{message}</div>
}

/** 날짜 포맷 (예: 7월 18일 오후 9:30) */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
