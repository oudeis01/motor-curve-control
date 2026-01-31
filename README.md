# Motor Curve Generator

A C++ based GUI tool to generate motor control curves (e.g., for Arduino) using ImGui and GLFW.

## Features
- Interactive curve editing (add, move, delete points).
- Sine wave generation with configurable amplitude, frequency, and density.
- **RDP Optimization**: Automatic curve simplification using the Ramer-Douglas-Peucker algorithm to save Arduino memory.
- **Memory Safety**: Efficient data storage using PROGMEM (Flash memory) and optimized data types (uint8_t) for Arduino Uno/Nano.
- Multilingual support (English, Korean, Chinese).
- Cross-platform: Native support for Linux and Windows.

## Build Instructions

### Prerequisites
- CMake 3.15+
- C++17 Compiler
- OpenGL drivers
- Linux dependencies: `libglfw3-dev`, `libglew-dev`, `libx11-dev`, etc.

### Build
```bash
# For Linux
cmake -B build-linux -S .
cmake --build build-linux

# For Windows (Cross-compile from Linux)
cmake -B build-win -S . -DCMAKE_TOOLCHAIN_FILE=windows_toolchain.cmake -DBUILD_STATIC_WIN=ON
cmake --build build-win
```

## Arduino Usage
1. Generate the code using the "Generate Arduino Code" button.
2. Save as an `.ino` file.
3. Open in Arduino IDE and upload to your board.
4. The motor curve is stored in Flash memory to prevent SRAM overflow.

## License
GNU General Public License v3.0 (GPLv3). See [LICENSE](LICENSE) for details.
Copyright © 2025 Choi Haram. All rights reserved.
