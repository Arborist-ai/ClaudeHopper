import Foundation

/// Model representing an MCP server configuration
struct MCPServer: Identifiable, Equatable, Codable {
    var id: String { name }
    var name: String
    var command: String
    var args: [String]
    var enabled: Bool
    var disabled: Bool = false  // When true, server is preserved but disabled in config
    var description: String?
    
    // Additional properties that aren't persisted but used for UI
    var isExpanded: Bool = false
    
    // Computed property to check if the server is commented out
    var isCommented: Bool {
        return name.hasPrefix("// ")
    }
    
    // Computed property to get the uncommented name
    var uncommentedName: String {
        if isCommented {
            return String(name.dropFirst(3))
        }
        return name
    }
    
    // Function to comment/uncomment a server name
    func withCommentStatus(commented: Bool) -> MCPServer {
        var serverCopy = self
        if commented && !isCommented {
            serverCopy.name = "// " + name
            serverCopy.enabled = false
        } else if !commented && isCommented {
            serverCopy.name = uncommentedName
        }
        return serverCopy
    }
    
    static func == (lhs: MCPServer, rhs: MCPServer) -> Bool {
        return lhs.name == rhs.name
    }
}

/// Configuration structure that matches Claude Desktop's JSON format
struct MCPConfiguration: Codable {
    var mcpServers: [String: ServerConfig]
    var otherSettings: [String: AnyCodable]? = nil
    
    struct ServerConfig: Codable {
        var command: String
        var args: [String]
        var env: [String: String]?
    }
    
    init(servers: [MCPServer]) {
        // Convert our internal model to the format Claude Desktop expects
        var mcpServers = [String: ServerConfig]()
        
        for server in servers {
            // Skip disabled or commented servers
            if server.disabled || server.isCommented {
                continue
            }
            
            // Only include enabled servers
            if server.enabled {
                mcpServers[server.name] = ServerConfig(
                    command: server.command,
                    args: server.args,
                    env: nil
                )
            }
        }
        
        self.mcpServers = mcpServers
    }
    
    // This initializer is used when loading from a file
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.mcpServers = try container.decode([String: ServerConfig].self, forKey: .mcpServers)
        
        // For other settings, we need to handle them as AnyCodable
        var otherSettings = [String: AnyCodable]()
        let allKeys = container.allKeys
        
        for key in allKeys {
            if key != .mcpServers {
                let value = try container.decode(AnyCodable.self, forKey: key)
                otherSettings[key.stringValue] = value
            }
        }
        
        if !otherSettings.isEmpty {
            self.otherSettings = otherSettings
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(mcpServers, forKey: .mcpServers)
        
        // Encode other settings if they exist
        if let otherSettings = otherSettings {
            for (key, value) in otherSettings {
                if let codingKey = CodingKeys(stringValue: key) {
                    try container.encode(value, forKey: codingKey)
                }
            }
        }
    }
    
    private enum CodingKeys: String, CodingKey {
        case mcpServers
        
        // Support for dynamic keys
        init?(stringValue: String) {
            if stringValue == "mcpServers" {
                self = .mcpServers
            } else {
                return nil
            }
        }
        
        var stringValue: String {
            switch self {
            case .mcpServers:
                return "mcpServers"
            }
        }
        
        init?(intValue: Int) {
            return nil
        }
        
        var intValue: Int? {
            return nil
        }
    }
}

/// AnyCodable type for handling heterogeneous values in the configuration file
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            self.value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            self.value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "AnyCodable cannot decode value"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch self.value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            throw EncodingError.invalidValue(
                self.value,
                EncodingError.Context(
                    codingPath: container.codingPath,
                    debugDescription: "AnyCodable cannot encode value"
                )
            )
        }
    }
}
