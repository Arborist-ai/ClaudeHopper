import Foundation
import Combine
import AppKit

class ClipboardManager: ObservableObject {
    @Published var hasDetectedServerConfig: Bool = false
    @Published var detectedServer: MCPServer?
    
    private var timer: Timer?
    private var lastChangeCount: Int = 0
    private var configManager: MCPConfigManager?
    
    func setConfigManager(_ manager: MCPConfigManager) {
        self.configManager = manager
    }
    
    func startMonitoring() {
        // Initialize with current clipboard state
        lastChangeCount = NSPasteboard.general.changeCount
        checkClipboard()
        
        // Set up timer to check clipboard periodically
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.checkClipboard()
        }
    }
    
    func stopMonitoring() {
        timer?.invalidate()
        timer = nil
    }
    
    private func checkClipboard() {
        let pasteboard = NSPasteboard.general
        
        // Only check if clipboard has changed
        guard pasteboard.changeCount != lastChangeCount else {
            return
        }
        
        lastChangeCount = pasteboard.changeCount
        
        // Check for string content
        guard let clipboardString = pasteboard.string(forType: .string) else {
            clearDetectedServer()
            return
        }
        
        // Check if the string contains a server configuration
        if let server = configManager?.parseConfigBlock(clipboardString) {
            detectedServer = server
            hasDetectedServerConfig = true
        } else {
            clearDetectedServer()
        }
    }
    
    func clearDetectedServer() {
        detectedServer = nil
        hasDetectedServerConfig = false
    }
    
    func importDetectedServer() -> Bool {
        guard let server = detectedServer, let configManager = configManager else {
            return false
        }
        
        // Add the server to the config
        configManager.addServer(server)
        
        // Clear the detected server
        clearDetectedServer()
        
        return true
    }
    
    deinit {
        stopMonitoring()
    }
}
