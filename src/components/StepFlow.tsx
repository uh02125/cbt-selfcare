// 공통 스텝 플로우 셸.
// 한 스텝이 화면을 꽉 채우고(스크롤 없이), '다음'을 누르면 화면 전체가 전환됩니다.
// 상단에 진행바 + "n/total", 하단에 이전/다음 버튼.

import type { ReactNode } from 'react'

export function StepFlow({
  step,
  total,
  children,
  onNext,
  onPrev,
  onClose,
  nextLabel = '다음',
  canNext = true,
  hideNext = false,
}: {
  step: number // 0-based
  total: number
  children: ReactNode
  onNext: () => void
  onPrev?: () => void
  onClose?: () => void
  nextLabel?: string
  canNext?: boolean
  hideNext?: boolean
}) {
  return (
    <div className="stepflow">
      <div className="stepflow__top">
        {onClose ? (
          <button className="stepflow__close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        ) : (
          <span style={{ width: 8 }} />
        )}
        <div className="stepflow__bar">
          <div style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
        <span className="stepflow__count">
          {step + 1}/{total}
        </span>
      </div>

      {/* key={step} 로 스텝이 바뀔 때마다 리마운트 → 전환 애니메이션 */}
      <div className="stepflow__body" key={step}>
        {children}
      </div>

      <div className="stepflow__nav">
        {onPrev && step > 0 && (
          <button className="btn btn--ghost stepflow__prev" onClick={onPrev}>
            이전
          </button>
        )}
        {!hideNext && (
          <button className="btn btn--primary stepflow__next" disabled={!canNext} onClick={onNext}>
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
