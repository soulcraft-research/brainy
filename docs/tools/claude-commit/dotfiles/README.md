# Dotfiles - Claude Commit Setup

This repository contains my development environment configuration, including the Claude AI-powered git commit message generator.

## Quick Setup

### Option 1: One-Line Install (Recommended)

```bash
curl -sSL https://raw.githubusercontent.com/yourusername/dotfiles/main/install.sh | bash
```

### Option 2: Manual Install

```bash
# Clone the repository
git clone https://github.com/yourusername/dotfiles.git ~/dotfiles

# Run the setup script
cd ~/dotfiles
./install.sh
```

### Option 3: Just Claude Commit

If you only want the `git cc` command:

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/yourusername/dotfiles/main/setup-claude-commit.sh | bash
```

## What's Included

### Claude Commit (`git cc`)

An AI-powered git commit message generator that:
- Analyzes your git diff
- Generates Conventional Commit formatted messages
- Works in any git repository
- No configuration needed

**Usage:**
```bash
# Make your changes
git cc  # Claude generates the commit message
```

## Syncing Between Computers

### First Time Setup (on new computer)

1. Run the install script (see Quick Setup above)
2. That's it! The `git cc` command is now available

### Keeping in Sync

To update to the latest version on any computer:

```bash
sync-claude-commit
```

Or manually:
```bash
curl -sSL https://raw.githubusercontent.com/yourusername/dotfiles/main/bin/claude-commit > ~/.local/bin/claude-commit
chmod +x ~/.local/bin/claude-commit
```

## File Structure

```
dotfiles/
├── README.md           # This file
├── install.sh          # Main installation script
├── setup-claude-commit.sh  # Standalone claude-commit installer
└── bin/
    └── claude-commit   # The actual claude-commit script
```

## Requirements

- Git
- Claude CLI (`claude` command)
- Bash or Zsh

## Conventional Commit Format

The tool generates messages following this format:

```
<type>(<scope>): <description>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

## Troubleshooting

### "claude: command not found"

Make sure Claude CLI is installed:
```bash
# Install Claude CLI if not present
# Visit: https://claude.ai/code
```

### "git cc: command not found"

Make sure ~/.local/bin is in your PATH:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## License

MIT