#!/bin/bash

# Script to remove sensitive business strategy files from git history
# WARNING: This rewrites git history! Make sure to backup first.

echo "⚠️  WARNING: This will rewrite git history!"
echo "Make sure you have a backup and all team members are aware."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "Removing sensitive files from git history..."

# Files to remove from history
FILES_TO_REMOVE=(
    "IMPLEMENTATION-ROADMAP.md"
    "CORTEX.md"
    "CORTEX-ROADMAP.md"
    "docs/STRATEGIC-IMPLEMENTATION-PLAN.md"
    "ACTUAL_CONFIG_STRATEGY.md"
    "MODEL_STRATEGY.md"
    "METADATA_OPTIMIZATION_PROPOSAL.md"
    "METADATA_PERFORMANCE_ANALYSIS.md"
    "PERFORMANCE_OPTIMIZATION_TODO.md"
    "TENSORFLOW_TO_TRANSFORMERS_ANALYSIS.md"
    "MIGRATION_PLAN_DEPRECATED_METHODS.md"
    "AUGMENTATION_ARCHITECTURE.md"  # Contains pricing info
    "CLI_AUGMENTATION_GUIDE.md"
    "docs/brainy-cli.md"
    "docs/getting-started/quick-start.md"
    "docs/distributed-deployment-scenario.md"
    "docs/distributed-usage-guide.md"
    "docs/brainy-distributed-enhancements.md"
    "docs/brainy-distributed-enhancements-revised.md"
)

# Build the filter-branch command
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "Removing $file from history..."
    FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch $file" \
        --prune-empty --tag-name-filter cat -- --all
done

echo ""
echo "✅ Files removed from history."
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Force push to remote: git push origin --force --all"
echo "2. Force push tags: git push origin --force --tags"
echo "3. Tell all team members to re-clone the repository"
echo "4. Clean up local repo: git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin"
echo "5. Run garbage collection: git gc --prune=now --aggressive"
echo ""
echo "Note: GitHub may still show some cached data for a while."