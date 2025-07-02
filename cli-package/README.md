# @soulcraft/brainy-cli

Command-line interface for the [Brainy vector graph database](https://github.com/soulcraft-research/brainy).

## Installation

```bash
# Install globally
npm install -g @soulcraft/brainy-cli
```

## Usage

Once installed, you can use the `brainy` command from anywhere:

```bash
# Show help
brainy --help

# Initialize a new database
brainy init

# Add data
brainy add "Cats are independent pets" '{"noun":"Thing","category":"animal"}'

# Search
brainy search "feline pets" --limit 5

# Add relationships
brainy addVerb id1 id2 RelatedTo '{"description":"Both are pets"}'

# Visualize the graph
brainy visualize
brainy visualize --root <id> --depth 3

# Generate random test data
brainy generate-random-graph --noun-count 20 --verb-count 30 --clear
```

## Features

- Full access to all Brainy database functionality from the command line
- Autocomplete support for commands and options
- Visualization of graph data
- Import/export capabilities
- Augmentation pipeline testing

## Requirements

- Node.js >= 24.0.0

## License

MIT
