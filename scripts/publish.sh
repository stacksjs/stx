#!/bin/bash

# Exit on error
set -e

# Enable debug if needed
# set -x

echo "Publishing all packages..."

# Function to publish a package
publish_package() {
  local dir=$1
  local package_name=$(basename "$dir")
  local package_json="$dir/package.json"

  # Skip if package.json doesn't exist
  if [ ! -f "$package_json" ]; then
    echo "Skipping $package_name (no package.json found)"
    return
  fi

  echo "----------------------------------------"
  echo "Processing $package_name..."

  # Check if package is private using Bun
  if command -v bun >/dev/null 2>&1; then
    is_private=$(bun --eval "try { const pkg = JSON.parse(require('fs').readFileSync('$package_json', 'utf8')); console.log(pkg.private === true ? 'true' : 'false'); } catch(e) { console.log('false'); }")
  # Then try jq as a fallback
  elif command -v jq >/dev/null 2>&1; then
    is_private=$(jq -r '.private // false' "$package_json")
  # Finally fall back to grep
  else
    private_check=$(grep -E '"private":\s*true' "$package_json" || echo "")
    if [ -n "$private_check" ]; then
      is_private="true"
    else
      is_private="false"
    fi
  fi

  echo "Package $package_name private status: $is_private"

  if [ "$is_private" = "true" ]; then
    echo "Skipping $package_name (private package)"
  else
    echo "Publishing $package_name..."
    cd "$dir"
    bun publish --access public
    cd - > /dev/null  # Suppress the directory change message
  fi

  echo "----------------------------------------"
}

# Process top-level packages
for dir in packages/*/ ; do
  if [ -d "$dir" ]; then
    package_name=$(basename "$dir")

    # Special handling for collections directory
    if [ "$package_name" = "collections" ]; then
      echo "Processing collections subdirectories..."
      # Process each iconify package inside collections
      for collection_dir in "$dir"*/ ; do
        if [ -d "$collection_dir" ]; then
          publish_package "$collection_dir"
        fi
      done
    else
      # Regular package
      publish_package "$dir"
    fi
  fi
done

echo "All packages published successfully!"