# Motor Curve Generator (모터 커브 생성기)

ImGui와 GLFW를 사용한 C++ 기반의 모터 제어 커브 생성 GUI 도구입니다.

## 주요 기능
- 인터랙티브 커브 편집 (점 추가, 이동, 삭제).
- 진폭, 주파수, 밀도 설정이 가능한 사인파 생성기.
- **RDP 최적화**: Ramer-Douglas-Peucker 알고리즘을 사용한 자동 커브 단순화로 아두이노 메모리 절약.
- **메모리 안정성**: 아두이노 Uno/Nano를 위해 PROGMEM(Flash 메모리) 및 최적화된 데이터 타입(uint8_t) 사용.
- 다국어 지원 (한국어, 영어, 중국어).
- 크로스 플랫폼: 리눅스 및 윈도우 네이티브 지원.

## 빌드 방법

### 사전 준비
- CMake 3.15 이상
- C++17 컴파일러
- OpenGL 드라이버
- 리눅스 의존성: `libglfw3-dev`, `libglew-dev`, `libx11-dev` 등

### 빌드 실행
```bash
# 리눅스용
cmake -B build-linux -S .
cmake --build build-linux

# 윈도우용 (리눅스에서 크로스 컴파일)
cmake -B build-win -S . -DCMAKE_TOOLCHAIN_FILE=windows_toolchain.cmake -DBUILD_STATIC_WIN=ON
cmake --build build-win
```

## 아두이노 사용법
1. "아두이노 코드 생성" 버튼을 눌러 코드를 생성합니다.
2. `.ino` 파일로 저장합니다.
3. 아두이노 IDE에서 열고 보드에 업로드합니다.
4. 모터 커브 데이터는 SRAM 초과를 방지하기 위해 Flash 메모리에 저장됩니다.

## 라이선스
GNU General Public License v3.0 (GPLv3). 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
Copyright © 2025 Choi Haram. All rights reserved.
