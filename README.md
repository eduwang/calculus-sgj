# 미분과 적분 시각화 (Calculus Visualization)

카발리에리의 원리를 활용한 3D 시각화 웹 애플리케이션입니다.

## 📋 프로젝트 소개

이 프로젝트는 미적분학의 핵심 개념인 **Cavalieri의 불가분량법**, **Cavalieri의 원리**, 그리고 **Archimedes의 평형법**을 3D 그래픽으로 시각화하여 이해를 돕는 웹 애플리케이션입니다.

### 주요 기능

1. **Cavalieri의 불가분량법**
   - 사각기둥, 원기둥, 원뿔을 조각으로 나누어 시각화
   - 조각 수 조절 및 옆으로 밀기 기능
   - 3D 회전 및 카메라 조작

2. **Cavalieri의 원리를 활용해 구의 부피 구하기**
   - 구의 부피 공식 (4/3 πr³)의 원리 탐구
   - GLTF 3D 모델을 활용한 애니메이션 시각화
   - 슬라이더로 애니메이션 프레임 제어

3. **Archimedes의 평형법으로 구의 부피 구하기**
   - 아르키메데스의 평형법을 활용한 구의 부피 구하기 방법 시각화
   - 3단계로 나누어진 시각화: 원의 방정식 → 원뿔/구/원기둥 그리기 → 평형법 적용
   - 슬라이더로 애니메이션 진행도 제어
   - MathJax를 활용한 수식 표현

## 🚀 시작하기

### 필수 요구사항

- Node.js (v14 이상)
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속할 수 있습니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 미리보기

```bash
npm run preview
```

## 🛠 기술 스택

- **Vite** - 빌드 도구
- **Three.js** - 3D 그래픽 라이브러리
- **lil-gui** - 3D 컨트롤 UI 라이브러리
- **MathJax** - 수학 수식 렌더링
- **Vanilla JavaScript** - 순수 JavaScript로 구현
- **HTML/CSS** - 마크업 및 스타일링

## 📁 프로젝트 구조

```
calculus-sgj/
├── index.html                          # 메인 페이지
├── cavalieri_method-of-indivisibles.html  # 불가분량법 시각화 페이지
├── cavalieri-principle.html            # 구의 부피 구하기 페이지
├── archimedes-equilibrium.html         # 아르키메데스 평형법 시각화 페이지
├── src/
│   ├── cavalieri_method-of-indivisibles.js
│   ├── cavalieri-principle.js
│   ├── archimedes-equilibrium.js       # 아르키메데스 평형법 시각화
│   ├── style.css                       # 공통 스타일
│   └── 3dmodels/
│       └── cavalieri_new.gltf          # 3D 모델 파일
├── public/
│   ├── 3dmodels/
│   │   └── cavalieri_new.gltf         # 3D 모델 파일 (배포용)
│   └── vite.svg
├── vite.config.js                      # Vite 설정
├── netlify.toml                        # Netlify 배포 설정
└── package.json
```

## 🌐 배포

이 프로젝트는 Netlify를 통해 배포할 수 있습니다.

### Netlify 배포 설정

- **빌드 명령**: `npm run build`
- **배포 디렉토리**: `dist`

`netlify.toml` 파일에 배포 설정이 포함되어 있어 GitHub 저장소를 Netlify에 연결하면 자동으로 배포됩니다.

## 📝 기능 설명

### Cavalieri의 불가분량법

- 3가지 도형(사각기둥, 원기둥, 원뿔) 선택 가능
- 조각 수 슬라이더로 도형을 여러 조각으로 분할
- 옆으로 밀기 기능으로 각 조각의 위치 조절
- OrbitControls로 3D 뷰 조작 (위아래 회전, 좌우 평행이동)

### Cavalieri의 원리를 활용해 구의 부피 구하기

- 구의 부피 공식의 원리를 3D 애니메이션으로 시각화
- 슬라이더로 애니메이션 프레임을 제어하여 단계별로 관찰 가능
- 입체도형을 자르는 평면의 이동을 시각적으로 확인

### Archimedes의 평형법으로 구의 부피 구하기

- 아르키메데스의 평형법을 활용한 구의 부피 구하기 방법 시각화
- 3단계 시각화:
  1. **원의 방정식에서 출발**: 중심이 (r,0)이고 반지름이 r인 원을 xy 평면에 표시
  2. **원뿔, 구, 원기둥 그리기**: x 값을 조절하여 각 도형의 부분을 시각화
  3. **평형법 적용**: 구와 원뿔을 회전 및 이동시켜 평형 원리를 시각화
- 슬라이더로 애니메이션 진행도를 직접 제어하거나 자동 재생 가능
- MathJax를 활용한 수식 표현으로 수학적 원리 이해 지원

## 👤 제작자

Made by Hyowon Wang

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

