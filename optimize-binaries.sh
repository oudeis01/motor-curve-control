#!/bin/bash
# Strip debug symbols
find . -name "*.node" -exec strip --strip-debug {} \;

# Compress binaries with UPX
upx --best --lzma \
  ./node_modules/@paulcbetts/system-idle-time/build/Release/system_idle_time.node \
  ./node_modules/sqlite3/lib/binding/**/*.node