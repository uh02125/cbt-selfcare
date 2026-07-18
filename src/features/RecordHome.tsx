// 기록 탭 홈 — 큰 카드 메뉴. 각 카드는 해당 플로우(전체화면 스텝)로 진입.

type Target = 'diary' | 'sleep' | 'breathe' | 'thought'

export function RecordHome({ onOpen }: { onOpen: (t: Target) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
      {/* 주 액션: 오늘의 수면 기록 */}
      <button
        onClick={() => onOpen('diary')}
        style={{
          textAlign: 'left',
          border: '1px solid var(--border)',
          borderRadius: 26,
          padding: '26px 24px',
          cursor: 'pointer',
          background:
            'radial-gradient(130% 100% at 100% 0%, rgba(56,189,248,0.28), transparent 60%), linear-gradient(180deg, #17243f, #111a2e)',
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 10 }}>☀️</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>오늘의 수면 기록</div>
        <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>
          잠든 시간을 남기면 수면효율이 계산돼요
        </div>
      </button>

      {/* 보조 카드들 */}
      <MenuCard icon="🌙" title="잠들기 루틴" desc="걱정 비우고 수면 위생 점검" onClick={() => onOpen('sleep')} />
      <MenuCard icon="🫧" title="호흡하기" desc="4-7-8 호흡으로 긴장 풀기" onClick={() => onOpen('breathe')} />
      <MenuCard icon="✏️" title="생각 기록" desc="걱정을 다르게 바라보기 (CBT)" onClick={() => onOpen('thought')} />
    </div>
  )
}

function MenuCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        textAlign: 'left',
        width: '100%',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '18px 20px',
        cursor: 'pointer',
        background: 'linear-gradient(180deg, #18233c, #131b30)',
      }}
    >
      <span style={{ fontSize: 26, flex: '0 0 auto' }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>{desc}</span>
      </span>
      <span style={{ color: 'var(--text-faint)', fontSize: 20 }}>›</span>
    </button>
  )
}
