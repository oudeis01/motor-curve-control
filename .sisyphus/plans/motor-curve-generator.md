# Plan: motor_curve_generator — CI, cross-build, bugfixes, and docs

TL;DR

Quick summary:
- Fix two bugs in main.cpp (Arduino memory warning false-positive; crash on exit double-free).
- Add GitHub Actions release workflow that builds Release artifacts for Linux (native) and Windows (cross-compile from Linux using windows_toolchain.cmake), creates .tar.gz/.zip artifacts, generates sha256 checksums, and uploads a GitHub Release on tag v*.
- Update CMakeLists to support separate build dirs (build-linux, build-win) and an option DBUILD_STATIC_WIN to enable full static linking on Windows (libgcc, libstdc++, winpthread).
- Add multilingual documentation: README.md (English) and README_kr.md (Korean).

Estimated Effort: Short → Medium (mostly small code fixes + CI config + docs)

Critical Path: Fix main.cpp bugs → Add CI workflow + CMake adjustments → Draft READMEs → Final verification

Parallel Execution: Yes — bugfix tasks should be done first (critical path). CMake refactor, workflow, and READMEs can be worked in parallel after bugfix branch is created.

---

Context

Original Request:
- Build CI for Linux and Windows (cross-compile), separate build dirs, automated release on tag push, two README files.

Interview Summary:
- Repo: C++/ImGui/GLFW project. Root CMakeLists defines target motor_curve_generator. windows_toolchain.cmake exists.
- No existing GitHub workflows or READMEs.
- User prioritized two runtime bugs to fix before CI rollout.

Decisions Made (user confirmed):
- Windows architecture: x86_64 only
- Build type: Release only
- Tag pattern: v*
- Artifacts: Windows → .zip, Linux → .tar.gz; attach sha256 for both
- Windows static linking: Full static linking (libgcc, libstdc++, pthreads)
- CMake change: Add option DBUILD_STATIC_WIN=ON (default OFF)
- CI tests: No unit tests to run; CI will perform build + smoke verification where feasible
- Release includes: LICENSE + README files

Metis Review: (auto-resolved items)
- No pre-existing workflows — baseline created from scratch
- windows_toolchain.cmake found — will be referenced by workflow

Auto-Resolved / Defaults Applied
- Defaulted to x86_64 only, Release-only, v* tag, zip/tar.gz formats, DBUILD_STATIC_WIN option.

Decisions Needed: NONE (user finalized choices)

---

Work Objectives

Core Objective:
Deliver a safe, reproducible CI that builds Release artifacts for Linux and cross-compiled Windows (static), create release packages on tag pushes, and provide clear English/Korean documentation — but only after first fixing the two functional bugs in main.cpp.

Concrete Deliverables:
- Patch to main.cpp fixing the memory warning and exit crash
- .github/workflows/release.yml
- CMakeLists.txt updates with DBUILD_STATIC_WIN and separate build dir guidance
- README.md (English) and README_kr.md (Korean)
- Verification checklist and artifacts (sha256 checksums)

Definition of Done
- [ ] main.cpp fixes applied and validated locally (no false Arduino warnings; no double-free at exit)
- [ ] CI workflow added and builds both Linux and Windows artifacts on tag push (v*)
- [ ] Artifacts packaged and checksums attached to release
- [ ] README.md and README_kr.md added
- [ ] Plan saved here and ready for /start-work

Must Have
- Fixes to main.cpp must be done before CI is considered complete
- Windows build must be statically linked when DBUILD_STATIC_WIN=ON

Must NOT Have (Guardrails)
- Do not change runtime behavior beyond fixing the specific bugs
- Do not add heavy-weight unit-test frameworks in this plan (out of scope)

---

Verification Strategy

Test Decision:
- Infrastructure exists: CMake-based build. No test infra found.
- User wants tests: NO — will perform smoke verification only.

Verification Approach:
- Each TODO includes an automated verification step where possible (build commands and artifact checks). For runtime bugs, manual/ASan verification steps are included and executable by the developer.

---

Execution Strategy (Parallel Waves)

Wave 1 (Must complete first — Critical path)
- Task A: Bugfixes in main.cpp (bugfix-1, bugfix-2)
  - Update click handler and generateSineWave to use rdpSimplify on the predicted dataset before setting warningTimer.
  - Set fontConfig.FontDataOwnedByAtlas = false for embedded fonts before AddFontFromMemoryTTF calls.
  - Verify locally: build Release, run app, reproduce previous scenarios and confirm fixes.

Wave 2 (After Wave 1 begins; parallelizable tasks)
- Task B: CMake refactor (task-cmake-refactor)
  - Add option DBUILD_STATIC_WIN (default OFF).
  - Add recommended CMAKE_BINARY_DIR patterns for build-linux and build-win in README and CI.
  - When DBUILD_STATIC_WIN=ON, add proper set(CMAKE_EXE_LINKER_FLAGS "-static -static-libgcc -static-libstdc++ -Wl,-Bstatic -lpthread -Wl,-Bdynamic") or platform-appropriate flags and toolchain handling; ensure windows_toolchain.cmake is used by CI for cross-compilation.

- Task C: GitHub Actions workflow (task-github-workflow)
  - release.yml with two jobs on push:tags matching v*.
    - job: build-linux (runs on ubuntu-latest) — configure, build (Release), package tar.gz, compute sha256, upload artifact; create release and attach.
    - job: build-win (runs on ubuntu-latest) — install mingw-w64, run cmake -DCMAKE_TOOLCHAIN_FILE=windows_toolchain.cmake -DBUILD_STATIC_WIN=ON -B build-win -S . -DCMAKE_BUILD_TYPE=Release; run cmake --build build-win --config Release -- -j; package zip, compute sha256, upload.
  - Use actions/checkout, actions/cache (for apt cache if needed), actions/upload-artifact, and actions/create-release & actions/upload-release-asset (requires GITHUB_TOKEN, auto provided).

- Task D: Documentation (task-readme-en, task-readme-kr)
  - Draft README.md with build instructions (native Linux build, cross-compile Windows via CI, options, packaging, where to find artifacts), features, and troubleshooting (fonts, linking issues). Include commands for building locally in both environments.
  - Translate to Korean README_kr.md.

Wave 3 (Finalization)
- Task E: Final verification (task-final-verification)
  - Validate CI by creating a release tag (test tag like v0.0.0-test) on a test branch (or user-provided fork) and ensure both jobs run, artifacts created, and checksums attached.
  - Smoke verify Linux binary runs and Windows binary runs under Wine or test via static analysis (optional).
  - Package contents: LICENSE, README(s), binary, and supporting files.

Dependency Matrix

| Task | Depends On | Blocks |
| Bugfixes | None | CMake refactor review, workflow tests |
| CMake refactor | Bugfixes done (branch) | Workflow (needs CMake to build Win) |
| Workflow | CMake refactor & windows_toolchain.cmake | Final verification |
| README drafts | Bugfixes started | None |
| Final verification | Workflow implemented & artifacts created | Delivery |

Agent Dispatch Summary (Recommended profiles)

- Bugfix tasks (bugfix-1, bugfix-2)
  - Category: quick
  - Skills: git-master, unspecified-high (diagnostics), ultrabrain (if ASan required)

- CMake refactor (task-cmake-refactor)
  - Category: ultrabrain
  - Skills: git-master, build-system, unspecified-high (cmake), devops

- GitHub workflow (task-github-workflow)
  - Category: ultrabrain
  - Skills: devops, quick (for scripting), git-master

- README drafts
  - Category: writing
  - Skills: writing

- Final verification
  - Category: quick
  - Skills: devops, playwright (if UI smoke test automation desired), interactive_bash (for CLI verification)

---

TODOs (Detailed)

- [ ] bugfix-1: Fix Memory Warning in main.cpp

  What to do:
  - Replace direct point-count-based checks with checks using rdpSimplify on the predicted merged vector.
    - Mouse-add handler: when adding one point, create a temp vector tmp = state.points; insert newPoint (or replace tail); call rdpSimplify(tmp, state.rdpEpsilon, simplified); if simplified.size() > ARDUINO_MEMORY_LIMIT then set warningTimer and do not insert.
    - generateSineWave: before inserting newPoints, construct tmp = existing points after removing overwritten tail (same algorithm as current), append newPoints, call rdpSimplify(tmp,...), and only commit if simplified.size() <= ARDUINO_MEMORY_LIMIT.

  Must NOT do:
  - Do not change ARDUINO_MEMORY_LIMIT behavior nor change simplification epsilon default.

  Recommended Agent Profile:
  - Category: quick
  - Skills: ["git-master", "unspecified-high"]

  Parallelization: Can start immediately (Wave 1). Blocks: CMake refactor review & workflow tests.

  References:
  - src/main.cpp: functions rdpSimplify, generateSineWave, mouse-add handler (lines near points insertion)

  Acceptance Criteria (Agent-Executable):
  - [ ] Build project (Release) locally: cmake -S . -B build-linux -DCMAKE_BUILD_TYPE=Release && cmake --build build-linux -- -j
  - [ ] Run application and perform: add points that earlier triggered warning but after simplification are within limit → No warning must appear.
  - [ ] generateSineWave test: generate a wave that previously triggered warning, ensure it now respects simplified count.

- [ ] bugfix-2: Fix Crash on Exit (double-free) in main.cpp

  What to do:
  - When configuring ImFontConfig prior to AddFontFromMemoryTTF, set fontConfig.FontDataOwnedByAtlas = false; (explicit) for both embedded fonts. Ensure MergeMode handled properly.
  - Ensure no manual frees are performed for font_data arrays (they are static embedded arrays).
  - Keep destructor sequence: ImGui_ImplOpenGL3_Shutdown(); ImGui_ImplGlfw_Shutdown(); ImGui::DestroyContext(); glfwTerminate(); — verify not called twice.

  Must NOT do:
  - Do not change font embedding approach (unless necessary). Do not call free() on embedded arrays.

  Recommended Agent Profile:
  - Category: quick
  - Skills: ["git-master", "unspecified-high"]

  Acceptance Criteria:
  - [ ] Build and run Release binary; normal exit should not crash.
  - [ ] (Optional, recommended) Build with ASan and verify no double-free reported.

- [ ] task-cmake-refactor: Update CMakeLists to support Windows static linking and build dirs

  What to do:
  - Add option(DBUILD_STATIC_WIN "Enable static link for Windows builds" OFF)
  - Add guidance in CMake for handling windows static flags when DBUILD_STATIC_WIN is ON. Use windows_toolchain.cmake in CI by setting -DCMAKE_TOOLCHAIN_FILE=windows_toolchain.cmake.
  - Ensure FetchContent for ImGui/GLFW remains and that for Windows static builds the appropriate STATIC linkage is applied where necessary.
  - Document build directories (build-linux, build-win) and typical commands in README.

  Must NOT do:
  - Do not introduce non-portable, distro-specific hardcoding; keep flags under option guard.

  Recommended Agent Profile:
  - Category: ultrabrain
  - Skills: ["git-master", "unspecified-high"]

  Acceptance Criteria:
  - [ ] cmake -S . -B build-linux -DCMAKE_BUILD_TYPE=Release builds on linux
  - [ ] cmake -S . -B build-win -DCMAKE_TOOLCHAIN_FILE=windows_toolchain.cmake -DBUILD_STATIC_WIN=ON -DCMAKE_BUILD_TYPE=Release configures successfully on ubuntu CI with mingw installed

- [ ] task-github-workflow: Create .github/workflows/release.yml

  What to do:
  - Build triggers: push tags matching v*.
  - Two jobs: build-linux and build-win (both run on ubuntu-latest), build-win uses windows_toolchain.cmake and installs mingw-w64 packages via apt.
  - Packaging: build-linux → tar.gz; build-win → zip. Compute sha256sum and attach to release.
  - Release creation: Use actions/create-release with tag name and upload assets.

  Must NOT do:
  - Do not embed secrets; rely on GITHUB_TOKEN.

  Recommended Agent Profile:
  - Category: ultrabrain
  - Skills: ["devops", "git-master"]

  Acceptance Criteria:
  - [ ] On push tag vX.Y.Z, GitHub Actions runs both jobs and release is created with both artifacts + sha256 files attached.

- [ ] task-readme-en: Draft README.md (English)

  What to do:
  - Explain project purpose, features, prerequisites, build steps for Linux and cross-compile instruction referencing windows_toolchain.cmake, CI usage, release artifact expectations, troubleshooting (fonts, static link caveats), license.

  Recommended Agent Profile:
  - Category: writing
  - Skills: ["writing"]

  Acceptance Criteria:
  - [ ] README.md present at repo root with sections: Overview, Requirements, Build (Linux), Cross-compile (Windows via CI), Release, Troubleshooting, License.

- [ ] task-readme-kr: Draft README_kr.md (Korean)

  What to do:
  - Korean translation of README.md; include same commands and sections.

  Recommended Agent Profile:
  - Category: writing
  - Skills: ["writing"]

  Acceptance Criteria:
  - [ ] README_kr.md present with equivalent content in Korean.

- [ ] task-final-verification: Final verification and delivery

  What to do:
  - Create a test tag (e.g. v0.0.0-test) in a fork or test branch to exercise GitHub Actions; verify both artifacts are created and attached to the release.
  - Download artifacts and verify checksums match.
  - Run Linux artifact and, if possible, run Windows artifact under Wine to smoke test. If not possible, verify static linking via ldd or objdump to ensure no dynamic stdc++ dependencies.

  Acceptance Criteria:
  - [ ] Release contains motor_curve_generator-linux.tar.gz and motor_curve_generator-win.zip and corresponding sha256 files.
  - [ ] Checksums match locally computed values.
  - [ ] Smoke run successful or clear verification evidence exists (e.g., file outputs, ldd shows static linking).

Commit Strategy

- Create a bugfix branch: fix/main-bugfixes
  - Commit 1: main.cpp fixes for memory warning (detailed commit message explaining rdpSimplify change)
  - Commit 2: main.cpp fix for FontDataOwnedByAtlas flag
  - Commit 3: CMake changes (DBUILD_STATIC_WIN option)
  - Commit 4: Add .github/workflows/release.yml
  - Commit 5: README.md + README_kr.md

Commit message guidance:
- Use conventional messages: fix(main): address incorrect Arduino memory warning; fix(main): prevent double free by adjusting font ownership; feat(ci): add release workflow for linux/windows; chore(docs): add README and README_kr

Success Criteria

- All verification commands listed in acceptance criteria succeed.
- PR created with clear description, testing steps, and links to artifacts.

Handoff

Plan saved to: .sisyphus/plans/motor-curve-generator.md
Draft saved to: .sisyphus/drafts/motor-curve-generator.md (will be deleted after /start-work completes)

To start execution, run: /start-work
