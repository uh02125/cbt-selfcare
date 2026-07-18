// 핵심 CBT 플로우: 걱정 기록 → 인지 왜곡 식별 → 소크라테스 질문 → 재평가 → 저장.

import { useState } from 'react'
import { useStore } from '../store'
import { DISTORTIONS, EMOTION_SUGGESTIONS, SOCRATIC_STEPS } from '../lib/cbt'
import type { DistortionId } from '../types'
import { Disclaimer, IntensitySlider } from '../components/common'

const TOTAL_STEPS = 4

interface Draft {
  situation: string
  automaticThought: string
  emotion: string
  intensityBefore: number
  distortions: DistortionId[]
  evidenceFor: string
  evidenceAgainst: string
  friendAdvice: string
  balancedThought: string
  intensityAfter: number
}

const emptyDraft: Draft = {
  situation: '',
  automaticThought: '',
  emotion: '',
  intensityBefore: 60,
  distortions: [],
  evidenceFor: '',
  evidenceAgainst: '',
  friendAdvice: '',
  balancedThought: '',
  intensityAfter: 40,
}

export function WorryFlow({ onSaved }: { onSaved: () => void }) {
  const { addEntry } = useStore()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function toggleDistortion(id: DistortionId) {
    setDraft((d) => ({
      ...d,
      distortions: d.distortions.includes(id)
        ? d.distortions.filter((x) => x !== id)
        : [...d.distortions, id],
    }))
  }

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function save() {
    addEntry({ ...draft })
    onSaved()
  }

  // 각 단계별 다음 진행 가능 여부
  const canNext = (() => {
    if (step === 0) return draft.automaticThought.trim().length > 0
    if (step === 2) return draft.balancedThought.trim().length > 0
    return true
  })()

  return (
    <div>
      <div className="steps" aria-hidden>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span key={i} className={`steps__dot ${i <= step ? 'steps__dot--done' : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <section className="card">
          <div className="step-eyebrow">1단계 · 기록</div>
          <h2 className="step-title">지금 어떤 걱정이 드나요?</h2>
          <p className="step-desc">떠오르는 생각을 있는 그대로, 짧게 적어도 괜찮아요.</p>

          <label className="field">
            <span className="field__label">어떤 상황이었나요? <span className="faint">(선택)</span></span>
            <textarea
              value={draft.situation}
              onChange={(e) => patch({ situation: e.target.value })}
              placeholder="예: 내일 있을 발표를 준비하다가"
            />
          </label>

          <label className="field">
            <span className="field__label">머릿속에 떠오른 생각</span>
            <textarea
              value={draft.automaticThought}
              onChange={(e) => patch({ automaticThought: e.target.value })}
              placeholder="예: 발표를 망치면 다들 나를 무능하다고 볼 거야."
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">지금 느끼는 감정</span>
            <input
              type="text"
              value={draft.emotion}
              onChange={(e) => patch({ emotion: e.target.value })}
              placeholder="예: 불안"
            />
            <div className="chips" style={{ marginTop: 8 }}>
              {EMOTION_SUGGESTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`chip ${draft.emotion === em ? 'chip--on' : ''}`}
                  onClick={() => patch({ emotion: em })}
                >
                  {em}
                </button>
              ))}
            </div>
          </label>

          <label className="field" style={{ marginBottom: 4 }}>
            <span className="field__label">감정의 강도</span>
            <IntensitySlider value={draft.intensityBefore} onChange={(v) => patch({ intensityBefore: v })} />
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="card">
          <div className="step-eyebrow">2단계 · 살펴보기</div>
          <h2 className="step-title">생각에 '왜곡'이 섞여 있진 않나요?</h2>
          <p className="step-desc">
            해당하는 것이 있다면 골라보세요. 없어도 괜찮습니다 — 알아차리는 것만으로 충분해요.
          </p>
          <div className="chips" style={{ flexDirection: 'column' }}>
            {DISTORTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`chip chip--block ${draft.distortions.includes(d.id) ? 'chip--on' : ''}`}
                onClick={() => toggleDistortion(d.id)}
              >
                {d.name}
                <span className="chip__desc">{d.short}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <div className="step-eyebrow">3단계 · 다시 생각하기</div>
          <h2 className="step-title">한 걸음 떨어져서 질문해봐요</h2>
          <p className="step-desc">
            원래 생각: <b className="muted">“{draft.automaticThought || '—'}”</b>
          </p>
          {SOCRATIC_STEPS.map((q) => (
            <label className="field" key={q.key}>
              <span className="field__label">{q.title}</span>
              <p className="field__hint">{q.prompt}</p>
              <textarea
                value={draft[q.key]}
                onChange={(e) => patch({ [q.key]: e.target.value } as Partial<Draft>)}
                placeholder={q.placeholder}
              />
            </label>
          ))}
        </section>
      )}

      {step === 3 && (
        <section className="card">
          <div className="step-eyebrow">4단계 · 다시 느껴보기</div>
          <h2 className="step-title">지금은 감정이 어떤가요?</h2>
          <p className="step-desc">균형 잡힌 생각을 떠올리며, 지금의 감정 강도를 다시 재어보세요.</p>

          {draft.balancedThought && (
            <div className="entry__balanced" style={{ marginBottom: 18 }}>
              💡 {draft.balancedThought}
            </div>
          )}

          <div className="row-between" style={{ marginBottom: 6 }}>
            <span className="tiny">처음 강도</span>
            <span className="tiny">{draft.intensityBefore}</span>
          </div>
          <label className="field">
            <span className="field__label">지금 강도</span>
            <IntensitySlider
              value={draft.intensityAfter}
              onChange={(v) => patch({ intensityAfter: v })}
              color="var(--good)"
            />
          </label>

          <DeltaHint before={draft.intensityBefore} after={draft.intensityAfter} />
        </section>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        {step > 0 && (
          <button className="btn btn--ghost" onClick={back}>
            이전
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button className="btn btn--primary" onClick={next} disabled={!canNext}>
            다음
          </button>
        ) : (
          <button className="btn btn--primary" onClick={save}>
            기록 저장
          </button>
        )}
      </div>

      {step === 0 && (
        <div style={{ marginTop: 18 }}>
          <Disclaimer />
        </div>
      )}
    </div>
  )
}

function DeltaHint({ before, after }: { before: number; after: number }) {
  const diff = before - after
  if (diff > 0)
    return (
      <p className="tiny" style={{ color: 'var(--good)' }}>
        강도가 {diff}만큼 낮아졌어요. 잘 하고 있어요 🙂
      </p>
    )
  if (diff === 0) return <p className="tiny">지금은 변화가 없네요. 그것도 괜찮습니다.</p>
  return (
    <p className="tiny" style={{ color: 'var(--warn)' }}>
      오히려 조금 올라갔네요. 무리하지 말고, 필요하면 호흡 탭에서 잠시 쉬어가요.
    </p>
  )
}
