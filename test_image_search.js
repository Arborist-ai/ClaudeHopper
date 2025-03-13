#!/usr/bin/env node

// Simple test script to verify image search functionality
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the database path from command line or use default
const args = process.argv.slice(2);
const databasePath = args[0] || './Database';

// Path to the ClaudeHopper server
const serverPath = path.join(__dirname, 'dist', 'index.js');

if (!fs.existsSync(serverPath)) {
  console.error(`Server not found at ${serverPath}. Make sure you've built the project.`);
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
    name: "Lift station specific query",
    query: {
      description: "lift station lower level concrete foundation with dimensions",
      discipline: "Structural"
    }
  }
];

// Start the server
const server = spawn('node', [serverPath, databasePath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  // This would normally be JSON responses from the server
  try {
    const response = JSON.parse(data.toString());
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    console.log('Server output:', data.toString());
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Wait for server to start
setTimeout(() => {
  // Run each test query
  queries.forEach((testCase, index) => {
    console.log(`\n===== Running Test ${index + 1}: ${testCase.name} =====`);
    console.log('Query:', JSON.stringify(testCase.query, null, 2));
    
    // Send image search request to the server
    const request = {
      jsonrpc: "2.0",
      method: "call_tool",
      params: {
        name: "image_search",
        arguments: testCase.query
      },
      id: index + 1
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
  });
  
  // Close the server after all queries
  setTimeout(() => {
    console.log('\nTests completed. Shutting down server...');
    server.kill();
  }, 5000);
}, 2000);

// Handle server exit
server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});
