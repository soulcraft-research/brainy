/**
 * Represents a high-precision timestamp with seconds and nanoseconds
 * Used for tracking creation and update times of graph elements
 */
interface Timestamp {
    seconds: number;
    nanoseconds: number;
}
/**
 * Metadata about the creator/source of a graph noun
 * Tracks which augmentation and model created the element
 */
interface CreatorMetadata {
    augmentation: string;
    version: string;
}
/**
 * Base interface for nodes (nouns) in the graph
 * Represents entities like people, places, things, etc.
 */
export interface GraphNoun {
    id: string;
    createdBy: CreatorMetadata;
    noun: NounType;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    label?: string;
    data?: Record<string, any>;
    embeddedVerbs?: EmbeddedGraphVerb[];
    embedding?: number[];
}
/**
 * Base interface for edges (verbs) in the graph
 * Represents relationships between nouns
 */
export interface GraphVerb {
    id: string;
    source: string;
    target: string;
    label?: string;
    verb: VerbType;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    data?: Record<string, any>;
    embedding?: number[];
    confidence?: number;
    weight?: number;
}
/**
 * Version of GraphVerb for embedded relationships
 * Used when the source is implicit from the parent document
 */
export type EmbeddedGraphVerb = Omit<GraphVerb, 'source'>;
/**
 * Represents a person entity in the graph
 */
export interface Person extends GraphNoun {
    noun: typeof NounType.Person;
}
/**
 * Represents a physical location in the graph
 */
export interface Place extends GraphNoun {
    noun: typeof NounType.Place;
}
/**
 * Represents a physical or virtual object in the graph
 */
export interface Thing extends GraphNoun {
    noun: typeof NounType.Thing;
}
/**
 * Represents an event or occurrence in the graph
 */
export interface Event extends GraphNoun {
    noun: typeof NounType.Event;
}
/**
 * Represents an abstract concept or idea in the graph
 */
export interface Concept extends GraphNoun {
    noun: typeof NounType.Concept;
}
export interface Group extends GraphNoun {
    noun: typeof NounType.Group;
}
export interface List extends GraphNoun {
    noun: typeof NounType.List;
}
/**
 * Represents content (text, media, etc.) in the graph
 */
export interface Content extends GraphNoun {
    noun: typeof NounType.Content;
}
/**
 * Defines valid noun types for graph entities
 * Used for categorizing different types of nodes
 */
export declare const NounType: {
    readonly Person: "person";
    readonly Place: "place";
    readonly Thing: "thing";
    readonly Event: "event";
    readonly Concept: "concept";
    readonly Content: "content";
    readonly Group: "group";
    readonly List: "list";
    readonly Category: "category";
};
export type NounType = (typeof NounType)[keyof typeof NounType];
/**
 * Defines valid verb types for relationships
 * Used for categorizing different types of connections
 */
export declare const VerbType: {
    readonly AttributedTo: "attributedTo";
    readonly Controls: "controls";
    readonly Created: "created";
    readonly Earned: "earned";
    readonly Owns: "owns";
    readonly MemberOf: "memberOf";
    readonly RelatedTo: "relatedTo";
    readonly WorksWith: "worksWith";
    readonly FriendOf: "friendOf";
    readonly ReportsTo: "reportsTo";
    readonly Supervises: "supervises";
    readonly Mentors: "mentors";
    readonly Follows: "follows";
    readonly Likes: "likes";
};
export type VerbType = (typeof VerbType)[keyof typeof VerbType];
export {};
//# sourceMappingURL=graphTypes.d.ts.map