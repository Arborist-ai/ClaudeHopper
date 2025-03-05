import Foundation
import Combine

class ServerDiscoveryManager: ObservableObject {
    @Published var availableServers: [MCPServer] = []
    @Published var isDiscovering: Bool = false
    @Published var errorMessage: String?
    @Published var lastDiscoveryTime: Date?
    
    private var cancellables = Set<AnyCancellable>()
    private let cacheKey = "discoveredServersCache"
    private let cacheExpirationHours = 24.0 // Cache for 24 hours
    
    init() {
        loadCachedServers()
    }
    
    /// Load the cached servers from UserDefaults
    private func loadCachedServers() {
        guard let cachedData = UserDefaults.standard.data(forKey: cacheKey),
              let cacheTime = UserDefaults.standard.object(forKey: "\(cacheKey)_time") as? Date else {
            // No cache or cache time, perform discovery
            discoverServers()
            return
        }
        
        // Check if cache is expired
        let hoursElapsed = Date().timeIntervalSince(cacheTime) / 3600
        if hoursElapsed > cacheExpirationHours {
            // Cache expired, perform discovery
            discoverServers()
            return
        }
        
        // Load from cache
        do {
            let decoder = JSONDecoder()
            let cachedServers = try decoder.decode([MCPServer].self, from: cachedData)
            self.availableServers = cachedServers
            self.lastDiscoveryTime = cacheTime
        } catch {
            print("Failed to decode cached servers: \(error)")
            discoverServers()
        }
    }
    
    /// Save the discovered servers to the cache
    private func saveServersToCache() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(availableServers)
            UserDefaults.standard.set(data, forKey: cacheKey)
            UserDefaults.standard.set(Date(), forKey: "\(cacheKey)_time")
        } catch {
            print("Failed to cache servers: \(error)")
        }
    }
    
    /// Discover available MCP servers
    func discoverServers() {
        isDiscovering = true
        errorMessage = nil
        
        // Define sources for server discovery
        let sources = [
            "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/package.json",
            "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/package.json"
        ]
        
        var discoveredServers: [MCPServer] = []
        let group = DispatchGroup()
        
        for source in sources {
            group.enter()
            
            // Create URL request for the source
            guard let url = URL(string: source) else {
                group.leave()
                continue
            }
            
            URLSession.shared.dataTaskPublisher(for: url)
                .map { $0.data }
                .decode(type: PackageJSON.self, decoder: JSONDecoder())
                .receive(on: DispatchQueue.main)
                .sink(receiveCompletion: { completion in
                    switch completion {
                    case .finished:
                        break
                    case .failure(let error):
                        print("Failed to fetch from \(source): \(error)")
                    }
                    group.leave()
                }, receiveValue: { packageJSON in
                    // Extract server info from the package.json
                    if let dependencies = packageJSON.dependencies {
                        for (name, version) in dependencies {
                            if name.contains("server") {
                                let serverName = name.replacingOccurrences(of: "@modelcontextprotocol/server-", with: "")
                                
                                // Create a server object
                                let server = MCPServer(
                                    name: serverName,
                                    command: "npx",
                                    args: ["-y", name],
                                    enabled: false,
                                    description: "Official MCP server: \(serverName)"
                                )
                                
                                // Add to discovered servers if not already present
                                if !discoveredServers.contains(where: { $0.name == server.name }) {
                                    discoveredServers.append(server)
                                }
                            }
                        }
                    }
                })
                .store(in: &cancellables)
        }
        
        // After all sources have been processed
        group.notify(queue: .main) { [weak self] in
            guard let self = self else { return }
            
            // Add some manually known community servers
            let communityServers = [
                MCPServer(
                    name: "filesystem",
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
                    enabled: false,
                    description: "Access files on your computer"
                ),
                MCPServer(
                    name: "github",
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-github"],
                    enabled: false,
                    description: "Interact with GitHub repositories"
                ),
                MCPServer(
                    name: "brave-search",
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-brave-search"],
                    enabled: false,
                    description: "Search the web using Brave Search"
                ),
                MCPServer(
                    name: "postgres",
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://username:password@localhost/dbname"],
                    enabled: false,
                    description: "Access PostgreSQL databases"
                )
            ]
            
            // Add community servers that aren't already discovered
            for server in communityServers {
                if !discoveredServers.contains(where: { $0.name == server.name }) {
                    discoveredServers.append(server)
                }
            }
            
            self.availableServers = discoveredServers.sorted(by: { $0.name < $1.name })
            self.isDiscovering = false
            self.lastDiscoveryTime = Date()
            
            // Cache the discovered servers
            self.saveServersToCache()
        }
    }
    
    /// Filter out servers that are already in the configuration
    func filterAvailableServers(configuredServers: [MCPServer]) -> [MCPServer] {
        let configuredNames = Set(configuredServers.map { $0.uncommentedName })
        return availableServers.filter { !configuredNames.contains($0.name) }
    }
}

// MARK: - Models for parsing package.json
struct PackageJSON: Codable {
    var dependencies: [String: String]?
}
