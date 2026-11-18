#!/usr/bin/env bash

# Enable the repository's pre-push network policy check.
# Only the local Git configuration of this repository is modified.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
hooks_relative_path=".githooks"

if [[ ! -d "${repo_root}/.git" ]]; then
  echo "Error: .git directory not found under ${repo_root}" >&2
  exit 1
fi

if [[ ! -f "${repo_root}/${hooks_relative_path}/pre-push" ]]; then
  echo "Error: ${hooks_relative_path}/pre-push not found under ${repo_root}" >&2
  exit 1
fi

chmod +x "${repo_root}/${hooks_relative_path}/pre-push"
git -C "${repo_root}" config --local core.hooksPath "${hooks_relative_path}"

echo "Configured local core.hooksPath to ${hooks_relative_path} (relative to the repository root)."
echo "This change applies only to the current repository, not to the global Git configuration."
echo "The pre-push network policy check is now active."
