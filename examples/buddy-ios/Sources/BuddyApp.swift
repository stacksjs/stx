import SwiftUI
import WebKit
import Speech
import AVFoundation

// MARK: - App Entry Point
@main
struct BuddyApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            CraftWebView(config: appState.config)
                .ignoresSafeArea()
                .preferredColorScheme(appState.config.darkMode ? .dark : .light)
                .environmentObject(appState)
        }
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var config: CraftConfig

    init() {
        // Load config from craft.config.json if available
        if let configURL = Bundle.main.url(forResource: "craft.config", withExtension: "json"),
           let data = try? Data(contentsOf: configURL),
           let config = try? JSONDecoder().decode(CraftConfig.self, from: data) {
            self.config = config
        } else {
            self.config = CraftConfig()
        }
    }
}

// MARK: - Configuration
struct CraftConfig: Codable {
    var appName: String = "Craft App"
    var bundleId: String = "com.craft.app"
    var darkMode: Bool = true
    var backgroundColor: String = "#1a1a2e"
    var enableSpeechRecognition: Bool = true
    var enableHaptics: Bool = true
    var enableShare: Bool = true
    var devServerURL: String? = nil
}

// MARK: - WebView
struct CraftWebView: UIViewRepresentable {
    let config: CraftConfig

    func makeUIView(context: Context) -> WKWebView {
        let webConfig = WKWebViewConfiguration()
        webConfig.defaultWebpagePreferences.allowsContentJavaScript = true
        webConfig.allowsInlineMediaPlayback = true
        webConfig.mediaTypesRequiringUserActionForPlayback = []

        // Add native bridge
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "craft")
        webConfig.userContentController = contentController

        let webView = WKWebView(frame: .zero, configuration: webConfig)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false

        // Parse background color
        let bgColor = UIColor(hex: config.backgroundColor) ?? .black
        webView.backgroundColor = bgColor
        webView.scrollView.backgroundColor = bgColor

        // Load content
        if let devURL = config.devServerURL, !devURL.isEmpty {
            // Development mode - connect to server
            if let url = URL(string: devURL) {
                webView.load(URLRequest(url: url))
            }
        } else if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html") {
            // Production mode - load bundled HTML
            let htmlURL = URL(fileURLWithPath: htmlPath)
            webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
        }

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(config: config)
    }

    // MARK: - Coordinator (Native Bridge)
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let config: CraftConfig
        private var speechRecognizer: SFSpeechRecognizer?
        private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
        private var recognitionTask: SFSpeechRecognitionTask?
        private var audioEngine = AVAudioEngine()
        private weak var webView: WKWebView?

        init(config: CraftConfig) {
            self.config = config
            super.init()
            if config.enableSpeechRecognition {
                speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
            }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }

            switch action {
            case "startListening":
                if config.enableSpeechRecognition { startSpeechRecognition() }
            case "stopListening":
                stopSpeechRecognition()
            case "haptic":
                if config.enableHaptics {
                    let style = body["style"] as? String ?? "medium"
                    triggerHaptic(style: style)
                }
            case "share":
                if config.enableShare, let text = body["text"] as? String {
                    shareText(text)
                }
            case "log":
                if let msg = body["message"] as? String {
                    print("[Craft Web] \(msg)")
                }
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            self.webView = webView
            injectNativeBridge()
        }

        private func injectNativeBridge() {
            let script = """
            window.craft = {
                platform: 'ios',
                capabilities: {
                    haptics: \(config.enableHaptics),
                    speechRecognition: \(config.enableSpeechRecognition),
                    share: \(config.enableShare)
                },
                haptic: function(style) {
                    window.webkit.messageHandlers.craft.postMessage({action: 'haptic', style: style || 'medium'});
                },
                startListening: function() {
                    window.webkit.messageHandlers.craft.postMessage({action: 'startListening'});
                },
                stopListening: function() {
                    window.webkit.messageHandlers.craft.postMessage({action: 'stopListening'});
                },
                share: function(text) {
                    window.webkit.messageHandlers.craft.postMessage({action: 'share', text: text});
                },
                log: function(msg) {
                    window.webkit.messageHandlers.craft.postMessage({action: 'log', message: msg});
                }
            };

            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('craftReady', {detail: window.craft}));
            console.log('Craft iOS bridge initialized');
            """
            webView?.evaluateJavaScript(script)
        }

        // MARK: - Speech Recognition
        private func startSpeechRecognition() {
            SFSpeechRecognizer.requestAuthorization { [weak self] status in
                guard status == .authorized else {
                    self?.sendToWeb("craftSpeechError", data: ["error": "Not authorized"])
                    return
                }
                DispatchQueue.main.async { self?.beginRecording() }
            }
        }

        private func beginRecording() {
            if recognitionTask != nil {
                recognitionTask?.cancel()
                recognitionTask = nil
            }

            let audioSession = AVAudioSession.sharedInstance()
            do {
                try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
                try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            } catch {
                sendToWeb("craftSpeechError", data: ["error": "Audio session failed"])
                return
            }

            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let recognitionRequest = recognitionRequest,
                  let speechRecognizer = speechRecognizer,
                  speechRecognizer.isAvailable else {
                sendToWeb("craftSpeechError", data: ["error": "Speech recognizer unavailable"])
                return
            }

            recognitionRequest.shouldReportPartialResults = true
            let inputNode = audioEngine.inputNode

            recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                if let result = result {
                    let transcript = result.bestTranscription.formattedString
                    self?.sendToWeb("craftSpeechResult", data: [
                        "transcript": transcript,
                        "isFinal": result.isFinal
                    ])
                }
                if error != nil || result?.isFinal == true {
                    self?.stopSpeechRecognition()
                }
            }

            let recordingFormat = inputNode.outputFormat(forBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
                self?.recognitionRequest?.append(buffer)
            }

            audioEngine.prepare()
            do {
                try audioEngine.start()
                sendToWeb("craftSpeechStart", data: [:])
                triggerHaptic(style: "light")
            } catch {
                sendToWeb("craftSpeechError", data: ["error": "Audio engine failed"])
            }
        }

        private func stopSpeechRecognition() {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
            recognitionRequest?.endAudio()
            recognitionRequest = nil
            recognitionTask?.cancel()
            recognitionTask = nil
            sendToWeb("craftSpeechEnd", data: [:])
            triggerHaptic(style: "light")
        }

        // MARK: - Haptics
        private func triggerHaptic(style: String) {
            switch style {
            case "light":
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            case "heavy":
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            case "success":
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case "warning":
                UINotificationFeedbackGenerator().notificationOccurred(.warning)
            case "error":
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            case "selection":
                UISelectionFeedbackGenerator().selectionChanged()
            default:
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
        }

        // MARK: - Share
        private func shareText(_ text: String) {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let rootVC = windowScene.windows.first?.rootViewController else { return }
            let activityVC = UIActivityViewController(activityItems: [text], applicationActivities: nil)
            rootVC.present(activityVC, animated: true)
        }

        // MARK: - Web Communication
        private func sendToWeb(_ event: String, data: [String: Any]) {
            guard let webView = webView else { return }
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: data)
                if let jsonString = String(data: jsonData, encoding: .utf8) {
                    let script = "window.dispatchEvent(new CustomEvent('\(event)', {detail: \(jsonString)}));"
                    DispatchQueue.main.async { webView.evaluateJavaScript(script, completionHandler: nil) }
                }
            } catch {
                print("Failed to serialize: \(error)")
            }
        }
    }
}

// MARK: - UIColor Extension
extension UIColor {
    convenience init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        let r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let b = CGFloat(rgb & 0x0000FF) / 255.0

        self.init(red: r, green: g, blue: b, alpha: 1.0)
    }
}
