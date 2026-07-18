import { useEffect, useState } from 'react'
import { useStore } from './store'
import {
  clearCheckoutParams,
  detectCheckoutReturn,
  verifyPurchase,
} from './lib/premium'
import { WorryFlow } from './features/WorryFlow'
import { History } from './features/History'
import { Breathing } from './features/Breathing'
import { Sleep } from './features/Sleep'
import { Learn } from './features/Learn'
import { Settings } from './features/Settings'
import { Paywall } from './features/Paywall'
import { Toast } from './components/common'
import type { TabId } from './lib/program'

type Tab = TabId

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'record', label: '기록', icon: '📝' },
  { id: 'learn', label: '배우기', icon: '📖' },
  { id: 'history', label: '추이', icon: '📈' },
  { id: 'breathe', label: '호흡', icon: '🫧' },
  { id: 'sleep', label: '수면', icon: '🌙' },
  { id: 'settings', label: '설정', icon: '⚙️' },
]

const TAB_TITLES: Record<Tab, { title: string; sub: string }> = {
  record: { title: '마음쉼', sub: '걱정을 적고, 다르게 바라보기' },
  learn: { title: '배우기', sub: '수면을 이해하는 4주 교육 과정' },
  history: { title: '나의 추이', sub: '기록이 쌓일수록 보이는 변화' },
  breathe: { title: '호흡하기', sub: '지금 이 순간을 가라앉히기' },
  sleep: { title: '잠들기 전', sub: '머리를 비우고 내려놓기' },
  settings: { title: '설정', sub: '데이터와 계정 관리' },
}

export function App() {
  const { setPremiumActive } = useStore()
  const [tab, setTab] = useState<Tab>('record')
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // 결제 성공 리다이렉트 감지 → 프리미엄 활성화
  useEffect(() => {
    const { success, sessionId } = detectCheckoutReturn()
    if (!success) return
    let cancelled = false
    verifyPurchase(sessionId).then((ok) => {
      if (cancelled) return
      if (ok) {
        setPremiumActive(sessionId)
        setToast('프리미엄이 활성화됐어요 💙')
      }
      clearCheckoutParams()
    })
    return () => {
      cancelled = true
    }
  }, [setPremiumActive])

  function openPaywall() {
    setPaywallOpen(true)
  }

  const header = TAB_TITLES[tab]

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          {tab === 'record' && <span aria-hidden>🌿</span>}
          {header.title}
        </h1>
        <p className="app__subtitle">{header.sub}</p>
      </header>

      <main className="app__main">
        {paywallOpen ? (
          <Paywall onClose={() => setPaywallOpen(false)} />
        ) : (
          <>
            {tab === 'record' && (
              <WorryFlow
                onSaved={() => {
                  setToast('기록을 저장했어요')
                  setTab('history')
                }}
              />
            )}
            {tab === 'learn' && <Learn onNavigate={setTab} />}
            {tab === 'history' && <History onUpgrade={openPaywall} />}
            {tab === 'breathe' && <Breathing />}
            {tab === 'sleep' && (
              <Sleep
                onSaved={() => {
                  setToast('오늘 밤 기록을 저장했어요')
                }}
              />
            )}
            {tab === 'settings' && <Settings onUpgrade={openPaywall} />}
          </>
        )}
      </main>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabbar__item ${tab === t.id && !paywallOpen ? 'tabbar__item--active' : ''}`}
            onClick={() => {
              setPaywallOpen(false)
              setTab(t.id)
            }}
          >
            <span className="tabbar__icon" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
