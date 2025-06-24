export interface TensorflowModel {
    load(): Promise<any>;
    embed(data: string[]): any;
    dispose(): void;
}
export declare const tensorflowModelsLoaded = true;
//# sourceMappingURL=tensorflowTypes.d.ts.map