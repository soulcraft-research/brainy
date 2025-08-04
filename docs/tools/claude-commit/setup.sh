#!/bin/bash

# Setup script for Claude Commit on any machine
# This script installs the claude-commit tool globally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Claude Commit Setup Script${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Create ~/.local/bin if it doesn't exist
echo -e "${YELLOW}Creating ~/.local/bin directory...${NC}"
mkdir -p ~/.local/bin

# Create the claude-commit script
echo -e "${YELLOW}Installing claude-commit script...${NC}"
cat > ~/.local/bin/claude-commit << 'EOF'
#!/bin/bash

# Claude Commit Message Generator - Global Version
# Automatically generates Conventional Commit messages using git diff

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "${RED}Not in a git repository${NC}"
    exit 1
fi

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
    echo -e "${RED}No changes to commit${NC}"
    exit 1
fi

# Get the diff of staged changes (or all changes if nothing staged)
if [[ -n $(git diff --cached --name-only) ]]; then
    DIFF=$(git diff --cached)
    FILES=$(git diff --cached --name-only)
    echo -e "${GREEN}Analyzing staged changes...${NC}"
else
    DIFF=$(git diff)
    FILES=$(git diff --name-only)
    echo -e "${YELLOW}No staged changes. Analyzing all modified files...${NC}"
    echo -e "${YELLOW}Run 'git add' first to stage specific changes${NC}"
fi

# Get project name from git remote or directory name
PROJECT_NAME=$(basename "$(git rev-parse --show-toplevel)")
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null)
if [[ -n "$REMOTE_URL" ]]; then
    PROJECT_NAME=$(basename -s .git "$REMOTE_URL")
fi

# Create a prompt for Claude
PROMPT="Based on the following git diff from the '$PROJECT_NAME' project, generate a Conventional Commit message.

REQUIREMENTS:
1. Use Conventional Commit format: <type>(<scope>): <description>
2. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
3. Keep first line under 72 characters
4. Use imperative mood (e.g., 'add' not 'added')
5. Include a detailed body explaining the purpose and impact
6. Note any breaking changes with 'BREAKING CHANGE:' prefix
7. Reference any issue numbers if apparent from the code

FILES CHANGED:
$FILES

GIT DIFF (showing first 500 lines):
$(echo "$DIFF" | head -n 500)

Generate ONLY the commit message, no explanations or markdown formatting."

# Call Claude API (using claude CLI)
echo -e "${GREEN}Generating commit message with Claude...${NC}"

# Save the prompt to a temporary file to avoid shell escaping issues
TEMP_PROMPT=$(mktemp)
echo "$PROMPT" > "$TEMP_PROMPT"

# Generate the commit message
COMMIT_MSG=$(claude code --no-markdown < "$TEMP_PROMPT" 2>/dev/null)

# Clean up temp file
rm "$TEMP_PROMPT"

# Check if message was generated
if [[ -z "$COMMIT_MSG" ]]; then
    echo -e "${RED}Failed to generate commit message${NC}"
    echo "Falling back to standard git commit..."
    git commit
    exit 1
fi

# Display the generated message
echo ""
echo -e "${GREEN}Generated commit message:${NC}"
echo "========================================"
echo "$COMMIT_MSG"
echo "========================================"
echo ""

# ALWAYS require explicit review
echo -e "${YELLOW}⚠️  REVIEW REQUIRED${NC}"
echo -e "${YELLOW}Please review the commit message above carefully.${NC}"
echo ""
echo -e "${YELLOW}What would you like to do?${NC}"
echo "  ${GREEN}1)${NC} Use this message AS-IS"
echo "  ${GREEN}2)${NC} EDIT this message first"
echo "  ${GREEN}3)${NC} Generate a NEW message"
echo "  ${RED}4)${NC} CANCEL (no commit)"
echo ""
read -p "Your choice [1-4]: " choice

case $choice in
    1)
        # Final confirmation before committing
        echo -e "${YELLOW}Ready to commit with the message above.${NC}"
        read -p "Confirm commit? [y/N]: " confirm
        
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            # Stage all changes if nothing is staged
            if [[ -z $(git diff --cached --name-only) ]]; then
                git add -A
            fi
            # Commit with the generated message
            git commit -m "$COMMIT_MSG"
            echo -e "${GREEN}✓ Committed successfully${NC}"
            echo -e "${YELLOW}📝 Note: Changes are committed locally only${NC}"
            echo -e "${YELLOW}   Run 'git push' manually when ready to push${NC}"
        else
            echo -e "${YELLOW}Commit cancelled${NC}"
            exit 0
        fi
        ;;
    2)
        # Save message to temp file and open in editor
        TEMP_MSG=$(mktemp)
        echo "$COMMIT_MSG" > "$TEMP_MSG"
        
        echo -e "${YELLOW}Opening editor to modify the message...${NC}"
        ${EDITOR:-vim} "$TEMP_MSG"
        
        # Show the edited message
        echo ""
        echo -e "${GREEN}Edited commit message:${NC}"
        echo "========================================"
        cat "$TEMP_MSG"
        echo "========================================"
        echo ""
        
        read -p "Commit with this edited message? [y/N]: " confirm
        
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            # Stage all changes if nothing is staged
            if [[ -z $(git diff --cached --name-only) ]]; then
                git add -A
            fi
            
            # Commit with edited message
            git commit -F "$TEMP_MSG"
            rm "$TEMP_MSG"
            echo -e "${GREEN}✓ Committed with edited message${NC}"
            echo -e "${YELLOW}📝 Note: Changes are committed locally only${NC}"
            echo -e "${YELLOW}   Run 'git push' manually when ready to push${NC}"
        else
            rm "$TEMP_MSG"
            echo -e "${YELLOW}Commit cancelled${NC}"
            exit 0
        fi
        ;;
    3)
        echo -e "${YELLOW}Regenerating commit message...${NC}"
        # Re-run the script
        exec "$0" "$@"
        ;;
    4)
        echo -e "${RED}✗ Commit cancelled by user${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Commit cancelled${NC}"
        exit 1
        ;;
esac
EOF

# Make the script executable
chmod +x ~/.local/bin/claude-commit
echo -e "${GREEN}✓ claude-commit script installed${NC}"

# Create configuration file if it doesn't exist
if [[ ! -f ~/.claude-commit.conf ]]; then
    echo -e "${YELLOW}Creating configuration file...${NC}"
    cat > ~/.claude-commit.conf << 'CONF_EOF'
# Claude Commit Configuration
# Safety settings to ensure review and prevent accidental pushes

# ALWAYS require explicit confirmation before committing
REQUIRE_CONFIRMATION=true

# NEVER auto-push after commit
AUTO_PUSH=false

# Default editor for message editing (vim, nano, code, etc.)
# Leave empty to use system default ($EDITOR)
PREFERRED_EDITOR=

# Show diff in commit message review (helps catch issues)
SHOW_DIFF_PREVIEW=false

# Maximum diff size to include in Claude prompt (lines)
MAX_DIFF_LINES=500

# Require double confirmation for commits with breaking changes
DOUBLE_CONFIRM_BREAKING=true
CONF_EOF
    echo -e "${GREEN}✓ Configuration file created at ~/.claude-commit.conf${NC}"
else
    echo -e "${GREEN}✓ Configuration file already exists${NC}"
fi

# Set up git aliases
echo -e "${YELLOW}Setting up git aliases...${NC}"
git config --global alias.cc '!~/.local/bin/claude-commit'
git config --global alias.smart-commit '!~/.local/bin/claude-commit'
echo -e "${GREEN}✓ Git aliases configured${NC}"

# Add ~/.local/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo -e "${YELLOW}Adding ~/.local/bin to PATH...${NC}"
    
    # Detect shell and update appropriate config file
    if [[ -n "$ZSH_VERSION" ]]; then
        SHELL_CONFIG="$HOME/.zshrc"
    elif [[ -n "$BASH_VERSION" ]]; then
        SHELL_CONFIG="$HOME/.bashrc"
    else
        SHELL_CONFIG="$HOME/.profile"
    fi
    
    echo '' >> "$SHELL_CONFIG"
    echo '# Added by claude-commit setup' >> "$SHELL_CONFIG"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_CONFIG"
    
    echo -e "${GREEN}✓ Added to $SHELL_CONFIG${NC}"
    echo -e "${YELLOW}Please run: source $SHELL_CONFIG${NC}"
else
    echo -e "${GREEN}✓ ~/.local/bin already in PATH${NC}"
fi

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${BLUE}Usage:${NC}"
echo -e "  ${YELLOW}git cc${NC}            - Generate and commit with Claude"
echo -e "  ${YELLOW}git smart-commit${NC}  - Alternative alias"
echo ""
echo -e "${BLUE}This works in any git repository!${NC}"