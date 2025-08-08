#!/bin/bash

# Cortex Demo Script - Test all the features!
echo "🧠 Welcome to Cortex Demo!"
echo "=========================="
echo ""

# Initialize Cortex with memory storage (for quick testing)
echo "1️⃣ Initializing Cortex..."
echo "Choose 'Memory (testing)' when prompted"
echo ""
node bin/cortex.js init

# Add some test data
echo ""
echo "2️⃣ Adding sample data..."
node bin/cortex.js add "John is a software engineer at TechCorp" --metadata '{"type": "person", "role": "engineer", "company": "TechCorp"}'
node bin/cortex.js add "Jane is a data scientist at DataCo" --metadata '{"type": "person", "role": "scientist", "company": "DataCo"}'
node bin/cortex.js add "AI Project for customer analytics" --metadata '{"type": "project", "domain": "AI", "status": "active"}'
node bin/cortex.js add "Machine Learning Workshop next week" --metadata '{"type": "event", "topic": "ML", "date": "2024-02-15"}'

# Add relationships
echo ""
echo "3️⃣ Adding graph relationships..."
node bin/cortex.js verb "John" "works_on" "AI Project"
node bin/cortex.js verb "Jane" "leads" "AI Project"
node bin/cortex.js verb "John" "attends" "Machine Learning Workshop"

# Show statistics
echo ""
echo "4️⃣ Database statistics..."
node bin/cortex.js stats --detailed

# List searchable fields
echo ""
echo "5️⃣ Searchable fields..."
node bin/cortex.js fields

# Test search with filters
echo ""
echo "6️⃣ Advanced search with MongoDB-style filters..."
node bin/cortex.js search "engineer" --filter '{"type": "person"}' --limit 5

# Test similarity
echo ""
echo "7️⃣ Testing semantic similarity..."
node bin/cortex.js similarity "software developer" "programmer"

# Test embedding
echo ""
echo "8️⃣ Generate embedding..."
node bin/cortex.js embed "artificial intelligence"

# Interactive chat (you can exit with 'exit')
echo ""
echo "9️⃣ Try chatting with your data!"
echo "Type 'exit' to quit the chat"
echo ""
node bin/cortex.js chat "What do we know about AI?"

echo ""
echo "🎉 Demo complete! You can now try:"
echo "  - cortex explore       # Interactive graph exploration"
echo "  - cortex chat          # Interactive chat mode"
echo "  - cortex llm           # Setup an LLM provider"
echo "  - cortex shell         # Interactive shell"