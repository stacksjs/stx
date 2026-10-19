#!/usr/bin/env bash
# pantry publish, finishing a publish npm has accepted but not yet shown.
#
# npm can take several minutes to make an accepted upload readable. pantry waits
# about two minutes, then reports "Upload accepted; publication is pending
# public metadata and verified tarball availability" and exits 1, which skipped
# every later stage of the Releaser: v0.2.575 and v0.2.576 each stopped with
# @stacksjs/stx (or @stacksjs/components) accepted but unread, and needed
# `gh run rerun --failed` by hand once npm caught up.
#
# This verifies each pending package's metadata and original archive, then runs the
# same publish again, which skips everything already published. It never
# re-uploads a pending version early: that is npm's
# `409 Cannot publish over previously staged version`.
#
# Usage: scripts/publish-npm.sh <pantry publish arguments...>
set -uo pipefail
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

attempts=${PUBLISH_ATTEMPTS:-4}
wait_seconds=${PUBLISH_VISIBLE_WAIT_SECONDS:-1200}

for attempt in $(seq 1 "$attempts"); do
  log=$(mktemp)
  pantry publish "$@" 2>&1 | tee "$log"
  status=${PIPESTATUS[0]}
  if [ "$status" -eq 0 ]; then
    rm -f "$log"
    exit 0
  fi

  if [ "$attempt" -eq "$attempts" ]; then
    rm -f "$log"
    break
  fi

  # Public metadata and complete bytes must match the ORIGINAL accepted SRI.
  # A tarball-only 200 cannot establish the version exists before a safe retry.
  if ! (cd "$script_dir" && bun npm-publication.ts "$log" "$wait_seconds"); then
    rm -f "$log"
    echo "::error::Original accepted publication is not verified; no publish resumed"
    exit "$status"
  fi
  rm -f "$log"
  echo "Publishing again: what is already out is skipped (attempt $((attempt + 1)) of ${attempts})"
done

echo "::error::pantry publish still failing after ${attempts} attempts"
exit 1
