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

# Define publish order - dependencies first
PUBLISH_ORDER=(
  "iconify-core"      # Must be published before iconify collections
  "sanitizer"
  "markdown"
  "stx"
  "bun-plugin"
  "devtools"
  "iconify-generator"
  "benchmarks"
  # "vscode"          # VSCode extension - needs separate marketplace release process
)

# First, publish packages in the defined order
for package_name in "${PUBLISH_ORDER[@]}"; do
  dir="packages/$package_name/"
  if [ -d "$dir" ]; then
    publish_package "$dir"
  fi
done

# Publish iconify collections with workspace dependency resolution
if [ -d "packages/collections" ]; then
  echo "========================================="
  echo "Publishing Iconify Collections..."
  echo "========================================="

  # Get the current version of iconify-core
  if command -v bun >/dev/null 2>&1; then
    ICONIFY_CORE_VERSION=$(bun --eval "console.log(require('./packages/iconify-core/package.json').version)")
  elif command -v node >/dev/null 2>&1; then
    ICONIFY_CORE_VERSION=$(node -p "require('./packages/iconify-core/package.json').version")
  else
    echo "Error: Neither bun nor node found to read iconify-core version"
    exit 1
  fi

  if [ -z "$ICONIFY_CORE_VERSION" ]; then
    echo "Error: Could not determine iconify-core version"
    exit 1
  fi

  echo "Using @stacksjs/iconify-core version: $ICONIFY_CORE_VERSION"
  echo ""

  # Counter for published packages
  published_count=0

  for collection_dir in packages/collections/*/ ; do
    if [ -d "$collection_dir" ]; then
      # Remove trailing slash to avoid double slashes
      collection_dir="${collection_dir%/}"
      package_name=$(basename "$collection_dir")
      package_json="$collection_dir/package.json"
      package_json_backup="$collection_dir/package.json.backup"

      if [ ! -f "$package_json" ]; then
        continue
      fi

      # Check if package is private
      if command -v bun >/dev/null 2>&1; then
        is_private=$(bun --eval "try { const pkg = JSON.parse(require('fs').readFileSync('$package_json', 'utf8')); console.log(pkg.private === true ? 'true' : 'false'); } catch(e) { console.log('false'); }")
      else
        is_private="false"
      fi

      if [ "$is_private" = "true" ]; then
        continue
      fi

      echo "----------------------------------------"
      echo "Processing $package_name..."
      echo "Package $package_name private status: $is_private"

      # Create a backup of package.json
      cp "$package_json" "$package_json_backup"

      # Replace workspace:* with actual version
      if command -v jq >/dev/null 2>&1; then
        jq ".dependencies.\"@stacksjs/iconify-core\" = \"^$ICONIFY_CORE_VERSION\"" "$package_json_backup" > "$package_json.tmp"
        mv "$package_json.tmp" "$package_json"
      else
        # Fallback to bun/node for JSON manipulation
        if command -v bun >/dev/null 2>&1; then
          bun --eval "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('$package_json_backup', 'utf8')); pkg.dependencies['@stacksjs/iconify-core'] = '^$ICONIFY_CORE_VERSION'; fs.writeFileSync('$package_json', JSON.stringify(pkg, null, 2));"
        else
          node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('$package_json_backup', 'utf8')); pkg.dependencies['@stacksjs/iconify-core'] = '^$ICONIFY_CORE_VERSION'; fs.writeFileSync('$package_json', JSON.stringify(pkg, null, 2));"
        fi
      fi

      echo "Publishing $package_name..."
      # Publish from the root directory to maintain authentication
      if bun publish --cwd "$collection_dir" --access public; then
        echo "✅ Published $package_name"
        published_count=$((published_count + 1))
      else
        echo "❌ Failed to publish $package_name"
        # Restore original package.json on failure if backup exists
        if [ -f "$package_json_backup" ]; then
          mv "$package_json_backup" "$package_json"
        fi
        echo "----------------------------------------"
        continue
      fi

      # Restore original package.json after successful publish
      if [ -f "$package_json_backup" ]; then
        mv "$package_json_backup" "$package_json"
      fi

      echo "----------------------------------------"
    fi
  done

  echo ""
  echo "========================================="
  echo "Collections Summary: Published $published_count packages"
  echo "========================================="
  echo ""
fi

echo "All packages published successfully!"