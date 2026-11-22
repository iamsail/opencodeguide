#!/usr/bin/env bash

# Enable the repository hooks: pre-push network policy + pre-commit secret guard.
# Only the local Git configuration of this repository is modified.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
hooks_relative_path=".githooks"

if [[ ! -d "${repo_root}/.git" ]]; then
  echo "Error: .git directory not found under ${repo_root}" >&2
  exit 1
fi

for hook in pre-push pre-commit; do
  if [[ ! -f "${repo_root}/${hooks_relative_path}/${hook}" ]]; then
    echo "Error: ${hooks_relative_path}/${hook} not found under ${repo_root}" >&2
    exit 1
  fi
  chmod +x "${repo_root}/${hooks_relative_path}/${hook}"
done
git -C "${repo_root}" config --local core.hooksPath "${hooks_relative_path}"

echo "Configured local core.hooksPath to ${hooks_relative_path} (relative to the repository root)."
echo "This change applies only to the current repository, not to the global Git configuration."
echo "Active hooks: pre-push (network policy), pre-commit (secret guard)."
