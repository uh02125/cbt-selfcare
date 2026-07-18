import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.maeumshim.app',
  appName: '마음쉼',
  webDir: 'dist',
  backgroundColor: '#0b1120',
  // 네이티브 앱에서는 상태바가 어두운 배경 위에 오므로 밝은 아이콘 사용
  plugins: {
    // 스플래시/상태바 플러그인을 추가할 때 여기서 설정합니다.
  },
}

export default config
