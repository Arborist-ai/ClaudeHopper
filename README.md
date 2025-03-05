# ClaudeHopper

A macOS menu bar application that helps manage MCP (Model Context Protocol) servers for Claude Desktop.

<p align="center">
  <img src="screenshots/claudehopper-icon.png" width="150" alt="ClaudeHopper Icon">
</p>

## Overview

ClaudeHopper provides a simple, intuitive interface for managing MCP servers that extend Claude Desktop's capabilities. With ClaudeHopper, you can:

- Toggle servers on/off directly from your menu bar
- Discover available MCP servers from authoritative sources
- Fetch up-to-date configurations for servers
- Manually add custom servers
- Check for new servers periodically
- Import server configurations directly from clipboard

## Features

- **Server Management**: Enable, disable, add, and remove MCP servers from your Claude Desktop configuration
- **Real Server Discovery**: Fetch available servers from the official MCP servers repository
- **Clipboard Monitoring**: Automatically detect and import server configurations copied from websites
- **Configuration Backups**: Easily backup and restore your server configurations
- **User-Friendly Interface**: Simple menu bar app with intuitive controls

## What is MCP?

MCP (Model Context Protocol) standardizes how applications provide context to Large Language Models (LLMs). It allows Claude Desktop to access external tools like filesystem access, web search, and more through standardized server implementations.

## Getting Started

### Prerequisites

- macOS 11.0 or later
- [Claude Desktop](https://claude.ai/desktop) installed
- Node.js (for running MCP servers)

### Installation

1. Download the latest release of ClaudeHopper from the [Releases](https://github.com/Arborist-ai/ClaudeHopper/releases) page
2. Move ClaudeHopper.app to your Applications folder
3. Launch ClaudeHopper from your Applications folder
4. Click the ClaudeHopper icon in the menu bar to start managing your MCP servers

### Configuration

On first launch, ClaudeHopper will try to locate your Claude Desktop configuration file automatically. If it can't find it, you'll be prompted to select it manually.

The default location for Claude Desktop's configuration is:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Development

ClaudeHopper is written in Swift and SwiftUI. To build from source:

1. Clone this repository
2. Open the project in Xcode 14 or later
3. Build and run the project

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://anthropic.com) for creating Claude
- The [MCP Servers repository](https://github.com/modelcontextprotocol/servers) for providing standard server implementations
