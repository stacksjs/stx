#!/bin/bash

for dir in packages/*/; do
  # skip collections
  [[ "$dir" == packages/collections/ ]] && continue

  pkg="$dir/package.json"
  [ -f "$pkg" ] || continue

  name=$(grep -o '"name": *"[^"]*"' "$pkg" | head -1 | sed 's/"name": *"//;s/"//')
  private=$(grep -o '"private": *true' "$pkg")

  if [ -n "$private" ]; then
    echo "Skipping $name (private)"
    continue
  fi

  echo "Publishing $name..."
  (cd "$dir" && npm publish --access public) || echo "Failed to publish $name"
done
