import { chunksVectorStore } from "../../lancedb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface BroadSearchParams extends ToolParams {
  text: string;
  project?: string;
  discipline?: string;
  drawingType?: string;
  phase?: string;
}

export class BroadSearchTool extends BaseTool<BroadSearchParams> {
  name = "all_chunks_search";
  description = "Search for relevant document chunks across all documents with optional metadata filtering";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search string",
      },
      project: {
        type: "string",
        description: "Project name to filter results by",
      },
      discipline: {
        type: "string",
        description: "Discipline (Structural, Civil, etc.) to filter results by",
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

  async execute(params: BroadSearchParams) {
    try {
      const retriever = chunksVectorStore.asRetriever();
      const results = await retriever.invoke(params.text);

      // Apply metadata filters if provided
      if (params.project || params.discipline || params.drawingType || params.phase) {
        const filteredResults = results.filter((result: any) => {
          // Check if result has metadata
          if (!result.metadata) return false;
          
          // Apply each filter if provided
          if (params.project && result.metadata.project !== params.project) return false;
          if (params.discipline && result.metadata.discipline !== params.discipline) return false;
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
      }

      // Return all results if no filters applied
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
