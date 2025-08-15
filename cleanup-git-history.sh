#!/bin/bash

# Git history cleanup script for sensitive business documents
# This removes business strategy files from git history permanently

echo "🧹 Cleaning sensitive business documents from git history..."
echo "⚠️  WARNING: This will rewrite git history and require force push"

# List of sensitive files to remove from history
FILES_TO_REMOVE=(
    "ACTUAL_CONFIG_STRATEGY.md"
    "CORTEX-ROADMAP.md" 
    "IMPLEMENTATION-ROADMAP.md"
    "MODEL_STRATEGY.md"
    "docs/STRATEGIC-IMPLEMENTATION-PLAN.md"
    "CORTEX.md"
    "brainy-pitch-deck-FINAL-v2.pdf"
)

# Create the filter command
FILTER_CMD="git rm --cached --ignore-unmatch"
for file in "${FILES_TO_REMOVE[@]}"; do
    FILTER_CMD="$FILTER_CMD \"$file\""
done

echo "📋 Files to remove from git history:"
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "  - $file"
done

echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo "🔄 Running git filter-branch to clean history..."

# Set environment variable to suppress warning
export FILTER_BRANCH_SQUELCH_WARNING=1

# Run the filter-branch command
git filter-branch --force --index-filter "$FILTER_CMD" --prune-empty --tag-name-filter cat -- --all

if [ $? -eq 0 ]; then
    echo "✅ Git history cleaned successfully!"
    echo ""
    echo "🗑️  Cleaning up backup refs..."
    rm -rf .git/refs/original/
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    echo ""
    echo "⚠️  IMPORTANT: Run the following to update remote:"
    echo "   git push --force --all"
    echo "   git push --force --tags"
    echo ""
    echo "🔒 Sensitive business documents removed from git history"
else
    echo "❌ Git filter-branch failed"
    exit 1
fi