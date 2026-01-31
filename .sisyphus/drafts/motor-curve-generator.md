# Draft: motor_curve_generator — CI, cross-build, and docs

## Requirements (confirmed)
- User wants GitHub Actions workflow to build for Linux and Windows (cross-compile from Linux).
- Separate build directories: `build-linux`, `build-win`.
- Automated release upload on tag push.
- Two README files: `README.md` (English) and `README_kr.md` (Korean).
- Project: C++ with ImGui and GLFW. Target name: `motor_curve_generator`.
- `windows_toolchain.cmake` exists in repo.
- CMake currently uses FetchContent for GLFW and ImGui.
- Windows static linking is a priority (static libgcc, libstdc++, pthreads).

## Technical Decisions (tentative)
- Cross-compile on ubuntu-latest using mingw-w64 toolchain and provided `windows_toolchain.cmake`.
- GitHub Actions will run two jobs/waves: linux-native build, linux->windows cross-compile.
- Artifacts: `motor_curve_generator-linux.tar.gz` (linux) and `motor_curve_generator-win.zip` (windows).

## Research Findings
- (pending: explore/librarian agents launched to inspect repo and gather best-practice examples)

## Research Findings (explore agent)
- Root CMakeLists: /home/choiharam/works/appdev/motor-curve-control/CMakeLists.txt — defines the motor_curve_generator executable target.
- Toolchain file: /home/choiharam/works/appdev/motor-curve-control/windows_toolchain.cmake — present and intended for MinGW cross-compilation.
- No existing GitHub Actions workflows detected under .github/workflows/.
- No separate packaging scripts (release.sh) or CPack configs found at repo root.
- No README files found at repo root.
- No explicit tests or test targets detected in CMake.

## Open Questions (updated after repository scan)
- Is the windows_toolchain.cmake already tuned for mingw-w64 on ubuntu-latest CI, or does it need modifications?
- Confirm target Windows architecture(s) (x86_64 vs i686).
- Confirm build types to produce (Release only vs additional configs).
- Confirm tag pattern for automated releases (default: v*).
- Confirm artifact formats and checksum policy.

## User Decisions (from latest reply)
- Windows architecture: x86_64
- Build types: Release only
- Release tag pattern: v* (e.g., v1.2.3)
- Artifact formats and checksums: Windows=zip, Linux=tar.gz, sha256 attached
- Windows static link scope: Full static (CRT + libstdc++ + libgcc + winpthread)
- CMake change approach: Add option DBUILD_STATIC_WIN=ON (default OFF)
- CI tests: No automated test execution in CI (build/packaging + smoke verification only)
- Release additional files: LICENSE + README included

## Current Issues to Fix (reported by user)
1. Arduino memory warning triggers incorrectly — likely because code checks raw points instead of simplified/sampled points.
2. 'double free or corruption' on app exit — likely due to ImGui/GLFW/Font cleanup order or resource double-free.

## Immediate Goal (user priority)
1. Fix the two bugs in main.cpp (Arduino memory warning false-positive; double free on exit).
2. Finalize the parallel task graph for GitHub Actions and multilingual READMEs.
3. Deliver code fixes first, then proceed with CI/workflow and README generation.

## Next Steps Suggested
- Inspect src/main.cpp to identify where raw points vs simplified points are checked and where cleanup/destruction of ImGui/GLFW/Font resources happens.
- Create targeted tasks for each bug: reproduce locally, write minimal regression test or reproduce script, implement fix, verify with local run and sanitizers where applicable.
- Decide whether to enable AddressSanitizer/UBSan in CI or as local verification for detecting double-free; user decision required.


## Open Questions
- Which Windows architecture(s) to target? (`x86_64`/`i686`/both)
- Is `windows_toolchain.cmake` already configured for mingw-w64 cross-compilation on ubuntu CI? If not, what is its content/expected variables?
- Should CI produce Release builds only, or also Debug/RelWithDebInfo variants?
- Packaging format preferences? (zip/tar.gz) — default proposed: zip for windows, tar.gz for linux.
- Tag naming convention for release trigger (e.g., `v*`, `release/*`)?
- Do you want signed artifacts or checksums (sha256) attached to the release?
- Are there any extra files to include in the release (LICENSE, docs, sample data)?
- Do you want to run unit tests in CI (if tests exist) or only build verification?
- Should the Windows build be fully static (no DLL dependencies) — note: static linking of pthreads/stdc++ sometimes needs specific mingw-w64 packages and flags.

## Scope Boundaries
INCLUDE:
- CMake changes required to support static linking for MinGW (link flags, static build options, separate build dirs).
- A GitHub Actions workflow `.github/workflows/release.yml` that builds Linux and cross-compiles Windows from Linux, packages artifacts, and uploads a release on tag push.
- Drafts for `README.md` (English) and `README_kr.md` (Korean) covering features, build instructions (Linux native and cross-compile on CI), and packaging.
- Final verification steps to check artifacts exist and basic smoke-run (where feasible).

EXCLUDE:
- Any source code changes unrelated to build (feature work).
- Creating or modifying secrets in the GitHub repository (user to configure tokens if needed).

## Notes
- I'll inspect the repo to find current CMakeLists, `windows_toolchain.cmake`, and any existing CI workflows to ground the plan.
