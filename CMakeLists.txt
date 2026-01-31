cmake_minimum_required(VERSION 3.15)
project(motor_curve_generator)

set(CMAKE_CXX_STANDARD 17)

if(APPLE)
    set(CMAKE_OSX_DEPLOYMENT_TARGET "10.13")
    set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64")
endif()

# Add support for cross-compilation to Windows
if(CMAKE_CROSSCOMPILING)
    set(CMAKE_SYSTEM_NAME Windows)
    set(CMAKE_SYSTEM_VERSION 10)
    set(CMAKE_C_COMPILER x86_64-w64-mingw32-gcc)
    set(CMAKE_CXX_COMPILER x86_64-w64-mingw32-g++)
    set(CMAKE_RC_COMPILER x86_64-w64-mingw32-windres)
endif()

# Ensure dependencies use the same toolchain
if(CMAKE_TOOLCHAIN_FILE)
    set(CMAKE_C_COMPILER /usr/bin/x86_64-w64-mingw32-gcc CACHE STRING "C Compiler" FORCE)
    set(CMAKE_CXX_COMPILER /usr/bin/x86_64-w64-mingw32-g++ CACHE STRING "C++ Compiler" FORCE)
    set(CMAKE_RC_COMPILER /usr/bin/x86_64-w64-mingw32-windres CACHE STRING "Resource Compiler" FORCE)
endif()

include(FetchContent)

# Option for static linking on Windows
option(DBUILD_STATIC_WIN "Build with static runtime and libraries on Windows" OFF)

# Font download and header generation
set(FONT_KR_URL "https://github.com/googlefonts/noto-cjk/raw/main/Sans/Mono/NotoSansMonoCJKkr-Regular.otf")
set(FONT_SC_URL "https://github.com/googlefonts/noto-cjk/raw/main/Sans/Mono/NotoSansMonoCJKsc-Regular.otf")

set(FONT_DIR "${CMAKE_BINARY_DIR}/fonts")
file(MAKE_DIRECTORY ${FONT_DIR})

set(FONT_KR_PATH "${FONT_DIR}/NotoSansMonoCJKkr-Regular.otf")
set(FONT_SC_PATH "${FONT_DIR}/NotoSansMonoCJKsc-Regular.otf")
set(FONT_KR_H "${CMAKE_BINARY_DIR}/NotoSansMonoCJKkr-Regular.h")
set(FONT_SC_H "${CMAKE_BINARY_DIR}/NotoSansMonoCJKsc-Regular.h")

if(NOT EXISTS ${FONT_KR_PATH})
    message(STATUS "Downloading Korean font...")
    file(DOWNLOAD ${FONT_KR_URL} ${FONT_KR_PATH} SHOW_PROGRESS)
endif()

if(NOT EXISTS ${FONT_SC_PATH})
    message(STATUS "Downloading Chinese font...")
    file(DOWNLOAD ${FONT_SC_URL} ${FONT_SC_PATH} SHOW_PROGRESS)
endif()

# Generate headers using python script
find_package(Python3 REQUIRED)
execute_process(COMMAND ${Python3_EXECUTABLE} "${CMAKE_SOURCE_DIR}/binary_to_header.py" 
                "${FONT_KR_PATH}" "${FONT_KR_H}" "NotoSansMonoCJKkr_Regular_otf")
execute_process(COMMAND ${Python3_EXECUTABLE} "${CMAKE_SOURCE_DIR}/binary_to_header.py" 
                "${FONT_SC_PATH}" "${FONT_SC_H}" "NotoSansMonoCJKsc_Regular_otf")

if(DBUILD_STATIC_WIN AND WIN32)
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build all libraries as static" FORCE)
    set(GLFW_BUILD_SHARED_LIBS OFF CACHE BOOL "Build GLFW as a static library" FORCE)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -static -static-libgcc -static-libstdc++")
else()
    # Force GLFW to build as a shared library
    set(BUILD_SHARED_LIBS ON CACHE BOOL "Build all libraries as shared" FORCE)
    set(GLFW_BUILD_SHARED_LIBS ON CACHE BOOL "Build GLFW as a shared library" FORCE)
endif()

# GLFW
FetchContent_Declare(
    glfw
    GIT_REPOSITORY https://github.com/glfw/glfw.git
    GIT_TAG 3.3.8
    OVERRIDE_FIND_PACKAGE
)

# Dear ImGui
FetchContent_Declare(
    imgui
    GIT_REPOSITORY https://github.com/ocornut/imgui.git
    GIT_TAG v1.89.7
)

# ImGuiFileDialog
FetchContent_Declare(
    imgui_filedialog
    GIT_REPOSITORY https://github.com/aiekick/ImGuiFileDialog.git
    GIT_TAG v0.6.5
)

# Disable GLFW examples and tests
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_INSTALL OFF CACHE BOOL "" FORCE)

FetchContent_MakeAvailable(glfw imgui)

FetchContent_GetProperties(imgui_filedialog)
if(NOT imgui_filedialog_POPULATED)
    FetchContent_Populate(imgui_filedialog)
endif()

find_package(OpenGL REQUIRED)
if(UNIX AND NOT APPLE)
    find_library(X11_LIBRARIES X11)
    find_library(XRANDR_LIBRARIES Xrandr)
    find_library(XINERAMA_LIBRARIES Xinerama)
    find_library(XCURSOR_LIBRARIES Xcursor)
    target_link_libraries(imgui PRIVATE ${X11_LIBRARIES} ${XRANDR_LIBRARIES} ${XINERAMA_LIBRARIES} ${XCURSOR_LIBRARIES})
endif()

add_executable(motor_curve_generator main.cpp)
target_include_directories(motor_curve_generator PRIVATE ${CMAKE_BINARY_DIR})
target_link_libraries(motor_curve_generator PRIVATE imgui glfw OpenGL::GL)

if(WIN32)
    add_custom_command(TARGET motor_curve_generator POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
        ${glfw_BINARY_DIR}/src/glfw3.dll
        $<TARGET_FILE_DIR:motor_curve_generator>)
endif()