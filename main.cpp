#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>
#include <GLFW/glfw3.h>
#include <cmath>
#include <vector>
#include <map>
#include <fstream>
#include <algorithm>
#include <ImGuiFileDialog.h>
#include "NotoSansMonoCJKkr-Regular.h"
#include "NotoSansMonoCJKsc-Regular.h"

#ifdef _WIN32
#include <windows.h>
#include <commdlg.h>
#endif

struct DataPoint {
    float x, y;
    bool operator<(const DataPoint& other) const { return x < other.x; }
    bool operator==(const DataPoint& other) const { return x == other.x && y == other.y; }
};

struct AppState {
    std::vector<DataPoint> points;
    float timeScale = 1.0f;
    float amplitude = 50.0f;
    float frequency = 1.0f;
    float sineDensity = 0.02f;
    bool appendWave = false;
    std::string currentLang = "en";
    ImVec2 plotSize;
    ImVec2 plotMin;
    float warningTimer = 0.0f;
    float successTimer = 0.0f;
    std::string lastSavedFile;
    float rdpEpsilon = 0.5f;
    
    // Selection system
    ImVec2 selectionStart;
    ImVec2 selectionEnd;
    bool isSelecting = false;
    std::vector<int> selectedPoints;

    std::map<std::string, std::map<std::string, std::string>> i18n = {
        {"en", {
            {"timeScale", "Time Scale"}, {"generateCode", "Generate Arduino Code"},
            {"resetChart", "Reset Chart"}, {"sineWave", "Sine Wave Generator"},
            {"amplitude", "Amplitude (%)"}, {"frequency", "Frequency (Hz)"},
            {"density", "Wave Density"}, {"appendWave", "Append to last point"},
            {"generateWave", "Generate Sine Wave"}, {"fileGenerated", "File generated: "},
            {"alertPoints", "Create points first!"}, {"memoryWarning", "Too many points for Arduino memory!"},
            {"ok", "OK"}
        }},
        {"zh", {
            {"timeScale", "时间比例"}, {"generateCode", "生成Arduino代码"},
            {"resetChart", "重置图表"}, {"sineWave", "正弦波生成器"},
            {"amplitude", "幅度 (%)"}, {"frequency", "频率 (Hz)"},
            {"density", "波形密度"}, {"appendWave", "追加到最后一点"},
            {"generateWave", "生成正弦波"}, {"fileGenerated", "文件已生成: "},
            {"alertPoints", "请先创建数据点!"}, {"memoryWarning", "点数超过Arduino内存限制!"},
            {"ok", "确定"}
        }},
        {"ko", {
            {"timeScale", "시간 축척"}, {"generateCode", "아두이노 코드 생성"},
            {"resetChart", "차트 리셋"}, {"sineWave", "사인파 생성기"},
            {"amplitude", "진폭 (%)"}, {"frequency", "주파수 (Hz)"},
            {"density", "파동 밀도"}, {"appendWave", "마지막 지점에 추가"},
            {"generateWave", "사인파 생성"}, {"fileGenerated", "파일 생성됨: "},
            {"alertPoints", "먼저 점을 생성해 주세요!"}, {"memoryWarning", "아두이노 메모리 초과 경고!"},
            {"ok", "확인"}
        }}
    };
};

constexpr float POINT_RADIUS = 5.0f;
const ImU32 GRID_COLOR = IM_COL32(61, 61, 61, 255);
const ImU32 LINE_COLOR = IM_COL32(74, 144, 226, 255);
constexpr float PI = 3.14159265358979323846f;
constexpr int ARDUINO_MEMORY_LIMIT = 128;

ImVec2 dataToScreen(const DataPoint& p, const AppState& state) {
    return {
        state.plotMin.x + (p.x / state.timeScale) * state.plotSize.x,
        state.plotMin.y + state.plotSize.y - (p.y / 100.0f) * state.plotSize.y
    };
}

DataPoint screenToData(const ImVec2& screen, const AppState& state) {
    return {
        ((screen.x - state.plotMin.x) / state.plotSize.x) * state.timeScale,
        ((state.plotMin.y + state.plotSize.y - screen.y) / state.plotSize.y) * 100.0f
    };
}

float perpendicularDistance(const DataPoint& p, const DataPoint& a, const DataPoint& b) {
    float dx = b.x - a.x;
    float dy = b.y - a.y;
    if (dx == 0 && dy == 0) return std::sqrt(std::pow(p.x - a.x, 2) + std::pow(p.y - a.y, 2));
    float t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    t = std::max(0.0f, std::min(1.0f, t));
    return std::sqrt(std::pow(p.x - (a.x + t * dx), 2) + std::pow(p.y - (a.y + t * dy), 2));
}

void rdpSimplify(const std::vector<DataPoint>& points, float epsilon, std::vector<DataPoint>& out) {
    if (points.size() < 3) {
        out = points;
        return;
    }

    float maxDist = 0;
    size_t index = 0;
    for (size_t i = 1; i < points.size() - 1; ++i) {
        float d = perpendicularDistance(points[i], points.front(), points.back());
        if (d > maxDist) {
            index = i;
            maxDist = d;
        }
    }

    if (maxDist > epsilon) {
        std::vector<DataPoint> left, right;
        std::vector<DataPoint> leftIn(points.begin(), points.begin() + index + 1);
        std::vector<DataPoint> rightIn(points.begin() + index, points.end());
        rdpSimplify(leftIn, epsilon, left);
        rdpSimplify(rightIn, epsilon, right);
        out = left;
        out.insert(out.end(), right.begin() + 1, right.end());
    } else {
        out = {points.front(), points.back()};
    }
}

void showSaveDialog(std::string& filePath) {
#ifdef _WIN32
    char filename[MAX_PATH] = "";
    OPENFILENAME ofn;
    ZeroMemory(&ofn, sizeof(ofn));
    ofn.lStructSize = sizeof(ofn);
    ofn.hwndOwner = NULL;
    ofn.lpstrFilter = "Arduino Sketch (*.ino)\0*.ino\0All Files (*.*)\0*.*\0";
    ofn.lpstrFile = filename;
    ofn.nMaxFile = MAX_PATH;
    ofn.Flags = OFN_OVERWRITEPROMPT;
    ofn.lpstrDefExt = "ino";

    if (GetSaveFileName(&ofn)) {
        filePath = filename;
    }
#else
    filePath = "output.ino";
#endif
}

void drawGridWithLabels(ImDrawList* draw_list, const AppState& state) {
    for (float x = 0; x <= state.timeScale; x += 0.1f) {
        ImVec2 start = {state.plotMin.x + (x / state.timeScale) * state.plotSize.x, state.plotMin.y};
        ImVec2 end = {start.x, state.plotMin.y + state.plotSize.y};
        draw_list->AddLine(start, end, GRID_COLOR);

        if (x > 0 && x < state.timeScale) {
            ImVec2 labelPos = {start.x - 10, state.plotMin.y + state.plotSize.y + 5};
            draw_list->AddText(labelPos, IM_COL32(255, 255, 255, 255), std::to_string(x).c_str());
        }
    }

    for (int y = 0; y <= 100; y += 10) {
        ImVec2 start = {state.plotMin.x, state.plotMin.y + state.plotSize.y - (y / 100.0f) * state.plotSize.y};
        ImVec2 end = {state.plotMin.x + state.plotSize.x, start.y};
        draw_list->AddLine(start, end, GRID_COLOR);

        if (y > 0 && y < 100) {
            ImVec2 labelPos = {state.plotMin.x - 30, start.y - 5};
            draw_list->AddText(labelPos, IM_COL32(255, 255, 255, 255), (std::to_string(y) + "%").c_str());
        }
    }
}

void drawPlot(AppState& state) {
    ImGui::BeginChild("Plot", ImVec2(-1, 400), true);
    state.plotMin = ImGui::GetCursorScreenPos();
    state.plotSize = ImGui::GetContentRegionAvail();
    ImDrawList* draw_list = ImGui::GetWindowDrawList();

    drawGridWithLabels(draw_list, state);

    if (!state.points.empty()) {
        std::vector<ImVec2> screenPoints;
        for (const auto& p : state.points) {
            screenPoints.push_back(dataToScreen(p, state));
        }
        
        draw_list->AddPolyline(screenPoints.data(), screenPoints.size(), 
                             LINE_COLOR, false, 2.0f);
        
        for (size_t i = 0; i < state.points.size(); ++i) {
            ImVec2 sp = dataToScreen(state.points[i], state);
            bool isSelected = std::find(state.selectedPoints.begin(), 
                                      state.selectedPoints.end(), i) != state.selectedPoints.end();
            ImU32 color = isSelected ? IM_COL32(255, 255, 0, 255) : IM_COL32(255, 68, 68, 255);
            draw_list->AddCircleFilled(sp, POINT_RADIUS, color);
        }
    }

    if (ImGui::IsWindowHovered()) {
        ImVec2 mousePos = ImGui::GetMousePos();
        static int draggedPoint = -1;
        
        // Left click handling
        if (ImGui::IsMouseClicked(ImGuiMouseButton_Left)) {
            float minDist = FLT_MAX;
            for (size_t i = 0; i < state.points.size(); ++i) {
                ImVec2 pointPos = dataToScreen(state.points[i], state);
                float dx = mousePos.x - pointPos.x;
                float dy = mousePos.y - pointPos.y;
                float dist = dx*dx + dy*dy;
                
                if (dist < (POINT_RADIUS*2)*(POINT_RADIUS*2) && dist < minDist) {
                    minDist = dist;
                    draggedPoint = static_cast<int>(i);
                }
            }
            
            if (draggedPoint == -1) {
                DataPoint newPoint = screenToData(mousePos, state);
                newPoint.x = std::clamp(newPoint.x, 0.0f, state.timeScale);
                newPoint.y = std::clamp(newPoint.y, 0.0f, 100.0f);
                
                std::vector<DataPoint> tempPoints = state.points;
                tempPoints.push_back(newPoint);
                std::sort(tempPoints.begin(), tempPoints.end());
                
                std::vector<DataPoint> simplified;
                rdpSimplify(tempPoints, state.rdpEpsilon, simplified);
                
                if (simplified.size() > ARDUINO_MEMORY_LIMIT) {
                    state.warningTimer = 2.0f;
                    return;
                }
                state.points = tempPoints;
            }
        }
        
        if (ImGui::IsMouseDragging(ImGuiMouseButton_Left) && draggedPoint != -1) {
            DataPoint newPoint = screenToData(mousePos, state);
            newPoint.x = std::clamp(newPoint.x, 0.0f, state.timeScale);
            newPoint.y = std::clamp(newPoint.y, 0.0f, 100.0f);
            state.points[draggedPoint] = newPoint;
            std::sort(state.points.begin(), state.points.end());
            auto it = std::find(state.points.begin(), state.points.end(), newPoint);
            draggedPoint = static_cast<int>(std::distance(state.points.begin(), it));
        }
        
        if (ImGui::IsMouseReleased(ImGuiMouseButton_Left)) {
            draggedPoint = -1;
        }
        
        // Right click selection
        if (ImGui::IsMouseClicked(ImGuiMouseButton_Right)) {
            state.isSelecting = true;
            state.selectionStart = mousePos;
            state.selectionEnd = mousePos;
        }
        
        if (state.isSelecting) {
            if (ImGui::IsMouseDragging(ImGuiMouseButton_Right)) {
                state.selectionEnd = mousePos;
            }
            
            if (ImGui::IsMouseReleased(ImGuiMouseButton_Right)) {
                state.isSelecting = false;
                ImVec2 min = ImVec2(
                    std::min(state.selectionStart.x, state.selectionEnd.x),
                    std::min(state.selectionStart.y, state.selectionEnd.y)
                );
                ImVec2 max = ImVec2(
                    std::max(state.selectionStart.x, state.selectionEnd.x),
                    std::max(state.selectionStart.y, state.selectionEnd.y)
                );
                
                state.selectedPoints.clear();
                for (size_t i = 0; i < state.points.size(); ++i) {
                    ImVec2 sp = dataToScreen(state.points[i], state);
                    if (sp.x >= min.x && sp.x <= max.x && sp.y >= min.y && sp.y <= max.y) {
                        state.selectedPoints.push_back(i);
                    }
                }
            }
            
            // Draw selection rectangle
            draw_list->AddRectFilled(state.selectionStart, state.selectionEnd, IM_COL32(255, 255, 255, 30));
            draw_list->AddRect(state.selectionStart, state.selectionEnd, IM_COL32(255, 255, 255, 150), 0.5f);
        }
    }

    ImGui::EndChild();
}

void generateSineWave(AppState& state) {
    float startX = state.appendWave && !state.points.empty() ? 
                  state.points.back().x : 0.0f;
    float duration = state.timeScale - startX;
    
    std::vector<DataPoint> newPoints;
    for (float t = 0; t <= duration; t += state.sineDensity) {
        float x = startX + t;
        float y = 50.0f + state.amplitude * std::sin(2 * PI * state.frequency * t);
        y = std::clamp(y, 0.0f, 100.0f);
        newPoints.push_back({x, y});
    }
    
    std::vector<DataPoint> tempPoints = state.points;
    auto it = std::remove_if(tempPoints.begin(), tempPoints.end(),
        [startX](const DataPoint& p) { return p.x >= startX; });
    tempPoints.erase(it, tempPoints.end());
    tempPoints.insert(tempPoints.end(), newPoints.begin(), newPoints.end());
    std::sort(tempPoints.begin(), tempPoints.end());

    std::vector<DataPoint> simplified;
    rdpSimplify(tempPoints, state.rdpEpsilon, simplified);
    
    if (simplified.size() > ARDUINO_MEMORY_LIMIT) {
        state.warningTimer = 2.0f;
        return;
    }
    
    state.points = tempPoints;
}

void generateCode(AppState& state) {
    if (state.points.empty()) return;

    std::vector<DataPoint> simplifiedPoints;
    rdpSimplify(state.points, state.rdpEpsilon, simplifiedPoints);

    std::string filePath;
    showSaveDialog(filePath);
    if (filePath.empty()) return;

    std::ofstream file(filePath);
    if (file.is_open()) {
        file << "#include <avr/pgmspace.h>\n";
        file << "#include <math.h>\n\n";
        file << "const int NUM_POINTS = " << simplifiedPoints.size() << ";\n\n";
        
        file << "const float timePoints[] PROGMEM = {";
        for (size_t i = 0; i < simplifiedPoints.size(); ++i) {
            file << simplifiedPoints[i].x << (i == simplifiedPoints.size() - 1 ? "" : ", ");
        }
        file << "};\n\n";

        file << "const uint8_t values[] PROGMEM = {";
        for (size_t i = 0; i < simplifiedPoints.size(); ++i) {
            int pwmVal = (int)(simplifiedPoints[i].y * 2.55f);
            pwmVal = std::clamp(pwmVal, 0, 255);
            file << pwmVal << (i == simplifiedPoints.size() - 1 ? "" : ", ");
        }
        file << "};\n\n";

        file << R"(
void setup() {
  pinMode(10, OUTPUT);
  TCCR1A = _BV(COM1A1) | _BV(WGM10);
  TCCR1B = _BV(CS10);
}

float getPointTime(int index) {
  return pgm_read_float(&timePoints[index]);
}

uint8_t getPointValue(int index) {
  return pgm_read_byte(&values[index]);
}

void loop() {
  float totalDuration = getPointTime(NUM_POINTS - 1);
  float currentTime = fmod(millis() / 1000.0, totalDuration);
  float outputValue = 0.0;

  for(int i = 0; i < NUM_POINTS - 1; i++) {
    float t1 = getPointTime(i);
    float t2 = getPointTime(i+1);
    if(currentTime >= t1 && currentTime <= t2) {
      float lerpT = (currentTime - t1) / (t2 - t1);
      outputValue = getPointValue(i) + lerpT * (getPointValue(i+1) - getPointValue(i));
      break;
    }
  }

  analogWrite(10, (int)outputValue);
  delay(10);
}
)";
        file.close();
        state.successTimer = 3.0f;
        state.lastSavedFile = filePath.substr(filePath.find_last_of("/\\") + 1);
    }
}

int main() {
    if (!glfwInit()) return 1;
    
    GLFWwindow* window = glfwCreateWindow(1280, 720, "Motor Curve Generator", NULL, NULL);
    if (!window) {
        glfwTerminate();
        return 1;
    }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();

    ImFontConfig fontConfig;
    fontConfig.MergeMode = false;
    fontConfig.FontDataOwnedByAtlas = false;
    io.Fonts->AddFontFromMemoryTTF((void*)NotoSansMonoCJKsc_Regular_otf, NotoSansMonoCJKsc_Regular_otf_len, 16.0f, &fontConfig, io.Fonts->GetGlyphRangesChineseFull());

    fontConfig.MergeMode = true;
    fontConfig.FontDataOwnedByAtlas = false;
    io.Fonts->AddFontFromMemoryTTF((void*)NotoSansMonoCJKkr_Regular_otf, NotoSansMonoCJKkr_Regular_otf_len, 16.0f, &fontConfig, io.Fonts->GetGlyphRangesKorean());

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 130");

    AppState state;

    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
        
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        if (state.warningTimer > 0.0f) {
            state.warningTimer -= io.DeltaTime;
            ImGui::SetNextWindowPos(ImVec2(io.DisplaySize.x * 0.5f, io.DisplaySize.y * 0.5f), ImGuiCond_Always, ImVec2(0.5f, 0.5f));
            ImGui::SetNextWindowBgAlpha(0.8f);
            if (ImGui::Begin("Warning", nullptr, ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_AlwaysAutoResize)) {
                ImGui::TextColored(ImVec4(1.0f, 0.2f, 0.2f, 1.0f), "%s", state.i18n[state.currentLang]["memoryWarning"].c_str());
                ImGui::End();
            }
        }

        if (state.successTimer > 0.0f) {
            state.successTimer -= io.DeltaTime;
            ImGui::SetNextWindowPos(ImVec2(io.DisplaySize.x * 0.5f, io.DisplaySize.y * 0.5f), ImGuiCond_Always, ImVec2(0.5f, 0.5f));
            ImGui::SetNextWindowBgAlpha(0.8f);
            if (ImGui::Begin("Success", nullptr, ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_AlwaysAutoResize)) {
                ImGui::TextColored(ImVec4(0.2f, 1.0f, 0.2f, 1.0f), "%s %s", 
                    state.i18n[state.currentLang]["fileGenerated"].c_str(), state.lastSavedFile.c_str());
                ImGui::End();
            }
        }

        if (ImGui::IsKeyPressed(ImGuiKey_Delete)) {
            if (!state.selectedPoints.empty()) {
                std::sort(state.selectedPoints.begin(), state.selectedPoints.end(), std::greater<int>());
                for (int idx : state.selectedPoints) {
                    if (idx >= 0 && idx < static_cast<int>(state.points.size())) {
                        state.points.erase(state.points.begin() + idx);
                    }
                }
                state.selectedPoints.clear();
            }
        }

        ImGui::SetNextWindowPos(ImVec2(0, 0));
        ImGui::SetNextWindowSize(io.DisplaySize);
        ImGui::Begin("Main", nullptr, 
            ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoResize);

        ImGui::SetNextItemWidth(150);
        if (ImGui::BeginCombo("Language", state.currentLang.c_str())) {
            if (ImGui::Selectable("English", state.currentLang == "en")) 
                state.currentLang = "en";
            if (ImGui::Selectable("中文", state.currentLang == "zh")) 
                state.currentLang = "zh";
            if (ImGui::Selectable("한국어", state.currentLang == "ko")) 
                state.currentLang = "ko";
            ImGui::EndCombo();
        }

        drawPlot(state);

        std::vector<DataPoint> simplified;
        rdpSimplify(state.points, state.rdpEpsilon, simplified);
        ImGui::Text("Points: %zu (Simplified: %zu / %d)", 
            state.points.size(), simplified.size(), ARDUINO_MEMORY_LIMIT);

        ImGui::SliderFloat(state.i18n[state.currentLang]["timeScale"].c_str(), 
            &state.timeScale, 0.1f, 10.0f, "%.1fx");
        
        ImGui::Separator();
        ImGui::Text("%s", state.i18n[state.currentLang]["sineWave"].c_str());
        ImGui::SliderFloat(state.i18n[state.currentLang]["amplitude"].c_str(), 
            &state.amplitude, 0.0f, 50.0f, "%.1f%%");
        ImGui::SliderFloat(state.i18n[state.currentLang]["frequency"].c_str(), 
            &state.frequency, 0.1f, 10.0f, "%.1f Hz");
        ImGui::SliderFloat(state.i18n[state.currentLang]["density"].c_str(), 
            &state.sineDensity, 0.005f, 0.1f, "%.3f", ImGuiSliderFlags_Logarithmic);
        ImGui::SliderFloat("Optimization", &state.rdpEpsilon, 0.0f, 2.0f, "%.2f");
        ImGui::Checkbox(state.i18n[state.currentLang]["appendWave"].c_str(), &state.appendWave);
        if (ImGui::Button(state.i18n[state.currentLang]["generateWave"].c_str())) {
            generateSineWave(state);
        }
        
        ImGui::Separator();
        if (ImGui::Button(state.i18n[state.currentLang]["resetChart"].c_str())) {
            state.points.clear();
            state.selectedPoints.clear();
        }
        
        ImGui::SameLine();
        if (ImGui::Button(state.i18n[state.currentLang]["generateCode"].c_str())) {
            generateCode(state);
        }

        ImGui::End();

        ImGui::Render();
        int display_w, display_h;
        glfwGetFramebufferSize(window, &display_w, &display_h);
        glViewport(0, 0, display_w, display_h);
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
        glfwSwapBuffers(window);
    }

    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();
    glfwTerminate();
    return 0;
}