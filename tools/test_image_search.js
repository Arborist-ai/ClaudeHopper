#!/usr/bin/env node

/**
 * Image Search Test Script
 * 
 * This script tests the image search functionality of ClaudeHopper
 * by sending a series of test queries and displaying the results.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Get the database path from command line or use default
const args = process.argv.slice(2);
const databasePath = args[0] || path.join(__dirname, '..', 'Database');

// Path to the ClaudeHopper server
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');

if (!fs.existsSync(serverPath)) {
  console.error(`${colors.fg.red}Server not found at ${serverPath}. Make sure you've built the project.${colors.reset}`);
  console.error(`Run ${colors.fg.yellow}npm run build${colors.reset} to build the project first.`);
  process.exit(1);
}

// Query examples to test
const queries = [
  {
    name: "Basic structural query",
    query: {
      description: "structural concrete foundation plan"
    }
  },
  {
    name: "Discipline filtered query",
    query: {
      description: "foundation plan",
      discipline: "Structural"
    }
  },
  {
    name: "Drawing type filtered query",
    query: {
      description: "building layout",
      drawingType: "PLAN"
    }
  },
  {
    name: "Specific project query",
    query: {
      description: "lift station details with dimensions",
      project: "PDFdrawings"
    }
  },
  {
    name: "Complex multi-filter query",
    query: {
      description: "foundation plan with dimensions showing concrete walls",
      discipline: "Structural",
      drawingType: "PLAN"
    }
  },
  {
    name: "Building area specific query",
    query: {
      description: "lift station 46 lower plan",
      buildingArea: "46"
    }
  }
];

// Parse server responses
function parseResponse(data) {
  try {
    const response = JSON.parse(data.toString());
    if (response.result && response.result.content && response.result.content[0]) {
      try {
        // Parse the text content which should be JSON
        const results = JSON.parse(response.result.content[0].text);
        return results;
      } catch (e) {
        // If not JSON, return the text
        return response.result.content[0].text;
      }
    }
    return response;
  } catch (e) {
    return data.toString();
  }
}

// Format results for display
function formatResults(results) {
  if (Array.isArray(results)) {
    if (results.length === 0) {
      return `${colors.fg.yellow}No results found${colors.reset}`;
    }
    
    return results.map((result, index) => {
      let output = `${colors.bright}${colors.fg.cyan}Result ${index + 1}:${colors.reset}\n`;
      output += `  ${colors.fg.green}Image:${colors.reset} ${result.imagePath}\n`;
      output += `  ${colors.fg.green}Source:${colors.reset} ${result.source}\n`;
      output += `  ${colors.fg.green}Drawing:${colors.reset} ${result.drawingNumber || 'N/A'}\n`;
      output += `  ${colors.fg.green}Discipline:${colors.reset} ${result.discipline || 'N/A'}\n`;
      output += `  ${colors.fg.green}Drawing Type:${colors.reset} ${result.drawingType || 'N/A'}\n`;
      output += `  ${colors.fg.green}Similarity:${colors.reset} ${result.similarity || 'N/A'}\n`;
      return output;
    }).join('\n');
  }
  
  return results;
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.fg.magenta}=== ClaudeHopper Image Search Tests ===${colors.reset}\n`);
  console.log(`${colors.fg.blue}Using database at:${colors.reset} ${databasePath}\n`);
  
  // Start the server
  console.log(`${colors.fg.yellow}Starting ClaudeHopper server...${colors.reset}`);
  const server = spawn('node', [serverPath, databasePath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Handle server errors
  server.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('LanceDB MCP server running on stdio')) {
      console.log(`${colors.fg.green}Server started successfully${colors.reset}\n`);
    } else if (!output.includes('[MCP]')) {
      // Filter out MCP debug messages
      console.error(`${colors.fg.red}Server error:${colors.reset}`, output);
    }
  });
  
  // Buffer to collect response data
  let responseBuffer = '';
  
  // Process server output
  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // Check if we have complete JSON objects (they end with newlines)
    const responses = responseBuffer.split('\n').filter(line => line.trim().length > 0);
    if (responses.length > 0) {
      // Process all complete responses
      for (let i = 0; i < responses.length - 1; i++) {
        try {
          const result = parseResponse(responses[i]);
          console.log(formatResults(result));
          console.log('\n' + '-'.repeat(80) + '\n');
        } catch (e) {
          console.error(`${colors.fg.red}Error parsing response:${colors.reset}`, e);
        }
      }
      
      // Keep any incomplete response in the buffer
      responseBuffer = responses[responses.length - 1];
    }
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run each test query sequentially
  for (let i = 0; i < queries.length; i++) {
    const testCase = queries[i];
    console.log(`${colors.bright}${colors.fg.yellow}Running Test ${i + 1}/${queries.length}: ${testCase.name}${colors.reset}`);
    console.log(`${colors.fg.blue}Query:${colors.reset}`, JSON.stringify(testCase.query, null, 2));
    
    // Send image search request to the server
    const request = {
      jsonrpc: "2.0",
      method: "call_tool",
      params: {
        name: "image_search",
        arguments: testCase.query
      },
      id: i + 1
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Process any remaining responses
  if (responseBuffer.trim().length > 0) {
    try {
      const result = parseResponse(responseBuffer);
      console.log(formatResults(result));
    } catch (e) {
      console.error(`${colors.fg.red}Error parsing final response:${colors.reset}`, e);
    }
  }
  
  // Close the server
  console.log(`\n${colors.fg.yellow}Tests completed. Shutting down server...${colors.reset}`);
  server.kill();
}

// Handle server exit
process.on('exit', () => {
  console.log(`\n${colors.fg.green}Test script completed.${colors.reset}`);
});

// Run the tests
runTests().catch(error => {
  console.error(`${colors.fg.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});
