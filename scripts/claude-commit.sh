#!/bin/bash

# This script now calls the global claude-commit command
# The global version is located at ~/.local/bin/claude-commit
# Or can be installed from docs/tools/claude-commit/setup.sh

if command -v claude-commit >/dev/null 2>&1; then
    exec claude-commit "$@"
elif [ -x "$HOME/.local/bin/claude-commit" ]; then
    exec "$HOME/.local/bin/claude-commit" "$@"
else
    echo "claude-commit not found. Please run:"
    echo "  ./docs/tools/claude-commit/setup.sh"
    exit 1
fi