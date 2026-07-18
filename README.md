# 마음쉼 (Maeum-shim) · CBT 기반 자가관리 보조 도구

불면·불안 완화를 위한 짧은 **인지행동치료(CBT)** 루틴을 담은 모바일 웹앱입니다.
걱정을 기록하고 → 인지 재구성 질문으로 다르게 바라보고 → 감정 변화 추이를 확인합니다.

> ⚠️ **이 앱은 치료가 아닙니다.** 의료·심리 치료나 전문가 상담을 대신하지 않는
> **자가관리 보조 도구**입니다. 위기 상황에서는 자살예방상담(☎109) 또는
> 정신건강상담(☎1577-0199, 24시간)으로 연락하세요.

## 주요 기능

| 탭 | 내용 |
|---|---|
| 📝 기록 | 걱정 기록 → 인지 왜곡 식별 → 소크라테스식 질문 → 재평가(4단계) |
| 📈 추이 | 과거 기록 목록, 감정 강도 전/후 추이 그래프 *(그래프·무제한·내보내기는 프리미엄)* |
| 🫧 호흡 | 4-7-8 호흡 애니메이션 가이드 (무료) |
| 🌙 수면 | 잠들기 전 '생각 비우기' + '걱정 미루기' + 수면 위생 체크 |
| ⚙️ 설정 | 백업 내보내기/가져오기, 전체 삭제, 프리미엄 상태 |

## 개인정보

모든 데이터는 **사용자 기기의 브라우저(localStorage)에만** 저장됩니다.
서버로 전송되지 않으며, 백업(JSON)은 사용자가 직접 파일로 내보낼 때만 생성됩니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 미리보기
npm run typecheck  # 타입 검사
```

## 수익화 — 실제 결제 연동 (Stripe Payment Link)

이 앱은 백엔드가 없는 **로컬 전용** 앱이라, 서버 없이도 실제 결제가 가능한
**Stripe Payment Link**(Stripe 호스팅 결제 페이지)를 사용합니다.

### 설정 방법

1. [Stripe 대시보드](https://dashboard.stripe.com/) → **Payment Links** 에서
   프리미엄 상품(일회성 결제)을 만듭니다.
2. Payment Link 설정의 **결제 후 이동(After payment)** 을
   *"Redirect to your website"* 로 두고 아래 URL 을 입력합니다:
   ```
   https://<배포된-앱-주소>/?checkout=success&session_id={CHECKOUT_SESSION_ID}
   ```
3. `.env.example` 을 `.env` 로 복사하고 링크를 넣습니다:
   ```bash
   cp .env.example .env
   # VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/xxxxxxxx
   ```
4. 사용자가 결제를 마치면 앱으로 리다이렉트되고, 프리미엄이 자동으로 켜집니다.

### ⚠️ 보안 한계와 개선 경로

현재 프리미엄 잠금 해제는 **로컬 신뢰 기반**입니다. 결제 자체는 100% 실제로
이뤄지지만, 기술적으로 능숙한 사용자가 리다이렉트 URL 을 흉내내 프리미엄을 켤
수도 있습니다. MVP 에는 충분하지만, 매출 방어가 필요해지면:

- 서버리스 함수 1개(예: Vercel/Netlify Function)를 추가하고
- `src/lib/premium.ts` 의 `verifyPurchase()` 를 그 함수 호출로 교체해
  Stripe API 로 `session_id` 결제 완료 여부를 서버에서 검증하세요.

관련 코드에는 모두 `TODO` 주석으로 표시해 두었습니다.

## 앱 정체성에 대한 원칙

- "치료(treatment/therapy)"가 아니라 "자가관리 보조 도구"로 일관되게 표기.
- 위기 상황 안내(상담 전화)를 기록 화면과 설정에 상시 노출.
- 진단·처방·의학적 단정 표현을 사용하지 않음.

## 📱 iOS / Android 앱으로 빌드 (Capacitor)

이 프로젝트는 **Capacitor**로 감싸져 있어, 위 React 코드를 그대로 네이티브 앱으로
빌드할 수 있습니다. `android/`, `ios/` 폴더가 네이티브 프로젝트입니다.

```bash
npm run sync        # 웹 빌드 → 네이티브에 동기화 (코드 수정 후 매번)
npm run android     # 동기화 후 Android Studio 열기
npm run ios         # 동기화 후 Xcode 열기 (macOS 필요)
```

### 빌드에 필요한 것
- **Android**: [Android Studio](https://developer.android.com/studio) + JDK 17.
  Studio에서 에뮬레이터나 실기기로 Run ▶ 하면 앱이 뜹니다. 배포는 `.aab` 생성 후 Play Console 업로드.
- **iOS**: **macOS + Xcode** 필수 (Windows에서는 빌드 불가, 코드 스캐폴딩만 됨).
  Mac에서 `npm run ios` → Xcode에서 실기기/시뮬레이터 Run.

### ⚠️ 스토어 배포 시 결제 규정 (중요)
Apple App Store / Google Play는 **디지털 상품(프리미엄 잠금 해제)에 자사 인앱결제(IAP)를
강제**합니다. 현재의 Stripe Payment Link 방식은 **인앱에서 사용 시 심사에서 거절**됩니다.
스토어 앱으로 낼 경우:
- `@revenuecat/purchases-capacitor` 또는 각 플랫폼 IAP로 `src/lib/premium.ts` 의
  `startCheckout()` / `verifyPurchase()` 를 교체하세요.
- 수수료는 15~30% (Stripe 웹결제는 ~2.9%). 웹/PWA 병행 배포를 함께 고려하면 좋습니다.

### 네이티브에서의 Stripe 리다이렉트 주의
네이티브 웹뷰는 `https://localhost` 로 실행되어, Stripe 외부 결제 후 앱으로 돌아오려면
**딥링크(App Links / Universal Links)** 설정이 추가로 필요합니다. (웹/PWA 에서는 불필요)

## 기술 스택

Vite · React 18 · TypeScript · 의존성 최소화(차트는 자체 SVG 구현, 라우터·상태관리 라이브러리 없음).
