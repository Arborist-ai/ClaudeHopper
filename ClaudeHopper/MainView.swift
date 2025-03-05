import SwiftUI

struct MainView: View {
    @EnvironmentObject var configManager: MCPConfigManager
    @EnvironmentObject var discoveryManager: ServerDiscoveryManager
    @EnvironmentObject var clipboardManager: ClipboardManager
    @EnvironmentObject var appDelegate: AppDelegate
    
    @AppStorage("condensedView") private var condensedView: Bool = false
    @State private var showSettings = false
    @State private var showAddServerSheet = false
    @State private var selectedServer: MCPServer? = nil
    @State private var showPasteNotification = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image("AppIcon")
                    .resizable()
                    .frame(width: 24, height: 24)
                
                Text("ClaudeHopper")
                    .font(.headline)
                
                Spacer()
                
                Button(action: {
                    showSettings.toggle()
                }) {
                    Image(systemName: "gear")
                        .font(.system(size: 14))
                }
                .buttonStyle(PlainButtonStyle())
                .popover(isPresented: $showSettings) {
                    SettingsView()
                        .frame(width: 300, height: 400)
                }
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // Configuration Path Warning
            if configManager.configPath == nil {
                VStack {
                    Text("Configuration file not found")
                        .font(.headline)
                        .foregroundColor(.red)
                        .padding(.top, 8)
                    
                    Text("Please select your Claude Desktop configuration file")
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    Button("Select Config File") {
                        appDelegate.showConfigFileDialog { url in
                            if let url = url {
                                configManager.setConfigPath(url)
                            }
                        }
                    }
                    .padding(.top, 4)
                    .padding(.bottom, 8)
                }
                .padding()
                .background(Color(NSColor.controlBackgroundColor).opacity(0.8))
            }
            
            // Clipboard Detection Banner
            if clipboardManager.hasDetectedServerConfig {
                ClipboardServerBanner(clipboardManager: clipboardManager, showNotification: $showPasteNotification)
                    .transition(.move(edge: .top))
            }
            
            // Error Message
            if let errorMessage = configManager.errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.horizontal)
                    .padding(.top, 4)
            }
            
            if let errorMessage = discoveryManager.errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.horizontal)
                    .padding(.top, 4)
            }
            
            // Content Area
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    // Active Servers Section
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Active Servers")
                                .font(.headline)
                            
                            Spacer()
                            
                            Button(action: {
                                condensedView.toggle()
                            }) {
                                Image(systemName: condensedView ? "list.bullet" : "list.dash")
                                    .font(.system(size: 12))
                            }
                            .buttonStyle(PlainButtonStyle())
                            .help(condensedView ? "Show details" : "Condensed view")
                        }
                        .padding(.horizontal)
                        
                        if configManager.servers.isEmpty {
                            Text("No servers configured")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding()
                        } else {
                            ForEach(configManager.servers) { server in
                                ActiveServerRow(server: server, condensedView: condensedView, onEdit: {
                                    selectedServer = server
                                })
                                    .environmentObject(configManager)
                            }
                        }
                    }
                    
                    Divider()
                        .padding(.vertical, 4)
                    
                    // Available Servers Section
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Available Servers")
                                .font(.headline)
                            
                            Spacer()
                            
                            // Refresh button
                            Button(action: {
                                discoveryManager.discoverServers()
                            }) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 12))
                            }
                            .buttonStyle(PlainButtonStyle())
                            .disabled(discoveryManager.isDiscovering)
                            .help("Refresh available servers")
                        }
                        .padding(.horizontal)
                        
                        // Discovery progress indicator
                        if discoveryManager.isDiscovering {
                            HStack {
                                ProgressView()
                                    .scaleEffect(0.5)
                                
                                Text("Discovering servers...")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            .padding(.horizontal)
                        } else if let lastDiscovery = discoveryManager.lastDiscoveryTime {
                            Text("Last updated: \(formattedDate(lastDiscovery))")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding(.horizontal)
                        }
                        
                        // Available servers list
                        let availableServers = discoveryManager.filterAvailableServers(configuredServers: configManager.servers)
                        
                        if availableServers.isEmpty {
                            Text(discoveryManager.isDiscovering ? "Discovering..." : "No additional servers available")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding()
                        } else {
                            ForEach(availableServers) { server in
                                AvailableServerRow(server: server, condensedView: condensedView)
                                    .environmentObject(configManager)
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            
            Divider()
            
            // Footer
            HStack {
                Button(action: {
                    showAddServerSheet = true
                }) {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add Custom Server")
                            .font(.caption)
                    }
                }
                .buttonStyle(PlainButtonStyle())
                .help("Add a custom MCP server")
                
                Spacer()
                
                if let configPath = configManager.configPath {
                    Text(configPath.lastPathComponent)
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(Color(NSColor.controlBackgroundColor))
        }
        .frame(width: 320, height: 480)
        .sheet(isPresented: $showAddServerSheet) {
            ServerVerificationView(showSheet: $showAddServerSheet, server: MCPServer(name: "", command: "", args: [], enabled: true))
                .environmentObject(configManager)
        }
        .sheet(item: $selectedServer) { server in
            ServerVerificationView(showSheet: .constant(true), server: server, isEditing: true, onDismiss: {
                selectedServer = nil
            })
                .environmentObject(configManager)
        }
        .onAppear {
            // Set up clipboard manager with config manager
            clipboardManager.setConfigManager(configManager)
        }
        .overlay(alignment: .top) {
            if showPasteNotification {
                VStack {
                    Text("Server added!")
                        .font(.callout)
                        .padding(8)
                        .background(Color.green.opacity(0.8))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .padding(.top, 60)
                .transition(.move(edge: .top).combined(with: .opacity))
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        withAnimation {
                            showPasteNotification = false
                        }
                    }
                }
            }
        }
        .animation(.default, value: clipboardManager.hasDetectedServerConfig)
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Clipboard Server Banner
struct ClipboardServerBanner: View {
    @ObservedObject var clipboardManager: ClipboardManager
    @Binding var showNotification: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "clipboard")
                    .foregroundColor(.blue)
                
                Text("MCP Server Detected in Clipboard")
                    .font(.callout.bold())
                
                Spacer()
                
                Button(action: {
                    clipboardManager.clearDetectedServer()
                }) {
                    Image(systemName: "xmark")
                        .font(.caption)
                }
                .buttonStyle(PlainButtonStyle())
            }
            
            if let server = clipboardManager.detectedServer {
                Text("Name: \(server.name)")
                    .font(.caption)
                
                HStack {
                    Button(action: {
                        let success = clipboardManager.importDetectedServer()
                        if success {
                            showNotification = true
                        }
                    }) {
                        Text("Add to Configuration")
                            .font(.caption)
                    }
                    .buttonStyle(BorderlessButtonStyle())
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(8)
        .padding(.horizontal)
    }
}

// MARK: - Active Server Row
struct ActiveServerRow: View {
    @EnvironmentObject var configManager: MCPConfigManager
    
    let server: MCPServer
    let condensedView: Bool
    var onEdit: () -> Void
    
    @State private var showContextMenu = false
    
    var body: some View {
        HStack {
            // Toggle switch for enabling/disabling
            Toggle("", isOn: Binding(
                get: { server.enabled },
                set: { newValue in
                    // Create a copy with the updated enabled state
                    var updatedServer = server
                    updatedServer.enabled = newValue
                    
                    // If enabling a disabled server, also undisable it
                    if newValue && server.disabled {
                        updatedServer.disabled = false
                        updatedServer.name = server.isCommented ? server.uncommentedName : server.name
                    }
                    
                    // Find and update the server in the list
                    if let index = configManager.servers.firstIndex(where: { $0.name == server.name }) {
                        configManager.servers[index] = updatedServer
                        configManager.objectWillChange.send()
                        configManager.saveConfiguration()
                    }
                }
            ))
            .toggleStyle(SwitchToggleStyle())
            .disabled(server.disabled || server.isCommented)
            
            // Server name and details
            VStack(alignment: .leading) {
                Text(server.isCommented ? server.uncommentedName : server.name)
                    .strikethrough(server.disabled || server.isCommented)
                    .foregroundColor(server.disabled || server.isCommented ? .gray : .primary)
                
                if !condensedView, let description = server.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                if !condensedView {
                    Text("\(server.command) \(server.args.joined(separator: " "))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Context menu button
            Button(action: {
                showContextMenu = true
            }) {
                Image(systemName: "ellipsis")
                    .font(.system(size: 12))
            }
            .buttonStyle(PlainButtonStyle())
            .popover(isPresented: $showContextMenu) {
                VStack(alignment: .leading, spacing: 8) {
                    Button(action: {
                        showContextMenu = false
                        onEdit()
                    }) {
                        Label("Edit Server", systemImage: "pencil")
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: {
                        configManager.toggleServerDisabled(server)
                        showContextMenu = false
                    }) {
                        if server.disabled || server.isCommented {
                            Label("Enable Server", systemImage: "checkmark.circle")
                        } else {
                            Label("Disable Server", systemImage: "slash.circle")
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Divider()
                    
                    Button(action: {
                        configManager.removeServer(server)
                        showContextMenu = false
                    }) {
                        Label("Remove Server", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding()
                .frame(width: 180)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
        .contextMenu {
            Button(action: {
                onEdit()
            }) {
                Label("Edit Server", systemImage: "pencil")
            }
            
            Button(action: {
                configManager.toggleServerDisabled(server)
            }) {
                if server.disabled || server.isCommented {
                    Label("Enable Server", systemImage: "checkmark.circle")
                } else {
                    Label("Disable Server", systemImage: "slash.circle")
                }
            }
            
            Divider()
            
            Button(action: {
                configManager.removeServer(server)
            }) {
                Label("Remove Server", systemImage: "trash")
                    .foregroundColor(.red)
            }
        }
    }
}

// MARK: - Available Server Row
struct AvailableServerRow: View {
    @EnvironmentObject var configManager: MCPConfigManager
    
    let server: MCPServer
    let condensedView: Bool
    
    @State private var showVerification = false
    
    var body: some View {
        HStack {
            // Server name and details
            VStack(alignment: .leading) {
                Text(server.name)
                
                if !condensedView, let description = server.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            // Add button
            Button(action: {
                showVerification = true
            }) {
                Text("Add")
                    .font(.caption)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
        .sheet(isPresented: $showVerification) {
            ServerVerificationView(showSheet: $showVerification, server: server)
                .environmentObject(configManager)
        }
    }
}
