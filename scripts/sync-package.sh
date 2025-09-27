#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <repo-name> <target-dir>" >&2
  exit 1
fi

repo="$1"
target_dir="$2"
remote="https://github.com/ahoff-git/${repo}.git"

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

if [ -n "${GITHUB_TOKEN:-}" ]; then
  auth_remote="https://${GITHUB_TOKEN}@github.com/ahoff-git/${repo}.git"
else
  auth_remote="$remote"
fi

echo "Syncing ${repo} into ${target_dir}" >&2

if ! git clone --depth=1 "$auth_remote" "$workdir/src"; then
  echo "Failed to clone ${remote}. Ensure you have access and, for private repositories, set GITHUB_TOKEN." >&2
  exit 1
fi

mkdir -p "$target_dir"
rsync -a --delete --exclude '.git' "$workdir/src/" "$target_dir/"
