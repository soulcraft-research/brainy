# Claude Commit - AI-Powered Git Commits

Automatically generate Conventional Commit messages using Claude AI by analyzing your git diff.

## 🚀 Quick Setup

### One-Line Install (Simplest)

On any computer, just run:

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/soulcraft-research/brainy/main/docs/tools/claude-commit/setup.sh | bash
```

### Manual Install

If you have the brainy repo cloned:

```bash
cd ~/Projects/brainy/docs/tools/claude-commit
./setup.sh
```

### Using Dotfiles (For Multiple Machines)

1. **First time:** Create your dotfiles repository
   ```bash
   # Copy the dotfiles folder from brainy to a new repo
   cp -r ~/Projects/brainy/docs/tools/claude-commit/dotfiles ~/Projects/my-dotfiles
   cd ~/Projects/my-dotfiles
   git init
   git add .
   git commit -m "feat: add claude-commit dotfiles"
   # Create a GitHub repo and push
   ```

2. **On any new computer:**
   ```bash
   # One-line install from your dotfiles
   curl -sSL https://raw.githubusercontent.com/yourusername/my-dotfiles/main/install.sh | bash
   ```

## 📖 Usage

After installation, use `git cc` in any git repository:

```bash
# Make your changes
git cc

# The tool will:
# 1. Analyze your changes
# 2. Generate a Conventional Commit message
# 3. ⚠️ REQUIRE YOUR REVIEW
# 4. Let you edit, regenerate, or cancel
# 5. NEVER auto-push
```

## 🛡️ Safety Features

- **Always Requires Review**: You MUST explicitly approve every commit message
- **Double Confirmation**: Asks "Confirm commit? [y/N]" before committing  
- **Edit Option**: Modify the message in your editor before committing
- **Regenerate Option**: Request a new message if not satisfied
- **No Auto-Push**: NEVER pushes automatically - you control when to push
- **Clear Formatting**: Shows the full message with clear visual separation

## 📁 What Gets Installed

- `~/.local/bin/claude-commit` - The main script
- `~/.claude-commit.conf` - Optional configuration file
- Git aliases: `git cc` and `git smart-commit`
- PATH update (if needed)

## 🔄 Keeping Computers in Sync

### Manual Sync

On any computer, update to latest version:

```bash
# From brainy repo
curl -sSL https://raw.githubusercontent.com/yourusername/brainy/main/dotfiles/bin/claude-commit > ~/.local/bin/claude-commit
chmod +x ~/.local/bin/claude-commit
```

### Automatic Sync with Dotfiles

If you set up a dotfiles repo:

```bash
cd ~/Projects/my-dotfiles
git pull
./install.sh
```

## 💻 Per-Computer Setup Checklist

When setting up a new computer:

- [ ] Install Claude CLI (`claude` command must work)
- [ ] Run the setup script
- [ ] Restart terminal or `source ~/.bashrc`
- [ ] Test with `git cc` in any repo

## 🧪 Testing

After setup, test in any git repository:

```bash
# Make a change to any file
echo "test" >> README.md

# Use claude to commit
git cc
```

## 🔧 Troubleshooting

### "command not found: claude"
- Install Claude CLI from https://claude.ai/code

### "command not found: git cc"
- Run: `source ~/.bashrc` (or `~/.zshrc` for Zsh)
- Verify: `ls -la ~/.local/bin/claude-commit`

### Script not generating commits
- Check Claude CLI works: `claude --version`
- Ensure you have changes: `git status`

## 📝 Files in This Setup

```
brainy/
├── setup-claude-commit.sh      # Standalone installer
├── CLAUDE_COMMIT_SETUP.md      # This file
└── dotfiles/                    # Portable dotfiles
    ├── README.md               # Dotfiles documentation
    ├── install.sh              # Master installer
    ├── setup-claude-commit.sh  # Claude commit installer
    └── bin/
        └── claude-commit       # The actual script
```

## 🎯 Summary

**For your laptop**, you have three options:

1. **Quickest:** Run the setup script from brainy repo
2. **Portable:** Create a dotfiles repo and install from there
3. **Manual:** Copy the script directly to `~/.local/bin/`

All methods give you the same `git cc` command that works in any git repository!