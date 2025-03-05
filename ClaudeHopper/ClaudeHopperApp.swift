import SwiftUI

@main
struct ClaudeHopperApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        Settings {
            EmptyView()
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, ObservableObject {
    var statusItem: NSStatusItem?
    var popover: NSPopover?
    
    // ViewModels
    let configManager = MCPConfigManager()
    let discoveryManager = ServerDiscoveryManager()
    let clipboardManager = ClipboardManager()
    
    // Settings
    @AppStorage("condensedView") var condensedView: Bool = false
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create the status item
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem?.button {
            // Set the status item image
            let image = NSImage(named: "StatusBarIcon")
            button.image = image
            button.action = #selector(togglePopover)
            button.target = self
        }
        
        // Create the popover
        let popover = NSPopover()
        popover.contentSize = NSSize(width: 320, height: 480)
        popover.behavior = .transient
        
        // Set the content view
        let contentView = MainView()
            .environmentObject(configManager)
            .environmentObject(discoveryManager)
            .environmentObject(clipboardManager)
            .environmentObject(self)
        popover.contentViewController = NSHostingController(rootView: contentView)
        
        self.popover = popover
        
        // Monitor clipboard for MCP configurations
        clipboardManager.startMonitoring()
    }
    
    @objc func togglePopover() {
        if let popover = popover {
            if popover.isShown {
                popover.close()
            } else {
                // Show the popover
                if let button = statusItem?.button {
                    popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
                    // Make sure the popover remains focused
                    popover.contentViewController?.view.window?.makeKey()
                }
            }
        }
    }
    
    // Helper function to open a file dialog for selecting the configuration file
    func showConfigFileDialog(completion: @escaping (URL?) -> Void) {
        let openPanel = NSOpenPanel()
        openPanel.allowsMultipleSelection = false
        openPanel.canChooseDirectories = false
        openPanel.canChooseFiles = true
        openPanel.allowedFileTypes = ["json"]
        openPanel.prompt = "Select Claude Desktop Config"
        
        openPanel.begin { (result) in
            if result == .OK, let url = openPanel.url {
                completion(url)
            } else {
                completion(nil)
            }
        }
    }
    
    // Helper function to open a file dialog for exporting or importing configuration
    func showSaveFileDialog(title: String, defaultName: String, completion: @escaping (URL?) -> Void) {
        let savePanel = NSSavePanel()
        savePanel.title = title
        savePanel.nameFieldStringValue = defaultName
        savePanel.allowedFileTypes = ["json"]
        savePanel.showsTagField = false
        
        savePanel.begin { (result) in
            if result == .OK, let url = savePanel.url {
                completion(url)
            } else {
                completion(nil)
            }
        }
    }
}
