import { chunksVectorStore } from "../../lancedb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ChunksSearchParams extends ToolParams {
  text: string;
  source?: string;
  project?: string;
  discipline?: string;
  drawingNumber?: string;
  drawingType?: string;
  phase?: string;
}

export class ChunksSearchTool extends BaseTool<ChunksSearchParams> {
  name = "chunks_search";
  description = "Search for relevant document chunks in the vector store with metadata filtering";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search string",
      },
      source: {
        type: "string",
        description: "Source document path to filter the search",
      },
      project: {
        type: "string",
        description: "Project name to filter results by",
      },
      discipline: {
        type: "string",
        description: "Discipline (Structural, Civil, etc.) to filter results by",
      },
      drawingNumber: {
        type: "string",
        description: "Drawing number to filter results by",
      },
      drawingType: {
        type: "string",
        description: "Drawing type (Plan, Elevation, etc.) to filter results by",
      },
      phase: {
        type: "string",
        description: "Project phase to filter results by",
      }
    },
    required: ["text"],
  };

  async execute(params: ChunksSearchParams) {
    try {
      const retriever = chunksVectorStore.asRetriever();
      const results = await retriever.invoke(params.text);

      // Apply all metadata filters
      const filteredResults = results.filter((result: any) => {
        // Check if result has metadata
        if (!result.metadata) return false;
        
        // Apply each filter if provided
        if (params.source && result.metadata.source !== params.source) return false;
        if (params.project && result.metadata.project !== params.project) return false;
        if (params.discipline && result.metadata.discipline !== params.discipline) return false;
        if (params.drawingNumber && result.metadata.drawingNumber !== params.drawingNumber) return false;
        if (params.drawingType && result.metadata.drawingType !== params.drawingType) return false;
        if (params.phase && result.metadata.phase !== params.phase) return false;
        
        // All filters passed
        return true;
      });

      return {
        content: [
          { 
            type: "text" as const, 
            text: JSON.stringify(filteredResults, null, 2) 
          },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
