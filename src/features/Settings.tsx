// 설정: 데이터 내보내기/가져오기, 전체 초기화, 프리미엄 상태, 면책 고지.

import { useRef, useState } from 'react'
import { useStore } from '../store'
import { exportJson } from '../lib/storage'
import type { AppData } from '../types'
import { Disclaimer } from '../components/common'

export function Settings({ onUpgrade }: { onUpgrade: () => void }) {
  const { data, replaceAll, resetAll } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function doExport() {
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maeum-shim-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData
        if (!Array.isArray(parsed.entries)) throw new Error('형식 오류')
        replaceAll(parsed)
        setMsg('복원했어요.')
      } catch {
        setMsg('파일을 읽지 못했어요. 올바른 백업 파일인지 확인해주세요.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmReset() {
    if (confirm('모든 기록이 이 기기에서 영구 삭제됩니다. 계속할까요?')) {
      resetAll()
      setMsg('모든 데이터를 삭제했어요.')
    }
  }

  return (
    <div>
      <div className="card">
        <div className="row-between">
          <div>
            <b>프리미엄</b>
            <p className="tiny" style={{ margin: '2px 0 0' }}>
              {data.premium.active ? '이용 중' : '무료 사용 중'}
            </p>
          </div>
          {!data.premium.active && (
            <button className="btn btn--primary" style={{ padding: '9px 14px' }} onClick={onUpgrade}>
              업그레이드
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <b>내 데이터</b>
        <p className="tiny" style={{ margin: '2px 0 12px' }}>
          모든 기록은 이 기기 브라우저에만 저장됩니다. 서버로 전송되지 않아요.
        </p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn" onClick={doExport}>
            백업 내보내기
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            백업 가져오기
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onPickFile} />
        <button className="btn btn--danger btn--block" style={{ marginTop: 10 }} onClick={confirmReset}>
          전체 삭제
        </button>
        {msg && (
          <p className="tiny" style={{ marginTop: 10, color: 'var(--good)' }}>
            {msg}
          </p>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <Disclaimer />
      </div>

      <p className="tiny" style={{ textAlign: 'center', marginTop: 18 }}>
        마음쉼 v0.1 · 자가관리 보조 도구
      </p>
    </div>
  )
}
