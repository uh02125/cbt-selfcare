// 프리미엄 안내 / 구매 화면.
// '구매' 버튼은 Stripe Payment Link 로 이동합니다(실제 결제).
// 결제 성공 후 Stripe 가 앱으로 리다이렉트하면 App 이 프리미엄을 켭니다.

import { useStore } from '../store'
import {
  PREMIUM_FEATURES,
  PREMIUM_PRICE_LABEL,
  STRIPE_PAYMENT_LINK,
  startCheckout,
} from '../lib/premium'
import { formatDate } from '../components/common'

export function Paywall({ onClose }: { onClose: () => void }) {
  const { data } = useStore()
  const isPro = data.premium.active

  if (isPro) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💙</div>
        <h2 className="step-title">프리미엄 이용 중이에요</h2>
        <p className="muted" style={{ fontSize: 13.5 }}>
          모든 기능이 열려 있습니다. 함께해 주셔서 고마워요.
        </p>
        {data.premium.unlockedAt && (
          <p className="tiny" style={{ marginTop: 8 }}>
            구매일: {formatDate(data.premium.unlockedAt)}
          </p>
        )}
        <button className="btn btn--block" style={{ marginTop: 16 }} onClick={onClose}>
          닫기
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span className="pro-badge">PRO</span>
        <h2 className="step-title" style={{ marginTop: 10 }}>
          마음쉼, 더 깊게 쓰기
        </h2>
        <p className="muted" style={{ fontSize: 13.5, margin: '4px 12px 0' }}>
          한 번 구매로 계속 쓰는 일회성 결제예요. 구독 아님.
        </p>
      </div>

      <ul className="feature-list">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f.title}>
            <span className="check">✓</span>
            <div>
              <b>{f.title}</b>
              <span>{f.desc}</span>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ textAlign: 'center', margin: '4px 0 14px' }}>
        <span className="price">
          {PREMIUM_PRICE_LABEL} <small>· 일회성</small>
        </span>
      </div>

      <button className="btn btn--primary btn--block" onClick={startCheckout}>
        프리미엄 구매하기
      </button>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 8 }} onClick={onClose}>
        나중에
      </button>

      {!STRIPE_PAYMENT_LINK && (
        <p className="tiny" style={{ marginTop: 12, color: 'var(--warn)' }}>
          ⚙ 개발자 안내: 아직 결제 링크가 연결되지 않았습니다. <code>.env</code> 의{' '}
          <code>VITE_STRIPE_PAYMENT_LINK</code> 를 설정하세요. (README 참고)
        </p>
      )}

      <p className="tiny" style={{ marginTop: 12, textAlign: 'center' }}>
        결제는 Stripe 를 통해 안전하게 처리되며, 카드 정보는 앱에 저장되지 않습니다.
      </p>
    </div>
  )
}
