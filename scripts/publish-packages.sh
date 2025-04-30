#!/bin/bash

# Exit on error
set -e

echo "Publishing all packages..."

for dir in packages/*/ ; do
  if [ -d "$dir" ]; then
    package_name=$(basename "$dir")

    echo "----------------------------------------"
    echo "Publishing $package_name..."

    # Check if package is private
    is_private=$(grep -c '"private": true' "$dir/package.json" || echo "0")

    if [ "$is_private" != "0" ]; then
      echo "Skipping $package_name (private package)"
    else
      cd "$dir"
      bun publish --access public
      cd - > /dev/null  # Suppress the directory change message
    fi

    echo "----------------------------------------"
  fi
done

echo "All packages published successfully!"