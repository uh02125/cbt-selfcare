// 결제 / 프리미엄 잠금 해제 로직.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │ 아키텍처 메모 (중요)                                                    │
// │                                                                        │
// │ 이 앱은 백엔드가 없는 "로컬 전용" 앱입니다. 그래서 실제 결제는          │
// │ Stripe **Payment Link**(Stripe가 호스팅하는 결제 페이지)로 처리합니다. │
// │  1) 사용자가 Payment Link로 이동해 카드로 결제 → 실제 과금 발생        │
// │  2) 결제 성공 후 Stripe가 아래 successUrl 로 리다이렉트                 │
// │     (예: https://앱주소/?checkout=success&session_id={CHECKOUT_SESSION_ID}) │
// │  3) 앱이 그 파라미터를 감지해 로컬에 프리미엄 플래그를 저장            │
// │                                                                        │
// │ ⚠ 잠금 해제는 "로컬 신뢰" 기반입니다. 결제 자체는 진짜지만, 사용자가   │
// │   URL을 흉내내 프리미엄을 켤 수도 있습니다. 매출 방어가 필요해지면      │
// │   서버리스 함수 1개(예: Vercel/Netlify Function)로 Stripe API에         │
// │   session_id 를 조회해 결제 완료를 검증하도록 verifyPurchase() 를        │
// │   교체하세요. (아래 TODO 참고)                                          │
// └──────────────────────────────────────────────────────────────────────┘

/** Stripe 대시보드에서 만든 Payment Link URL 을 여기에 넣으세요. */
export const STRIPE_PAYMENT_LINK =
  import.meta.env.VITE_STRIPE_PAYMENT_LINK ?? ''

/** 프리미엄 1회 구매 가격 표기 (표시용) */
export const PREMIUM_PRICE_LABEL = '₩4,900'

export interface PremiumFeature {
  title: string
  desc: string
}

/** 프리미엄에서 열리는 기능 목록 (Paywall 표시용) */
export const PREMIUM_FEATURES: PremiumFeature[] = [
  { title: '무제한 기록 보관', desc: '무료는 최근 7개까지만 표시됩니다.' },
  { title: '감정 추이 그래프', desc: '재구성 전/후 강도 변화를 한눈에.' },
  { title: '데이터 내보내기', desc: '내 기록을 JSON 파일로 백업.' },
  { title: '수면·호흡 심화 루틴', desc: '불면·불안 완화 가이드 추가 개방.' },
]

/**
 * 결제 성공 리다이렉트를 감지합니다.
 * successUrl 은 Stripe Payment Link 설정에서
 *   https://<앱주소>/?checkout=success&session_id={CHECKOUT_SESSION_ID}
 * 로 지정해 두어야 합니다.
 */
export function detectCheckoutReturn(): { success: boolean; sessionId: string | null } {
  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('session_id')
  // Stripe Payment Link 는 결제 성공 후에만 이 주소로 리다이렉트하며 session_id(cs_...)를 붙인다.
  // 우리가 지정한 checkout=success 가 붙는 경우도 있고, Stripe 가 session_id 만 붙이는 경우도 있어
  // 둘 중 하나라도 있으면 결제 완료로 간주한다.
  const success = params.get('checkout') === 'success' || (sessionId?.startsWith('cs_') ?? false)
  return { success, sessionId }
}

/** URL 의 결제 관련 쿼리스트링을 제거해 새로고침 시 재발동을 막습니다. */
export function clearCheckoutParams(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('checkout')
  url.searchParams.delete('session_id')
  window.history.replaceState({}, '', url.toString())
}

/**
 * 결제 검증 훅.
 *
 * 현재는 로컬 신뢰 기반이라 리다이렉트만 확인하고 true 를 돌려줍니다.
 * TODO(수익 방어): 백엔드/서버리스 함수를 두게 되면 아래를 실제 검증으로 교체.
 *   const r = await fetch(`/api/verify?session_id=${sessionId}`)
 *   const { paid } = await r.json()
 *   return paid === true
 */
export async function verifyPurchase(sessionId: string | null): Promise<boolean> {
  return sessionId != null ? true : true
}

/** 결제 페이지로 이동 */
export function startCheckout(): void {
  if (!STRIPE_PAYMENT_LINK) {
    alert(
      '결제 링크가 아직 설정되지 않았습니다.\n\n.env 파일에 VITE_STRIPE_PAYMENT_LINK 를 설정하세요.\n(README 참고)',
    )
    return
  }
  window.location.href = STRIPE_PAYMENT_LINK
}

/** 무료 사용자에게 보여줄 최대 기록 수 */
export const FREE_HISTORY_LIMIT = 7
