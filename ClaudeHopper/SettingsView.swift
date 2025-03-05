import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var configManager: MCPConfigManager
    @EnvironmentObject var discoveryManager: ServerDiscoveryManager
    @EnvironmentObject var appDelegate: AppDelegate
    
    @AppStorage("condensedView") private var condensedView: Bool = false
    @AppStorage("checkForServersOnStartup") private var checkForServersOnStartup: Bool = true
    
    @State private var showImportDialog = false
    @State private var showExportDialog = false
    @State private var showBackupDialog = false
    @State private var showRestoreDialog = false
    @State private var showConfigPathDialog = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Settings")
                .font(.headline)
            
            Divider()
            
            // Display options
            VStack(alignment: .leading, spacing: 8) {
                Text("Display Options")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Toggle("Condensed View", isOn: $condensedView)
                    .toggleStyle(SwitchToggleStyle())
                
                Toggle("Check for New Servers on Startup", isOn: $checkForServersOnStartup)
                    .toggleStyle(SwitchToggleStyle())
            }
            
            Divider()
            
            // Configuration
            VStack(alignment: .leading, spacing: 8) {
                Text("Configuration")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                if let configPath = configManager.configPath {
                    HStack {
                        Text("Config File:")
                            .font(.caption)
                        
                        Text(configPath.path)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                } else {
                    Text("No configuration file selected")
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                Button("Change Configuration Path") {
                    showConfigPathDialog = true
                }
                .buttonStyle(PlainButtonStyle())
            }
            
            Divider()
            
            // Import/Export
            VStack(alignment: .leading, spacing: 8) {
                Text("Import/Export")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                HStack {
                    Button("Import Servers") {
                        showImportDialog = true
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Spacer()
                    
                    Button("Export Servers") {
                        showExportDialog = true
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(configManager.servers.isEmpty)
                }
                
                HStack {
                    Button("Backup Configuration") {
                        showBackupDialog = true
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(configManager.configPath == nil)
                    
                    Spacer()
                    
                    Button("Restore Configuration") {
                        showRestoreDialog = true
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(configManager.configPath == nil)
                }
            }
            
            Spacer()
            
            // About
            VStack(alignment: .center, spacing: 4) {
                Text("ClaudeHopper")
                    .font(.headline)
                
                Text("Version 1.0.0")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Link("GitHub Repository", destination: URL(string: "https://github.com/Arborist-ai/ClaudeHopper")!)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .onChange(of: showConfigPathDialog) { isShowing in
            if isShowing {
                appDelegate.showConfigFileDialog { url in
                    if let url = url {
                        configManager.setConfigPath(url)
                    }
                    showConfigPathDialog = false
                }
            }
        }
        .onChange(of: showImportDialog) { isShowing in
            if isShowing {
                let openPanel = NSOpenPanel()
                openPanel.allowsMultipleSelection = false
                openPanel.canChooseDirectories = false
                openPanel.canChooseFiles = true
                openPanel.allowedFileTypes = ["json"]
                openPanel.prompt = "Import Servers"
                
                openPanel.begin { result in
                    if result == .OK, let url = openPanel.url {
                        configManager.importConfiguration(from: url)
                    }
                    showImportDialog = false
                }
            }
        }
        .onChange(of: showExportDialog) { isShowing in
            if isShowing {
                appDelegate.showSaveFileDialog(
                    title: "Export Servers",
                    defaultName: "claudehopper_servers.json"
                ) { url in
                    if let url = url {
                        configManager.exportConfiguration(to: url)
                    }
                    showExportDialog = false
                }
            }
        }
        .onChange(of: showBackupDialog) { isShowing in
            if isShowing {
                appDelegate.showSaveFileDialog(
                    title: "Backup Configuration",
                    defaultName: "claude_desktop_config_backup.json"
                ) { url in
                    if let url = url {
                        configManager.backupConfiguration(to: url)
                    }
                    showBackupDialog = false
                }
            }
        }
        .onChange(of: showRestoreDialog) { isShowing in
            if isShowing {
                let openPanel = NSOpenPanel()
                openPanel.allowsMultipleSelection = false
                openPanel.canChooseDirectories = false
                openPanel.canChooseFiles = true
                openPanel.allowedFileTypes = ["json"]
                openPanel.prompt = "Restore Configuration"
                
                openPanel.begin { result in
                    if result == .OK, let url = openPanel.url {
                        configManager.restoreConfiguration(from: url)
                    }
                    showRestoreDialog = false
                }
            }
        }
    }
}
