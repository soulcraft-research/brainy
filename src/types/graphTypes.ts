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
 * Base interface for edges (verbs) in the graph
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
export interface Place extends GraphNoun {
  noun: typeof NounType.Place
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

export interface Group extends GraphNoun {
  noun: typeof NounType.Group
}

export interface List extends GraphNoun {
  noun: typeof NounType.List
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
  Person: 'person', // Person entities
  Place: 'place', // Physical locations
  Thing: 'thing', // Physical or virtual objects
  Event: 'event', // Events or occurrences
  Concept: 'concept', // Abstract concepts or ideas
  Content: 'content', // Content items
  Group: 'group', // Groups of related entities
  List: 'list', // Ordered collections of entities
  Category: 'category' // Categories for content items including tags
} as const
export type NounType = (typeof NounType)[keyof typeof NounType]

/**
 * Defines valid verb types for relationships
 * Used for categorizing different types of connections
 */
export const VerbType = {
  AttributedTo: 'attributedTo', // Indicates attribution or authorship
  Controls: 'controls', // Indicates control or ownership
  Created: 'created', // Indicates creation or authorship
  Earned: 'earned', // Indicates achievement or acquisition
  Owns: 'owns', // Indicates ownership
  MemberOf: 'memberOf', // Indicates membership or affiliation
  RelatedTo: 'relatedTo', // Indicates family relationship
  WorksWith: 'worksWith', // Indicates professional relationship
  FriendOf: 'friendOf', // Indicates friendship
  ReportsTo: 'reportsTo', // Indicates reporting relationship
  Supervises: 'supervises', // Indicates supervisory relationship
  Mentors: 'mentors' // Indicates mentorship relationship
} as const
export type VerbType = (typeof VerbType)[keyof typeof VerbType]
