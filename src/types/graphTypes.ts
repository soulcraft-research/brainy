/**
 * Graph Types - Standardized Noun and Verb Type System
 * 
 * This module defines a comprehensive, standardized set of noun and verb types
 * that can be used to model any kind of graph, semantic network, or data model.
 * 
 * ## Purpose and Design Philosophy
 * 
 * The type system is designed to be:
 * - **Universal**: Capable of representing any domain or use case
 * - **Hierarchical**: Organized into logical categories for easy navigation
 * - **Extensible**: Additional metadata can be attached to any entity or relationship
 * - **Semantic**: Types carry meaning that can be used for reasoning and inference
 * 
 * ## Noun Types (Entities)
 * 
 * Noun types represent entities in the graph and are organized into categories:
 * 
 * ### Core Entity Types
 * - **Person**: Human entities and individuals
 * - **Organization**: Formal organizations, companies, institutions
 * - **Location**: Geographic locations, places, addresses
 * - **Thing**: Physical objects and tangible items
 * - **Concept**: Abstract ideas, concepts, and intangible entities
 * - **Event**: Occurrences with time and place dimensions
 * 
 * ### Digital/Content Types
 * - **Document**: Text-based files and documents
 * - **Media**: Non-text media files (images, videos, audio)
 * - **File**: Generic digital files
 * - **Message**: Communication content
 * - **Content**: Generic content that doesn't fit other categories
 * 
 * ### Collection Types
 * - **Collection**: Generic groupings of items
 * - **Dataset**: Structured collections of data
 * 
 * ### Business/Application Types
 * - **Product**: Commercial products and offerings
 * - **Service**: Services and offerings
 * - **User**: User accounts and profiles
 * - **Task**: Actions, todos, and workflow items
 * - **Project**: Organized initiatives with goals and timelines
 * 
 * ### Descriptive Types
 * - **Process**: Workflows, procedures, and sequences
 * - **State**: States, conditions, or statuses
 * - **Role**: Roles, positions, or responsibilities
 * - **Topic**: Subjects or themes
 * - **Language**: Languages or linguistic entities
 * - **Currency**: Currencies and monetary units
 * - **Measurement**: Measurements, metrics, or quantities
 * 
 * ## Verb Types (Relationships)
 * 
 * Verb types represent relationships between entities and are organized into categories:
 * 
 * ### Core Relationship Types
 * - **RelatedTo**: Generic relationship (default fallback)
 * - **Contains**: Containment relationship
 * - **PartOf**: Part-whole relationship
 * - **LocatedAt**: Spatial relationship
 * - **References**: Reference or citation relationship
 * 
 * ### Temporal/Causal Types
 * - **Precedes/Succeeds**: Temporal sequence relationships
 * - **Causes**: Causal relationships
 * - **DependsOn**: Dependency relationships
 * - **Requires**: Necessity relationships
 * 
 * ### Creation/Transformation Types
 * - **Creates**: Creation relationships
 * - **Transforms**: Transformation relationships
 * - **Becomes**: State change relationships
 * - **Modifies**: Modification relationships
 * - **Consumes**: Consumption relationships
 * 
 * ### Ownership/Attribution Types
 * - **Owns**: Ownership relationships
 * - **AttributedTo**: Attribution or authorship
 * - **CreatedBy**: Creation attribution
 * - **BelongsTo**: Belonging relationships
 * 
 * ### Social/Organizational Types
 * - **MemberOf**: Membership or affiliation
 * - **WorksWith**: Professional relationships
 * - **FriendOf**: Friendship relationships
 * - **Follows**: Following relationships
 * - **Likes**: Liking relationships
 * - **ReportsTo**: Reporting relationships
 * - **Supervises**: Supervisory relationships
 * - **Mentors**: Mentorship relationships
 * - **Communicates**: Communication relationships
 * 
 * ### Descriptive/Functional Types
 * - **Describes**: Descriptive relationships
 * - **Defines**: Definition relationships
 * - **Categorizes**: Categorization relationships
 * - **Measures**: Measurement relationships
 * - **Evaluates**: Evaluation or assessment relationships
 * - **Uses**: Utilization relationships
 * - **Implements**: Implementation relationships
 * - **Extends**: Extension relationships
 * 
 * ## Usage with Additional Metadata
 * 
 * While the type system provides a standardized vocabulary, additional metadata
 * can be attached to any entity or relationship to capture domain-specific
 * information:
 * 
 * ```typescript
 * const person: GraphNoun = {
 *   id: 'person-123',
 *   noun: NounType.Person,
 *   data: {
 *     name: 'John Doe',
 *     age: 30,
 *     profession: 'Engineer'
 *   }
 * }
 * 
 * const worksFor: GraphVerb = {
 *   id: 'verb-456',
 *   source: 'person-123',
 *   target: 'org-789',
 *   verb: VerbType.MemberOf,
 *   data: {
 *     role: 'Senior Engineer',
 *     startDate: '2020-01-01',
 *     department: 'Engineering'
 *   }
 * }
 * ```
 * 
 * ## Modeling Different Graph Types
 * 
 * This type system can model various graph structures:
 * 
 * ### Knowledge Graphs
 * Use Person, Organization, Location, Concept entities with semantic relationships
 * like AttributedTo, LocatedAt, RelatedTo
 * 
 * ### Social Networks
 * Use Person, User entities with social relationships like FriendOf, Follows,
 * WorksWith, Communicates
 * 
 * ### Content Networks
 * Use Document, Media, Content entities with relationships like References,
 * CreatedBy, Contains, Categorizes
 * 
 * ### Business Process Models
 * Use Task, Process, Role entities with relationships like Precedes, Requires,
 * DependsOn, Transforms
 * 
 * ### Organizational Charts
 * Use Person, Role, Organization entities with relationships like ReportsTo,
 * Supervises, MemberOf
 * 
 * The flexibility of this system allows it to represent any domain while
 * maintaining semantic consistency and enabling powerful graph operations
 * and reasoning capabilities.
 */

// Common metadata types
/**
 * Represents a high-precision timestamp with seconds and nanoseconds
 * Used for tracking creation and update times of graph elements
 */
interface Timestamp {
  seconds: number
  nanoseconds: number
}

/**
 * Metadata about the creator/source of a graph noun
 * Tracks which augmentation and model created the element
 */
interface CreatorMetadata {
  augmentation: string // Name of the augmentation that created this element
  version: string // Version of the augmentation
}

/**
 * Base interface for nodes (nouns) in the graph
 * Represents entities like people, places, things, etc.
 */
export interface GraphNoun {
  id: string // Unique identifier for the noun
  createdBy: CreatorMetadata // Information about what created this noun
  noun: NounType // Type classification of the noun
  createdAt: Timestamp // When the noun was created
  updatedAt: Timestamp // When the noun was last updated
  label?: string // Optional descriptive label
  data?: Record<string, any> // Additional flexible data storage
  embeddedVerbs?: EmbeddedGraphVerb[] // Optional embedded relationships
  embedding?: number[] // Vector representation of the noun
}

/**
 * Base interface for verbs in the graph
 * Represents relationships between nouns
 */
export interface GraphVerb {
  id: string // Unique identifier for the verb
  source: string // ID of the source noun
  target: string // ID of the target noun
  label?: string // Optional descriptive label
  verb: VerbType // Type of relationship
  createdAt: Timestamp // When the verb was created
  updatedAt: Timestamp // When the verb was last updated
  createdBy: CreatorMetadata // Information about what created this verb
  data?: Record<string, any> // Additional flexible data storage
  embedding?: number[] // Vector representation of the relationship
  confidence?: number // Confidence score (0-1)
  weight?: number // Strength/importance of the relationship
}

/**
 * Version of GraphVerb for embedded relationships
 * Used when the source is implicit from the parent document
 */
export type EmbeddedGraphVerb = Omit<GraphVerb, 'source'>

// Proper Noun interfaces - extend GraphNoun with specific noun types

/**
 * Represents a person entity in the graph
 */
export interface Person extends GraphNoun {
  noun: typeof NounType.Person
}

/**
 * Represents a physical location in the graph
 */
export interface Location extends GraphNoun {
  noun: typeof NounType.Location
}

/**
 * Represents a physical or virtual object in the graph
 */
export interface Thing extends GraphNoun {
  noun: typeof NounType.Thing
}

/**
 * Represents an event or occurrence in the graph
 */
export interface Event extends GraphNoun {
  noun: typeof NounType.Event
}

/**
 * Represents an abstract concept or idea in the graph
 */
export interface Concept extends GraphNoun {
  noun: typeof NounType.Concept
}

export interface Collection extends GraphNoun {
  noun: typeof NounType.Collection
}

export interface Organization extends GraphNoun {
  noun: typeof NounType.Organization
}

export interface Document extends GraphNoun {
  noun: typeof NounType.Document
}

export interface Media extends GraphNoun {
  noun: typeof NounType.Media
}

export interface File extends GraphNoun {
  noun: typeof NounType.File
}

export interface Message extends GraphNoun {
  noun: typeof NounType.Message
}

export interface Dataset extends GraphNoun {
  noun: typeof NounType.Dataset
}

export interface Product extends GraphNoun {
  noun: typeof NounType.Product
}

export interface Service extends GraphNoun {
  noun: typeof NounType.Service
}

export interface User extends GraphNoun {
  noun: typeof NounType.User
}

export interface Task extends GraphNoun {
  noun: typeof NounType.Task
}

export interface Project extends GraphNoun {
  noun: typeof NounType.Project
}

export interface Process extends GraphNoun {
  noun: typeof NounType.Process
}

export interface State extends GraphNoun {
  noun: typeof NounType.State
}

export interface Role extends GraphNoun {
  noun: typeof NounType.Role
}

export interface Topic extends GraphNoun {
  noun: typeof NounType.Topic
}

export interface Language extends GraphNoun {
  noun: typeof NounType.Language
}

export interface Currency extends GraphNoun {
  noun: typeof NounType.Currency
}

export interface Measurement extends GraphNoun {
  noun: typeof NounType.Measurement
}

/**
 * Represents content (text, media, etc.) in the graph
 */
export interface Content extends GraphNoun {
  noun: typeof NounType.Content
}

/**
 * Defines valid noun types for graph entities
 * Used for categorizing different types of nodes
 */

export const NounType = {
  // Core Entity Types
  Person: 'person', // Human entities
  Organization: 'organization', // Formal organizations (companies, institutions, etc.)
  Location: 'location', // Geographic locations (merges previous Place and Location)
  Thing: 'thing', // Physical objects
  Concept: 'concept', // Abstract ideas, concepts, and intangible entities
  Event: 'event', // Occurrences with time and place

  // Digital/Content Types
  Document: 'document', // Text-based files and documents (reports, articles, etc.)
  Media: 'media', // Non-text media files (images, videos, audio)
  File: 'file', // Generic digital files (merges aspects of Digital with file-specific focus)
  Message: 'message', // Communication content (emails, chat messages, posts)
  Content: 'content', // Generic content that doesn't fit other categories

  // Collection Types
  Collection: 'collection', // Generic grouping of items (merges Group, List, and Category)
  Dataset: 'dataset', // Structured collections of data

  // Business/Application Types
  Product: 'product', // Commercial products and offerings
  Service: 'service', // Services and offerings
  User: 'user', // User accounts and profiles
  Task: 'task', // Actions, todos, and workflow items
  Project: 'project', // Organized initiatives with goals and timelines

  // Descriptive Types
  Process: 'process', // Workflows, procedures, and sequences
  State: 'state', // States, conditions, or statuses
  Role: 'role', // Roles, positions, or responsibilities
  Topic: 'topic', // Subjects or themes
  Language: 'language', // Languages or linguistic entities
  Currency: 'currency', // Currencies and monetary units
  Measurement: 'measurement' // Measurements, metrics, or quantities
} as const
export type NounType = (typeof NounType)[keyof typeof NounType]

/**
 * Defines valid verb types for relationships
 * Used for categorizing different types of connections
 */
export const VerbType = {
  // Core Relationship Types
  RelatedTo: 'relatedTo', // Generic relationship (default fallback)
  Contains: 'contains', // Containment relationship (parent contains child)
  PartOf: 'partOf', // Part-whole relationship (child is part of parent)
  LocatedAt: 'locatedAt', // Spatial relationship
  References: 'references', // Reference or citation relationship

  // Temporal/Causal Types
  Precedes: 'precedes', // Temporal sequence (comes before)
  Succeeds: 'succeeds', // Temporal sequence (comes after)
  Causes: 'causes', // Causal relationship (merges Influences and Causes)
  DependsOn: 'dependsOn', // Dependency relationship
  Requires: 'requires', // Necessity relationship (new)

  // Creation/Transformation Types
  Creates: 'creates', // Creation relationship (merges Created and Produces)
  Transforms: 'transforms', // Transformation relationship
  Becomes: 'becomes', // State change relationship
  Modifies: 'modifies', // Modification relationship
  Consumes: 'consumes', // Consumption relationship

  // Ownership/Attribution Types
  Owns: 'owns', // Ownership relationship (merges Controls and Owns)
  AttributedTo: 'attributedTo', // Attribution or authorship
  CreatedBy: 'createdBy', // Creation attribution (new, distinct from Creates)
  BelongsTo: 'belongsTo', // Belonging relationship (new)

  // Social/Organizational Types
  MemberOf: 'memberOf', // Membership or affiliation
  WorksWith: 'worksWith', // Professional relationship
  FriendOf: 'friendOf', // Friendship relationship
  Follows: 'follows', // Following relationship
  Likes: 'likes', // Liking relationship
  ReportsTo: 'reportsTo', // Reporting relationship
  Supervises: 'supervises', // Supervisory relationship
  Mentors: 'mentors', // Mentorship relationship
  Communicates: 'communicates', // Communication relationship (merges Communicates and Collaborates)

  // Descriptive/Functional Types
  Describes: 'describes', // Descriptive relationship
  Defines: 'defines', // Definition relationship
  Categorizes: 'categorizes', // Categorization relationship
  Measures: 'measures', // Measurement relationship
  Evaluates: 'evaluates', // Evaluation or assessment relationship
  Uses: 'uses', // Utilization relationship (new)
  Implements: 'implements', // Implementation relationship
  Extends: 'extends' // Extension relationship (merges Extends and Inherits)
} as const
export type VerbType = (typeof VerbType)[keyof typeof VerbType]
