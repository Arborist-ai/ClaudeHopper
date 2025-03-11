#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { connectToLanceDB, closeLanceDB } from "./lancedb/client.js";
import { ToolRegistry } from "./tools/registry.js";
import * as defaults from './config.js'

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a LanceDB database URI");
  process.exit(1);
}
const databaseUrl = args[0];

const toolRegistry = new ToolRegistry();

const server = new Server(
  {
    name: "lance-mcp",
    version: "0.2.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {
        list: true,
        call: true,
      },
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolRegistry.getToolSchemas(),
  _meta: {},
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  try {
    console.error(`Executing tool: ${name}`);
    console.error(`Arguments: ${JSON.stringify(args, null, 2)}`);

    const tool = toolRegistry.getTool(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const result = await tool.execute(args);
    return result;
  } catch (error) {
    console.error("Operation failed:", error);
    return {
        content: [
          {
            type: "text",
            text: error.message,
          },
        ],
        isError: true,
    };
  }
});

async function runServer() {
  try {
    await connectToLanceDB(databaseUrl, defaults.CHUNKS_TABLE_NAME, defaults.CATALOG_TABLE_NAME);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("LanceDB MCP server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  try {
    await closeLanceDB();
  } finally {
    process.exit(0);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

runServer().catch(console.error);
