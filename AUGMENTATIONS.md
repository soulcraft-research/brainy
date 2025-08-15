# 🧩 Brainy Augmentation System

> **Augmentations = Plugins = Superpowers for your Brain!**

## 🎯 What Are Augmentations?

Augmentations are plugins that extend Brainy with new capabilities. They can process data, add new features, or integrate with external services.

## ⚡ Quick Start

```javascript
// Create a simple augmentation
class SentimentAnalyzer {
  name = 'sentiment'
  type = 'processor'
  
  async process(data) {
    // Analyze sentiment of text
    const sentiment = analyzeSentiment(data.text)
    return { ...data, sentiment }
  }
}

// Register it with Brainy
const brain = new BrainyData()
brain.augment(new SentimentAnalyzer())

// Now all data gets sentiment analysis
await brain.add("I love this product!") // Automatically tagged with positive sentiment
```

## 📦 Types of Augmentations

### 1. **Processors** - Transform data as it flows through
```javascript
class DataProcessor {
  type = 'processor'
  async process(data) { /* transform data */ }
}
```

### 2. **Enhancers** - Add metadata or enrich data
```javascript
class DataEnhancer {
  type = 'enhancer'
  async enhance(data) { /* add metadata */ }
}
```

### 3. **Validators** - Ensure data quality
```javascript
class DataValidator {
  type = 'validator'
  async validate(data) { /* check data */ }
}
```

## 🛠️ Creating Your Own Augmentation

### Basic Structure
```javascript
class MyAugmentation {
  // Required properties
  name = 'my-augmentation'        // Unique identifier
  type = 'processor'               // Type of augmentation
  
  // Optional properties
  version = '1.0.0'                // Version number
  description = 'Does something'   // What it does
  
  // Required methods based on type
  async process(data) {
    // Your logic here
    return processedData
  }
  
  // Lifecycle hooks (optional)
  async init() { /* setup */ }
  async cleanup() { /* teardown */ }
}
```

### Complete Example: Email Parser
```javascript
class EmailParser {
  name = 'email-parser'
  type = 'processor'
  description = 'Extracts structured data from emails'
  
  async process(data) {
    if (!this.isEmail(data.text)) {
      return data // Pass through non-emails
    }
    
    const parsed = {
      from: this.extractFrom(data.text),
      to: this.extractTo(data.text),
      subject: this.extractSubject(data.text),
      body: this.extractBody(data.text),
      date: this.extractDate(data.text)
    }
    
    return {
      ...data,
      email: parsed,
      metadata: {
        ...data.metadata,
        type: 'email',
        sender: parsed.from
      }
    }
  }
  
  isEmail(text) {
    return text.includes('From:') && text.includes('Subject:')
  }
  
  extractFrom(text) {
    const match = text.match(/From: (.+)/i)
    return match ? match[1] : null
  }
  
  // ... other extraction methods
}

// Use it
brain.augment(new EmailParser())
await brain.add(emailContent) // Automatically parsed!
```

## 🔧 Managing Augmentations

### List Active Augmentations
```javascript
const augmentations = brain.augment('list')
console.log(augmentations)
// [{ name: 'email-parser', type: 'processor', active: true }, ...]
```

### Enable/Disable Augmentations
```javascript
// Disable temporarily
brain.augment('disable', 'email-parser')

// Re-enable
brain.augment('enable', 'email-parser')

// Remove completely
brain.augment('unregister', 'email-parser')
```

### Enable by Type
```javascript
// Disable all processors
brain.augment('disable-type', { type: 'processor' })

// Enable only validators
brain.augment('enable-type', { type: 'validator' })
```

## 🌟 Ideas for Community Augmentations

Want to build one? Here are some ideas:

- **🎭 Sentiment Analysis** - Understand emotions in text
- **🌍 Language Detection** - Identify and tag languages
- **📊 Data Visualizer** - Generate charts from data
- **🔗 Link Extractor** - Find and validate URLs
- **📅 Date Parser** - Extract and normalize dates
- **🏷️ Auto-Tagger** - Automatically tag content
- **🔍 Duplicate Detector** - Find similar content
- **📝 Summarizer** - Generate summaries of long text

## 🚀 Publishing Your Augmentation

### 1. Create an npm package
```json
{
  "name": "brainy-sentiment",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "@soulcraft/brainy": "^1.0.0"
  }
}
```

### 2. Export your augmentation
```javascript
// index.js
export class SentimentAugmentation {
  name = 'sentiment'
  // ... implementation
}
```

### 3. Users can install and use
```bash
npm install brainy-sentiment
```

```javascript
import { SentimentAugmentation } from 'brainy-sentiment'
brain.augment(new SentimentAugmentation())
```

## 📚 Built-in Augmentations

Brainy includes some augmentations out of the box:

- **Intelligent Verb Scoring** - Smart relationship weighting
- **Metadata Indexing** - Fast faceted search
- **Write Buffering** - Optimized batch writes

These are automatically activated when needed and don't require manual registration.

## 🤝 Contributing

Have an idea for an augmentation? We'd love to see it!

1. Build your augmentation following the patterns above
2. Test it thoroughly with Brainy
3. Publish to npm with `brainy-` prefix
4. Let us know and we'll feature it!

## 🆘 Need Help?

- Check out examples in `/examples` folder
- Join our community discussions
- Open an issue for questions

---

**Remember:** Augmentations make Brainy infinitely extensible. If you can imagine it, you can build it!