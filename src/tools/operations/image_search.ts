/**
 * Image search tool for construction drawings
 * 
 * This tool allows searching for similar images across
 * the drawing collection using text-to-image matching.
 */

import { BaseTool, ToolParams } from "../base/tool.js";
import { imageVectorStore } from "../../lancedb/client.js";
import path from 'path';
import fs from 'fs';
import { OllamaEmbeddings } from "@langchain/ollama";
import * as defaults from '../../config.js';

export interface ImageSearchParams extends ToolParams {
  description: string;        // Textual description of what to search for
  source?: string;           // Optional source document to filter by
  project?: string;          // Optional project filter
  discipline?: string;       // Optional discipline filter
  drawingType?: string;      // Optional drawing type filter
}

export class ImageSearchTool extends BaseTool<ImageSearchParams> {
  name = "image_search";
  description = "Search for similar images across drawing files";
  inputSchema = {
    type: "object" as const,
    properties: {
      description: {
        type: "string",
        description: "Textual description of what to search for",
      },
      source: {
        type: "string",
        description: "Source document to limit the search",
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
      }
    },
    required: ["description"],
  };

  async execute(params: ImageSearchParams) {
    try {
      if (!imageVectorStore) {
        return {
          content: [
            { 
              type: "text" as const, 
              text: "Image search is not available. The image database has not been initialized.\n\n" +
                    "Please ensure that image extraction is enabled in the configuration and that " +
                    "the database has been seeded with images."
            },
          ],
          isError: true,
        };
      }

      // Use the CLIP model to generate embeddings for the text description
      const imageEmbeddings = new OllamaEmbeddings({model: defaults.IMAGE_EMBEDDING_MODEL});
      const queryEmbedding = await imageEmbeddings.embedQuery(params.description);
      
      // Search the image vector store
      const retriever = imageVectorStore.asRetriever();
      const results = await retriever.invoke(params.description);
      
      // Apply metadata filters if provided
      const filteredResults = results.filter((result: any) => {
        // Check if result has metadata
        if (!result.metadata) return false;
        
        // Apply each filter if provided
        if (params.source && result.metadata.source !== params.source) return false;
        if (params.project && result.metadata.project !== params.project) return false;
        if (params.discipline && result.metadata.discipline !== params.discipline) return false;
        if (params.drawingType && result.metadata.drawingType !== params.drawingType) return false;
        
        // All filters passed
        return true;
      });

      // Format the response with images and metadata
      const formattedResults = filteredResults.map((result: any) => {
        return {
          imagePath: result.metadata.imagePath,
          source: result.metadata.source,
          page: result.metadata.page || 1,
          project: result.metadata.project,
          discipline: result.metadata.discipline,
          drawingNumber: result.metadata.drawingNumber,
          drawingType: result.metadata.drawingType,
          similarity: result.metadata.hasOwnProperty('_distance') ? (1 - result.metadata._distance).toFixed(2) : 'N/A'
        };
      });
      
      if (formattedResults.length === 0) {
        return {
          content: [
            { 
              type: "text" as const, 
              text: `No matching images found for description: "${params.description}". Try a different description or check your filters.`
            },
          ],
          isError: false,
        };
      }

      return {
        content: [
          { 
            type: "text" as const, 
            text: JSON.stringify(formattedResults, null, 2)
          },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
