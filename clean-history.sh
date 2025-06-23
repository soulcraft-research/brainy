#!/bin/bash

# Script to remove all git history from a GitHub repository
# This script implements Method 1 from the instructions.md file

echo "This script will remove all git history from your GitHub repository."
echo "This process is IRREVERSIBLE. Make sure you have a backup if needed."
echo "All commit history, branches, and tags will be lost."
echo ""
read -p "Are you sure you want to continue? (y/n): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
  echo "Operation cancelled."
  exit 0
fi

echo ""
echo "Starting the process to remove git history..."

# Get the current branch name
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"

# Create a new orphan branch
echo "Creating new orphan branch 'temp_branch'..."
git checkout --orphan temp_branch

# Add all files to the new branch
echo "Adding all files to the new branch..."
git add .

# Commit the changes
echo "Committing changes..."
git commit -m "Initial commit"

# Delete the main branch
echo "Deleting the '$current_branch' branch..."
git branch -D $current_branch

# Rename the current branch to the original branch name
echo "Renaming 'temp_branch' to '$current_branch'..."
git branch -m $current_branch

# Force push to GitHub
echo "Force pushing to GitHub (this may take a while)..."
git push -f origin $current_branch

# Reset the upstream branch
echo "Resetting the upstream branch..."
git push origin --set-upstream $current_branch

echo ""
echo "Git history has been successfully removed!"
echo "Please check the instructions.md file for additional steps you may need to take."
echo "These include reconfiguring GitHub Pages, GitHub Actions workflows, and npm package settings."
