#!/bin/bash

# Master installation script for dotfiles
# This installs all dotfiles including claude-commit

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}     Dotfiles Installation${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Get the directory of this script
if [[ -n "$BASH_SOURCE" ]]; then
    DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    # Fallback for when script is piped from curl
    DOTFILES_DIR="$HOME/dotfiles"
    
    # Clone the repository if it doesn't exist
    if [[ ! -d "$DOTFILES_DIR" ]]; then
        echo -e "${YELLOW}Cloning dotfiles repository...${NC}"
        git clone https://github.com/yourusername/dotfiles.git "$DOTFILES_DIR"
    fi
fi

# Install claude-commit
echo -e "${YELLOW}Installing claude-commit...${NC}"
if [[ -f "$DOTFILES_DIR/setup-claude-commit.sh" ]]; then
    bash "$DOTFILES_DIR/setup-claude-commit.sh"
elif [[ -f "$DOTFILES_DIR/bin/claude-commit" ]]; then
    # Direct installation from bin directory
    mkdir -p ~/.local/bin
    cp "$DOTFILES_DIR/bin/claude-commit" ~/.local/bin/
    chmod +x ~/.local/bin/claude-commit
    
    # Set up git aliases
    git config --global alias.cc '!~/.local/bin/claude-commit'
    git config --global alias.smart-commit '!~/.local/bin/claude-commit'
    
    echo -e "${GREEN}✓ claude-commit installed${NC}"
else
    echo -e "${RED}✗ claude-commit script not found${NC}"
fi

# Add more dotfiles installations here as needed
# For example:
# echo -e "${YELLOW}Installing vim configuration...${NC}"
# ln -sf "$DOTFILES_DIR/vimrc" ~/.vimrc

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${BLUE}Installed tools:${NC}"
echo -e "  • git cc (claude-commit)"
echo ""
echo -e "${YELLOW}Please restart your terminal or run:${NC}"
echo -e "  source ~/.bashrc  (or ~/.zshrc for Zsh)"