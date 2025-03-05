import SwiftUI

struct ServerVerificationView: View {
    @EnvironmentObject var configManager: MCPConfigManager
    @Binding var showSheet: Bool
    @State var server: MCPServer
    var isEditing: Bool = false
    var onDismiss: (() -> Void)? = nil
    
    @State private var showFolderPicker = false
    @State private var errorMessage: String?
    @State private var selectedFolder: URL?
    @State private var apiToken: String = ""
    @State private var serverType: ServerType = .generic
    
    enum ServerType: String, CaseIterable, Identifiable {
        case generic = "Generic"
        case filesystem = "Filesystem"
        case github = "GitHub"
        
        var id: String { self.rawValue }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            Text(isEditing ? "Edit Server" : "Add Server")
                .font(.headline)
            
            Divider()
            
            // Server type picker (only for new servers)
            if !isEditing {
                Picker("Server Type", selection: $serverType) {
                    ForEach(ServerType.allCases) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .onChange(of: serverType) { newValue in
                    updateServerForType(newValue)
                }
            }
            
            // Server name
            VStack(alignment: .leading) {
                Text("Server Name")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                TextField("Server name", text: $server.name)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Command
            VStack(alignment: .leading) {
                Text("Command")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                TextField("Command (e.g., npx)", text: $server.command)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Arguments
            VStack(alignment: .leading) {
                Text("Arguments")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if serverType == .filesystem {
                    HStack {
                        TextField("Arguments", text: Binding(
                            get: { server.args.joined(separator: " ") },
                            set: { newValue in 
                                server.args = newValue.split(separator: " ").map(String.init)
                            }
                        ))
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        Button("Browse") {
                            showFolderPicker = true
                        }
                        .fileImporter(
                            isPresented: $showFolderPicker,
                            allowedContentTypes: [.folder],
                            allowsMultipleSelection: false
                        ) { result in
                            switch result {
                            case .success(let urls):
                                if let url = urls.first {
                                    selectedFolder = url
                                    
                                    // Update the arguments to include the folder path
                                    let baseArgs = ["-y", "@modelcontextprotocol/server-filesystem"]
                                    server.args = baseArgs + [url.path]
                                }
                            case .failure(let error):
                                errorMessage = "Error selecting folder: \(error.localizedDescription)"
                            }
                        }
                    }
                    
                    if let selectedFolder = selectedFolder {
                        Text("Selected: \(selectedFolder.lastPathComponent)")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                } else if serverType == .github {
                    VStack(alignment: .leading, spacing: 8) {
                        TextField("Arguments", text: Binding(
                            get: { server.args.joined(separator: " ") },
                            set: { newValue in 
                                server.args = newValue.split(separator: " ").map(String.init)
                            }
                        ))
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        Divider()
                        
                        Text("GitHub API Token")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        SecureField("Personal Access Token", text: $apiToken)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        Text("The token will be stored in the Claude Desktop configuration.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    TextField("Arguments", text: Binding(
                        get: { server.args.joined(separator: " ") },
                        set: { newValue in 
                            server.args = newValue.split(separator: " ").map(String.init)
                        }
                    ))
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                }
            }
            
            // Description
            VStack(alignment: .leading) {
                Text("Description (optional)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                TextField("Server description", text: Binding(
                    get: { server.description ?? "" },
                    set: { server.description = $0.isEmpty ? nil : $0 }
                ))
                .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Error message
            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            
            Spacer()
            
            // Action buttons
            HStack {
                Button("Cancel") {
                    showSheet = false
                    onDismiss?() // Call the dismiss callback if provided
                }
                
                Spacer()
                
                Button(isEditing ? "Update" : "Add") {
                    if validateServer() {
                        if isEditing {
                            // Update existing server
                            if let index = configManager.servers.firstIndex(where: { $0.name == server.name }) {
                                configManager.servers[index] = server
                                configManager.objectWillChange.send()
                                configManager.saveConfiguration()
                            }
                        } else {
                            // Add new server
                            configManager.addServer(server)
                        }
                        showSheet = false
                        onDismiss?() // Call the dismiss callback if provided
                    }
                }
                .disabled(!isValidServer())
            }
        }
        .padding()
        .frame(width: 400, height: 500)
        .onAppear {
            // Initialize the server type based on the server name or command
            if server.name.contains("filesystem") || server.command.contains("filesystem") {
                serverType = .filesystem
            } else if server.name.contains("github") || server.command.contains("github") {
                serverType = .github
                
                // Parse API token from environment if present
                if let envIndex = server.args.firstIndex(where: { $0.contains("GITHUB_PERSONAL_ACCESS_TOKEN") }) {
                    let envStr = server.args[envIndex]
                    if let tokenStartIndex = envStr.firstIndex(of: "=") {
                        let tokenSubstring = envStr[envStr.index(after: tokenStartIndex)...]
                        apiToken = String(tokenSubstring)
                    }
                }
            }
        }
    }
    
    private func updateServerForType(_ type: ServerType) {
        switch type {
        case .filesystem:
            server.name = "filesystem"
            server.command = "npx"
            server.args = ["-y", "@modelcontextprotocol/server-filesystem"]
            server.description = "Access files on your computer"
        case .github:
            server.name = "github"
            server.command = "npx"
            server.args = ["-y", "@modelcontextprotocol/server-github"]
            server.description = "GitHub integration"
        case .generic:
            server.name = ""
            server.command = "npx"
            server.args = ["-y"]
            server.description = ""
        }
    }
    
    private func isValidServer() -> Bool {
        return !server.name.isEmpty && !server.command.isEmpty
    }
    
    private func validateServer() -> Bool {
        // Basic validation
        if server.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errorMessage = "Server name is required"
            return false
        }
        
        if server.command.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errorMessage = "Command is required"
            return false
        }
        
        // Specific validation for server types
        if serverType == .filesystem {
            if server.args.count < 3 || !server.args[2].hasPrefix("/") {
                errorMessage = "Please select a folder for the filesystem server"
                return false
            }
        } else if serverType == .github && !apiToken.isEmpty {
            // Add environment variables for GitHub token
            server.args.append("--env.GITHUB_PERSONAL_ACCESS_TOKEN=\(apiToken)")
        }
        
        return true
    }
}
