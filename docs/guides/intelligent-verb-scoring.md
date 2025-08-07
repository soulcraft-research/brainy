# Intelligent Verb Scoring

The Intelligent Verb Scoring feature in Brainy automatically generates weight and confidence scores for verb relationships using semantic analysis, frequency patterns, and temporal factors. This feature is **off by default** and requires explicit configuration to enable.

## Quick Start

The simplest way to enable intelligent verb scoring with no configuration:

```javascript
import { BrainyData } from '@soulcraft/brainy'

// Enable with minimal configuration
const db = new BrainyData({
  intelligentVerbScoring: {
    enabled: true  // That's it! Uses intelligent defaults
  }
})

await db.init()

// Now when you add verbs without specifying weight, they get intelligent scores
await db.addVerb('user123', 'project456', 'contributesTo')
// ↳ Automatically gets semantic similarity score, frequency boost, etc.
```

## How It Works

When you add a verb relationship without specifying a weight (or with the default weight of 0.5), the system:

1. **Semantic Analysis**: Calculates similarity between entity embeddings
2. **Frequency Amplification**: Boosts weight for repeated relationships  
3. **Temporal Decay**: Applies time-based decay to relationship strength
4. **Learning Adaptation**: Uses historical patterns to refine scores

## Configuration Options

```javascript
const db = new BrainyData({
  intelligentVerbScoring: {
    enabled: true,                        // Required: enable the feature
    enableSemanticScoring: true,          // Use entity embeddings (default: true)
    enableFrequencyAmplification: true,   // Boost repeated relationships (default: true)
    enableTemporalDecay: true,            // Apply time decay (default: true)
    temporalDecayRate: 0.01,              // 1% decay per day (default: 0.01)
    minWeight: 0.1,                       // Minimum weight (default: 0.1)
    maxWeight: 1.0,                       // Maximum weight (default: 1.0)
    baseConfidence: 0.5,                  // Starting confidence (default: 0.5)
    learningRate: 0.1                     // How fast to learn (default: 0.1)
  }
})
```

## Usage Examples

### Basic Usage (Zero Configuration)

```javascript
const db = new BrainyData({
  intelligentVerbScoring: { enabled: true }
})
await db.init()

// Add entities
await db.add('john', 'John is a software developer')
await db.add('project-x', 'Project X is a web application')

// Add relationship - gets intelligent scoring automatically
const relationId = await db.addVerb('john', 'project-x', 'worksOn')

// The system computed weight and confidence based on:
// - Semantic similarity between "software developer" and "web application"
// - This being the first occurrence (no frequency boost yet)
// - Current timestamp (no temporal decay)
```

### Learning from Feedback

```javascript
// Provide feedback to improve future scoring
await db.provideFeedbackForVerbScoring(
  'john', 'project-x', 'worksOn',
  0.9,         // corrected weight
  0.85,        // corrected confidence  
  'correction' // feedback type
)

// Future similar relationships will use this learning
await db.addVerb('jane', 'project-y', 'worksOn')
// ↳ Benefits from previous feedback about 'worksOn' relationships
```

### Monitoring Learning Progress

```javascript
// Get learning statistics
const stats = db.getVerbScoringStats()
console.log(stats)
// {
//   totalRelationships: 150,
//   averageConfidence: 0.73,
//   feedbackCount: 12,
//   topRelationships: [
//     { relationship: "user-worksOn-project", count: 45, averageWeight: 0.82 },
//     { relationship: "user-contributesTo-repo", count: 23, averageWeight: 0.67 }
//   ]
// }
```

### Export and Import Learning Data

```javascript
// Backup learning data
const learningData = db.exportVerbScoringLearningData()
localStorage.setItem('verb-scoring-backup', learningData)

// Restore learning data
const savedData = localStorage.getItem('verb-scoring-backup')
if (savedData) {
  db.importVerbScoringLearningData(savedData)
}
```

## Advanced Usage

### Custom Scoring Strategy

```javascript
const db = new BrainyData({
  intelligentVerbScoring: {
    enabled: true,
    
    // Emphasize semantic similarity over frequency
    enableSemanticScoring: true,
    enableFrequencyAmplification: false,
    enableTemporalDecay: false,
    
    // More conservative scoring
    baseConfidence: 0.3,
    minWeight: 0.2,
    maxWeight: 0.8
  }
})
```

### High-Frequency Learning Setup

```javascript
const db = new BrainyData({
  intelligentVerbScoring: {
    enabled: true,
    
    // Fast adaptation for real-time systems
    learningRate: 0.3,              // Learn quickly from feedback
    enableFrequencyAmplification: true,
    temporalDecayRate: 0.05,        // Faster decay (5% per day)
    
    // Confident scoring for established patterns
    baseConfidence: 0.7
  }
})
```

## Understanding the Output

When intelligent scoring is active, verb metadata includes additional fields:

```javascript
// Retrieve a verb to see intelligent scoring data
const verb = await db.getVerb(relationId)
console.log(verb.metadata)

// Output includes:
{
  sourceId: 'john',
  targetId: 'project-x', 
  type: 'worksOn',
  weight: 0.73,                    // ← Computed weight
  confidence: 0.68,                // ← Computed confidence
  intelligentScoring: {            // ← Scoring details
    reasoning: [
      'Semantic similarity: 0.821',
      'Frequency boost: 0.602', 
      'Temporal factor: 1.000',
      'Final weight: 0.730, confidence: 0.680'
    ],
    computedAt: '2024-01-15T10:30:00Z'
  },
  createdAt: '2024-01-15T10:30:00Z',
  // ... other metadata
}
```

## Best Practices

### 1. Start Simple
Begin with just `enabled: true` and let the system use intelligent defaults.

### 2. Provide Feedback
The system learns best when you provide feedback on incorrect scores:

```javascript
// When you notice a weight should be higher/lower
await db.provideFeedbackForVerbScoring(
  sourceId, targetId, verbType,
  correctWeight, correctConfidence, 'correction'
)
```

### 3. Monitor Learning
Regularly check learning statistics to ensure the system is improving:

```javascript
const stats = db.getVerbScoringStats()
if (stats.feedbackCount < 10) {
  console.log('Consider providing more feedback for better learning')
}
```

### 4. Backup Learning Data
Export learning data periodically to preserve improvements:

```javascript
// Weekly backup
setInterval(() => {
  const backup = db.exportVerbScoringLearningData()
  saveToStorage('verb-scoring-backup', backup)
}, 7 * 24 * 60 * 60 * 1000)
```

## When to Use

**Good for:**
- Knowledge graphs where relationship strength matters
- Systems that need to distinguish between weak and strong connections
- Applications that can provide user feedback on relationship quality
- Long-running systems that benefit from learning patterns

**Not ideal for:**
- Simple binary relationships (exists/doesn't exist)
- Systems where all relationships have equal weight
- One-time data imports without ongoing usage
- Performance-critical paths where extra computation isn't acceptable

## Performance Considerations

- **Minimal overhead**: Only computes scores when weight isn't explicitly provided
- **Semantic calculation**: Requires loading entity embeddings (cached after first access)
- **Learning storage**: Relationship statistics are stored in memory (export for persistence)
- **Adaptive complexity**: More relationships = better accuracy but slightly more computation

## Troubleshooting

### Scores seem too conservative
```javascript
// Increase base confidence and learning rate
intelligentVerbScoring: {
  baseConfidence: 0.7,  // instead of default 0.5
  learningRate: 0.2     // instead of default 0.1
}
```

### Scores change too quickly
```javascript
// Reduce learning rate and temporal decay
intelligentVerbScoring: {
  learningRate: 0.05,      // slower adaptation
  temporalDecayRate: 0.005 // slower decay
}
```

### Not seeing semantic benefits
```javascript
// Ensure semantic scoring is enabled and entities have good embeddings
intelligentVerbScoring: {
  enableSemanticScoring: true,
  // Add more descriptive content to your entities
  // The system works better with rich entity descriptions
}
```

## Integration Examples

### With Existing Workflows

```javascript
// Migrate existing data to use intelligent scoring
const existingVerbs = await db.getAllVerbs()

for (const verb of existingVerbs) {
  if (!verb.metadata.weight || verb.metadata.weight === 0.5) {
    // Let intelligent scoring re-evaluate
    await db.addVerb(
      verb.metadata.sourceId,
      verb.metadata.targetId, 
      verb.metadata.type
      // No weight specified - triggers intelligent scoring
    )
  }
}
```

### With User Interfaces

```javascript
// Allow users to correct relationship strengths
async function updateRelationshipStrength(relationId, userWeight) {
  const verb = await db.getVerb(relationId)
  
  await db.provideFeedbackForVerbScoring(
    verb.metadata.sourceId,
    verb.metadata.targetId,
    verb.metadata.type,
    userWeight,
    undefined,
    'correction'
  )
  
  // Update the actual relationship
  await db.updateVerb(relationId, { weight: userWeight })
}
```

---

The Intelligent Verb Scoring system provides a powerful way to automatically assess relationship quality while learning from your specific use case. Start with the defaults, provide feedback when possible, and watch the system improve over time.