/**
 * STX Native iOS Bridge
 *
 * Handles communication between JavaScript and native iOS code.
 * Uses JavaScriptCore for the JS runtime and WKWebView for message passing.
 */

import Foundation
import JavaScriptCore
import UIKit

// MARK: - Bridge Message Types

struct BridgeMessage: Codable {
    let id: String
    let type: String
    let timestamp: Double
    let payload: AnyCodable
    let correlationId: String?
    let source: String
}

// MARK: - STX Bridge Delegate

protocol STXBridgeDelegate: AnyObject {
    func bridge(_ bridge: STXBridge, didReceiveRenderRequest document: Any, containerId: String?, mode: String)
    func bridge(_ bridge: STXBridge, didReceiveUpdateRequest updates: [[String: Any]])
    func bridge(_ bridge: STXBridge, didReceiveRemoveRequest keys: [String])
    func bridge(_ bridge: STXBridge, didReceiveNavigateRequest screen: String, params: [String: Any]?, animation: String?)
    func bridge(_ bridge: STXBridge, didRequestAPI module: String, method: String, args: [Any], completion: @escaping (Result<Any, Error>) -> Void)
}

// MARK: - STX Bridge

class STXBridge: NSObject {

    // MARK: - Properties

    weak var delegate: STXBridgeDelegate?

    private let jsContext: JSContext
    private var messageHandlers: [String: (BridgeMessage) -> Void] = [:]
    private var pendingResponses: [String: (Any?, Error?) -> Void] = [:]

    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // MARK: - Initialization

    override init() {
        jsContext = JSContext()!
        super.init()
        setupJSContext()
    }

    init(jsContext: JSContext) {
        self.jsContext = jsContext
        super.init()
        setupJSContext()
    }

    // MARK: - Setup

    private func setupJSContext() {
        // Exception handler
        jsContext.exceptionHandler = { [weak self] context, exception in
            let message = exception?.toString() ?? "Unknown error"
            print("[STXBridge] JS Exception: \(message)")
            self?.sendError(code: "JS_EXCEPTION", message: message)
        }

        // Console.log bridge
        let consoleLog: @convention(block) (String) -> Void = { message in
            print("[STX JS] \(message)")
        }
        jsContext.setObject(consoleLog, forKeyedSubscript: "consoleLog" as NSString)
        jsContext.evaluateScript("""
            console = {
                log: function(...args) { consoleLog(args.map(String).join(' ')); },
                warn: function(...args) { consoleLog('[WARN] ' + args.map(String).join(' ')); },
                error: function(...args) { consoleLog('[ERROR] ' + args.map(String).join(' ')); },
                info: function(...args) { consoleLog('[INFO] ' + args.map(String).join(' ')); }
            };
        """)

        // Native bridge interface
        let postMessage: @convention(block) (String) -> Void = { [weak self] messageJson in
            self?.handleMessageFromJS(messageJson)
        }
        jsContext.setObject(postMessage, forKeyedSubscript: "postMessageToNative" as NSString)

        // Setup the bridge initialization code
        jsContext.evaluateScript("""
            // STX Native Bridge initialization
            (function() {
                // Message callback from native
                globalThis.__stxNativeCallback = null;

                // Registered handlers
                globalThis.__stxHandlers = {};

                // Native bridge interface
                const nativeBridge = {
                    postMessage: function(message) {
                        postMessageToNative(message);
                    },
                    onMessage: function(callback) {
                        globalThis.__stxNativeCallback = callback;
                    }
                };

                // Call handler from native
                globalThis.__stxCallHandler = function(name, argsJson) {
                    const handler = globalThis.__stxHandlers[name];
                    if (handler) {
                        const args = JSON.parse(argsJson);
                        return JSON.stringify(handler.apply(null, args));
                    }
                    return null;
                };

                // Expose for bridge initialization
                globalThis.__stxNativeBridge = nativeBridge;
            })();
        """)
    }

    // MARK: - Load JavaScript Bundle

    func loadBundle(at url: URL, completion: @escaping (Error?) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let code = try String(contentsOf: url, encoding: .utf8)
                DispatchQueue.main.async {
                    self?.jsContext.evaluateScript(code)
                    completion(nil)
                }
            } catch {
                DispatchQueue.main.async {
                    completion(error)
                }
            }
        }
    }

    func loadBundle(code: String) {
        jsContext.evaluateScript(code)
    }

    // MARK: - Message Handling

    private func handleMessageFromJS(_ messageJson: String) {
        guard let data = messageJson.data(using: .utf8) else {
            print("[STXBridge] Failed to convert message to data")
            return
        }

        do {
            let message = try decoder.decode(BridgeMessage.self, from: data)
            processMessage(message)
        } catch {
            print("[STXBridge] Failed to decode message: \(error)")
        }
    }

    private func processMessage(_ message: BridgeMessage) {
        switch message.type {
        case "RENDER":
            handleRender(message)
        case "UPDATE":
            handleUpdate(message)
        case "REMOVE":
            handleRemove(message)
        case "NAVIGATE":
            handleNavigate(message)
        case "NAVIGATE_BACK":
            handleNavigateBack(message)
        case "API_REQUEST":
            handleAPIRequest(message)
        case "DEBUG_LOG":
            handleDebugLog(message)
        default:
            // Check for custom handlers
            if let handler = messageHandlers[message.type] {
                handler(message)
            } else {
                print("[STXBridge] Unknown message type: \(message.type)")
            }
        }
    }

    // MARK: - Message Handlers

    private func handleRender(_ message: BridgeMessage) {
        guard let payload = message.payload.value as? [String: Any],
              let document = payload["document"] else {
            print("[STXBridge] Invalid RENDER payload")
            return
        }

        let containerId = payload["containerId"] as? String
        let mode = payload["mode"] as? String ?? "replace"

        delegate?.bridge(self, didReceiveRenderRequest: document, containerId: containerId, mode: mode)
    }

    private func handleUpdate(_ message: BridgeMessage) {
        guard let payload = message.payload.value as? [String: Any],
              let updates = payload["updates"] as? [[String: Any]] else {
            print("[STXBridge] Invalid UPDATE payload")
            return
        }

        delegate?.bridge(self, didReceiveUpdateRequest: updates)
    }

    private func handleRemove(_ message: BridgeMessage) {
        guard let payload = message.payload.value as? [String: Any],
              let keys = payload["keys"] as? [String] else {
            print("[STXBridge] Invalid REMOVE payload")
            return
        }

        delegate?.bridge(self, didReceiveRemoveRequest: keys)
    }

    private func handleNavigate(_ message: BridgeMessage) {
        guard let payload = message.payload.value as? [String: Any],
              let screen = payload["screen"] as? String else {
            print("[STXBridge] Invalid NAVIGATE payload")
            return
        }

        let params = payload["params"] as? [String: Any]
        let animation = payload["animation"] as? String

        delegate?.bridge(self, didReceiveNavigateRequest: screen, params: params, animation: animation)
    }

    private func handleNavigateBack(_ message: BridgeMessage) {
        // Post notification for navigation controller to handle
        NotificationCenter.default.post(name: .stxNavigateBack, object: nil)
    }

    private func handleAPIRequest(_ message: BridgeMessage) {
        guard let payload = message.payload.value as? [String: Any],
              let module = payload["module"] as? String,
              let method = payload["method"] as? String,
              let args = payload["args"] as? [Any] else {
            sendError(code: "INVALID_API_REQUEST", message: "Invalid API request payload", correlationId: message.id)
            return
        }

        delegate?.bridge(self, didRequestAPI: module, method: method, args: args) { [weak self] result in
            switch result {
            case .success(let data):
                self?.sendResponse(data: data, correlationId: message.id)
            case .failure(let error):
                self?.sendError(code: "API_ERROR", message: error.localizedDescription, correlationId: message.id)
            }
        }
    }

    private func handleDebugLog(_ message: BridgeMessage) {
        guard let payload = message.payload.value as? [String: Any],
              let level = payload["level"] as? String,
              let logMessage = payload["message"] as? String else {
            return
        }

        let data = payload["data"]
        print("[STX \(level.uppercased())] \(logMessage) \(data != nil ? "- \(data!)" : "")")
    }

    // MARK: - Send Messages to JS

    func sendToJS(_ message: BridgeMessage) {
        do {
            let data = try encoder.encode(message)
            guard let json = String(data: data, encoding: .utf8) else { return }

            DispatchQueue.main.async { [weak self] in
                self?.jsContext.evaluateScript("""
                    if (globalThis.__stxNativeCallback) {
                        globalThis.__stxNativeCallback('\(json.replacingOccurrences(of: "'", with: "\\'"))');
                    }
                """)
            }
        } catch {
            print("[STXBridge] Failed to encode message: \(error)")
        }
    }

    func sendEvent(
        eventType: String,
        targetKey: String,
        handlerName: String,
        nativeEvent: [String: Any]
    ) {
        let payload: [String: Any] = [
            "eventType": eventType,
            "targetKey": targetKey,
            "handlerName": handlerName,
            "nativeEvent": nativeEvent
        ]

        let message = BridgeMessage(
            id: "native_\(UUID().uuidString)",
            type: "EVENT",
            timestamp: Date().timeIntervalSince1970 * 1000,
            payload: AnyCodable(payload),
            correlationId: nil,
            source: "native"
        )

        sendToJS(message)
    }

    func sendResponse(data: Any, correlationId: String) {
        let payload: [String: Any] = [
            "requestId": correlationId,
            "data": data,
            "success": true
        ]

        let message = BridgeMessage(
            id: "native_\(UUID().uuidString)",
            type: "API_RESPONSE",
            timestamp: Date().timeIntervalSince1970 * 1000,
            payload: AnyCodable(payload),
            correlationId: correlationId,
            source: "native"
        )

        sendToJS(message)
    }

    func sendError(code: String, message: String, correlationId: String? = nil) {
        let payload: [String: Any] = [
            "requestId": correlationId ?? "",
            "code": code,
            "message": message
        ]

        let bridgeMessage = BridgeMessage(
            id: "native_\(UUID().uuidString)",
            type: "API_ERROR",
            timestamp: Date().timeIntervalSince1970 * 1000,
            payload: AnyCodable(payload),
            correlationId: correlationId,
            source: "native"
        )

        sendToJS(bridgeMessage)
    }

    func sendAppState(_ state: String) {
        let payload: [String: Any] = ["state": state]

        let message = BridgeMessage(
            id: "native_\(UUID().uuidString)",
            type: "APP_STATE",
            timestamp: Date().timeIntervalSince1970 * 1000,
            payload: AnyCodable(payload),
            correlationId: nil,
            source: "native"
        )

        sendToJS(message)
    }

    func sendHotReload(changedFiles: [String], document: Any?, preserveState: Bool) {
        var payload: [String: Any] = [
            "changedFiles": changedFiles,
            "preserveState": preserveState
        ]
        if let doc = document {
            payload["document"] = doc
        }

        let message = BridgeMessage(
            id: "native_\(UUID().uuidString)",
            type: "HOT_RELOAD",
            timestamp: Date().timeIntervalSince1970 * 1000,
            payload: AnyCodable(payload),
            correlationId: nil,
            source: "native"
        )

        sendToJS(message)
    }

    // MARK: - Call JS Handlers

    func callHandler(_ name: String, args: [Any] = []) -> Any? {
        do {
            let argsJson = try JSONSerialization.data(withJSONObject: args)
            guard let argsString = String(data: argsJson, encoding: .utf8) else { return nil }

            let result = jsContext.evaluateScript("__stxCallHandler('\(name)', '\(argsString.replacingOccurrences(of: "'", with: "\\'"))')")

            if let resultString = result?.toString(), resultString != "null" && resultString != "undefined" {
                if let data = resultString.data(using: .utf8) {
                    return try JSONSerialization.jsonObject(with: data)
                }
            }
        } catch {
            print("[STXBridge] Failed to call handler \(name): \(error)")
        }
        return nil
    }

    // MARK: - Register Custom Handlers

    func registerHandler(_ type: String, handler: @escaping (BridgeMessage) -> Void) {
        messageHandlers[type] = handler
    }

    func unregisterHandler(_ type: String) {
        messageHandlers.removeValue(forKey: type)
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let stxNavigateBack = Notification.Name("STXNavigateBack")
    static let stxAppStateChanged = Notification.Name("STXAppStateChanged")
}

// MARK: - AnyCodable (for flexible JSON encoding/decoding)

struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else if container.decodeNil() {
            value = NSNull()
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unable to decode value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
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
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        case is NSNull:
            try container.encodeNil()
        default:
            try container.encodeNil()
        }
    }
}
