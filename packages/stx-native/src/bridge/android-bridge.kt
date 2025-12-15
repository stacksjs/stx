/**
 * STX Native Android Bridge
 *
 * Handles communication between JavaScript and native Android code.
 * Uses Hermes/V8 for the JS runtime and JavaScriptInterface for message passing.
 */

package com.stx.native.bridge

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

// ============================================================================
// Bridge Message
// ============================================================================

data class BridgeMessage(
    val id: String,
    val type: String,
    val timestamp: Double,
    val payload: JSONObject,
    val correlationId: String? = null,
    val source: String
) {
    companion object {
        fun fromJson(json: String): BridgeMessage {
            val obj = JSONObject(json)
            return BridgeMessage(
                id = obj.getString("id"),
                type = obj.getString("type"),
                timestamp = obj.getDouble("timestamp"),
                payload = obj.optJSONObject("payload") ?: JSONObject(),
                correlationId = obj.optString("correlationId", null),
                source = obj.getString("source")
            )
        }
    }

    fun toJson(): String {
        return JSONObject().apply {
            put("id", id)
            put("type", type)
            put("timestamp", timestamp)
            put("payload", payload)
            correlationId?.let { put("correlationId", it) }
            put("source", source)
        }.toString()
    }
}

// ============================================================================
// Bridge Delegate
// ============================================================================

interface STXBridgeDelegate {
    fun onRenderRequest(document: Any, containerId: String?, mode: String)
    fun onUpdateRequest(updates: List<Map<String, Any?>>)
    fun onRemoveRequest(keys: List<String>)
    fun onNavigateRequest(screen: String, params: Map<String, Any?>?, animation: String?)
    fun onNavigateBack()
    fun onAPIRequest(module: String, method: String, args: List<Any?>, callback: (Result<Any?>) -> Unit)
}

// ============================================================================
// STX Bridge
// ============================================================================

class STXBridge(private val context: Context) {

    companion object {
        private const val TAG = "STXBridge"
    }

    // ========================================================================
    // Properties
    // ========================================================================

    var delegate: STXBridgeDelegate? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private val messageHandlers = ConcurrentHashMap<String, (BridgeMessage) -> Unit>()
    private val pendingResponses = ConcurrentHashMap<String, (Any?, Throwable?) -> Unit>()

    // JavaScript evaluator (set by the runtime)
    private var jsEvaluator: ((String) -> Unit)? = null

    // ========================================================================
    // JavaScript Interface (called from JS)
    // ========================================================================

    @JavascriptInterface
    fun postMessage(messageJson: String) {
        try {
            val message = BridgeMessage.fromJson(messageJson)
            mainHandler.post {
                processMessage(message)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse message: $messageJson", e)
        }
    }

    // ========================================================================
    // Setup
    // ========================================================================

    /**
     * Set the JS evaluator function (e.g., webView.evaluateJavascript)
     */
    fun setJSEvaluator(evaluator: (String) -> Unit) {
        jsEvaluator = evaluator
    }

    /**
     * Get the JavaScript interface object for WebView
     */
    fun getJavaScriptInterface(): Any {
        return this
    }

    /**
     * Initialize the bridge in JavaScript context
     */
    fun initializeJS() {
        evaluateJS("""
            (function() {
                // Message callback from native
                globalThis.__stxNativeCallback = null;

                // Registered handlers
                globalThis.__stxHandlers = {};

                // Native bridge interface
                const nativeBridge = {
                    postMessage: function(message) {
                        STXNative.postMessage(message);
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

                console.log('[STXBridge] Initialized');
            })();
        """.trimIndent())
    }

    // ========================================================================
    // Message Processing
    // ========================================================================

    private fun processMessage(message: BridgeMessage) {
        when (message.type) {
            "RENDER" -> handleRender(message)
            "UPDATE" -> handleUpdate(message)
            "REMOVE" -> handleRemove(message)
            "NAVIGATE" -> handleNavigate(message)
            "NAVIGATE_BACK" -> handleNavigateBack(message)
            "API_REQUEST" -> handleAPIRequest(message)
            "DEBUG_LOG" -> handleDebugLog(message)
            else -> {
                // Check for custom handlers
                val handler = messageHandlers[message.type]
                if (handler != null) {
                    handler(message)
                } else {
                    Log.w(TAG, "Unknown message type: ${message.type}")
                }
            }
        }
    }

    // ========================================================================
    // Message Handlers
    // ========================================================================

    private fun handleRender(message: BridgeMessage) {
        val payload = message.payload
        val document = payload.opt("document") ?: run {
            Log.e(TAG, "Invalid RENDER payload: missing document")
            return
        }
        val containerId = payload.optString("containerId", null)
        val mode = payload.optString("mode", "replace")

        delegate?.onRenderRequest(document, containerId, mode)
    }

    private fun handleUpdate(message: BridgeMessage) {
        val payload = message.payload
        val updatesJson = payload.optJSONArray("updates") ?: run {
            Log.e(TAG, "Invalid UPDATE payload: missing updates")
            return
        }

        val updates = mutableListOf<Map<String, Any?>>()
        for (i in 0 until updatesJson.length()) {
            val updateJson = updatesJson.getJSONObject(i)
            updates.add(updateJson.toMap())
        }

        delegate?.onUpdateRequest(updates)
    }

    private fun handleRemove(message: BridgeMessage) {
        val payload = message.payload
        val keysJson = payload.optJSONArray("keys") ?: run {
            Log.e(TAG, "Invalid REMOVE payload: missing keys")
            return
        }

        val keys = mutableListOf<String>()
        for (i in 0 until keysJson.length()) {
            keys.add(keysJson.getString(i))
        }

        delegate?.onRemoveRequest(keys)
    }

    private fun handleNavigate(message: BridgeMessage) {
        val payload = message.payload
        val screen = payload.optString("screen", null) ?: run {
            Log.e(TAG, "Invalid NAVIGATE payload: missing screen")
            return
        }
        val params = payload.optJSONObject("params")?.toMap()
        val animation = payload.optString("animation", null)

        delegate?.onNavigateRequest(screen, params, animation)
    }

    private fun handleNavigateBack(message: BridgeMessage) {
        delegate?.onNavigateBack()
    }

    private fun handleAPIRequest(message: BridgeMessage) {
        val payload = message.payload
        val module = payload.optString("module", null)
        val method = payload.optString("method", null)
        val argsJson = payload.optJSONArray("args")

        if (module == null || method == null) {
            sendError("INVALID_API_REQUEST", "Invalid API request payload", message.id)
            return
        }

        val args = mutableListOf<Any?>()
        argsJson?.let {
            for (i in 0 until it.length()) {
                args.add(it.opt(i))
            }
        }

        delegate?.onAPIRequest(module, method, args) { result ->
            result.fold(
                onSuccess = { data ->
                    sendResponse(data, message.id)
                },
                onFailure = { error ->
                    sendError("API_ERROR", error.message ?: "Unknown error", message.id)
                }
            )
        }
    }

    private fun handleDebugLog(message: BridgeMessage) {
        val payload = message.payload
        val level = payload.optString("level", "info")
        val logMessage = payload.optString("message", "")
        val data = payload.opt("data")

        val fullMessage = if (data != null) "$logMessage - $data" else logMessage

        when (level) {
            "warn" -> Log.w(TAG, "[JS] $fullMessage")
            "error" -> Log.e(TAG, "[JS] $fullMessage")
            else -> Log.i(TAG, "[JS] $fullMessage")
        }
    }

    // ========================================================================
    // Send Messages to JS
    // ========================================================================

    fun sendToJS(message: BridgeMessage) {
        val json = message.toJson().replace("'", "\\'")
        evaluateJS("""
            if (globalThis.__stxNativeCallback) {
                globalThis.__stxNativeCallback('$json');
            }
        """.trimIndent())
    }

    fun sendEvent(
        eventType: String,
        targetKey: String,
        handlerName: String,
        nativeEvent: Map<String, Any?>
    ) {
        val payload = JSONObject().apply {
            put("eventType", eventType)
            put("targetKey", targetKey)
            put("handlerName", handlerName)
            put("nativeEvent", JSONObject(nativeEvent))
        }

        val message = BridgeMessage(
            id = "native_${UUID.randomUUID()}",
            type = "EVENT",
            timestamp = System.currentTimeMillis().toDouble(),
            payload = payload,
            source = "native"
        )

        sendToJS(message)
    }

    fun sendResponse(data: Any?, correlationId: String) {
        val payload = JSONObject().apply {
            put("requestId", correlationId)
            put("data", data)
            put("success", true)
        }

        val message = BridgeMessage(
            id = "native_${UUID.randomUUID()}",
            type = "API_RESPONSE",
            timestamp = System.currentTimeMillis().toDouble(),
            payload = payload,
            correlationId = correlationId,
            source = "native"
        )

        sendToJS(message)
    }

    fun sendError(code: String, errorMessage: String, correlationId: String? = null) {
        val payload = JSONObject().apply {
            put("requestId", correlationId ?: "")
            put("code", code)
            put("message", errorMessage)
        }

        val message = BridgeMessage(
            id = "native_${UUID.randomUUID()}",
            type = "API_ERROR",
            timestamp = System.currentTimeMillis().toDouble(),
            payload = payload,
            correlationId = correlationId,
            source = "native"
        )

        sendToJS(message)
    }

    fun sendAppState(state: String) {
        val payload = JSONObject().apply {
            put("state", state)
        }

        val message = BridgeMessage(
            id = "native_${UUID.randomUUID()}",
            type = "APP_STATE",
            timestamp = System.currentTimeMillis().toDouble(),
            payload = payload,
            source = "native"
        )

        sendToJS(message)
    }

    fun sendHotReload(changedFiles: List<String>, document: Any?, preserveState: Boolean) {
        val payload = JSONObject().apply {
            put("changedFiles", JSONArray(changedFiles))
            put("preserveState", preserveState)
            document?.let { put("document", it) }
        }

        val message = BridgeMessage(
            id = "native_${UUID.randomUUID()}",
            type = "HOT_RELOAD",
            timestamp = System.currentTimeMillis().toDouble(),
            payload = payload,
            source = "native"
        )

        sendToJS(message)
    }

    // ========================================================================
    // Call JS Handlers
    // ========================================================================

    fun callHandler(name: String, args: List<Any?> = emptyList()): Any? {
        val argsJson = JSONArray(args).toString().replace("'", "\\'")
        var result: Any? = null

        // Note: This is synchronous only in WebView. For other JS engines,
        // you may need an async approach
        evaluateJS("__stxCallHandler('$name', '$argsJson')") { value ->
            if (value != null && value != "null" && value != "undefined") {
                try {
                    result = JSONObject(value)
                } catch (e: Exception) {
                    result = value
                }
            }
        }

        return result
    }

    // ========================================================================
    // Register Custom Handlers
    // ========================================================================

    fun registerHandler(type: String, handler: (BridgeMessage) -> Unit) {
        messageHandlers[type] = handler
    }

    fun unregisterHandler(type: String) {
        messageHandlers.remove(type)
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private fun evaluateJS(script: String, callback: ((String?) -> Unit)? = null) {
        mainHandler.post {
            jsEvaluator?.invoke(script)
            // Note: For WebView, you'd use evaluateJavascript with a ValueCallback
            // This simplified version doesn't capture return values
        }
    }
}

// ============================================================================
// JSON Extensions
// ============================================================================

private fun JSONObject.toMap(): Map<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    keys().forEach { key ->
        map[key] = when (val value = opt(key)) {
            is JSONObject -> value.toMap()
            is JSONArray -> value.toList()
            JSONObject.NULL -> null
            else -> value
        }
    }
    return map
}

private fun JSONArray.toList(): List<Any?> {
    val list = mutableListOf<Any?>()
    for (i in 0 until length()) {
        list.add(when (val value = opt(i)) {
            is JSONObject -> value.toMap()
            is JSONArray -> value.toList()
            JSONObject.NULL -> null
            else -> value
        })
    }
    return list
}

// ============================================================================
// Native API Module System
// ============================================================================

/**
 * Base interface for native API modules
 */
interface STXNativeModule {
    val name: String
    fun invoke(method: String, args: List<Any?>, callback: (Result<Any?>) -> Unit)
}

/**
 * Registry for native API modules
 */
class STXModuleRegistry {
    private val modules = mutableMapOf<String, STXNativeModule>()

    fun register(module: STXNativeModule) {
        modules[module.name] = module
    }

    fun unregister(name: String) {
        modules.remove(name)
    }

    fun getModule(name: String): STXNativeModule? = modules[name]

    fun invoke(module: String, method: String, args: List<Any?>, callback: (Result<Any?>) -> Unit) {
        val nativeModule = modules[module]
        if (nativeModule != null) {
            nativeModule.invoke(method, args, callback)
        } else {
            callback(Result.failure(Exception("Module not found: $module")))
        }
    }
}

// ============================================================================
// Built-in Modules
// ============================================================================

/**
 * Clipboard module
 */
class ClipboardModule(private val context: Context) : STXNativeModule {
    override val name = "clipboard"

    override fun invoke(method: String, args: List<Any?>, callback: (Result<Any?>) -> Unit) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager

        when (method) {
            "getString" -> {
                val text = clipboard.primaryClip?.getItemAt(0)?.text?.toString() ?: ""
                callback(Result.success(text))
            }
            "setString" -> {
                val text = args.getOrNull(0) as? String ?: ""
                val clip = android.content.ClipData.newPlainText("STX", text)
                clipboard.setPrimaryClip(clip)
                callback(Result.success(null))
            }
            else -> callback(Result.failure(Exception("Unknown method: $method")))
        }
    }
}

/**
 * Storage module (SharedPreferences-based)
 */
class StorageModule(private val context: Context) : STXNativeModule {
    override val name = "storage"

    private val prefs = context.getSharedPreferences("stx_storage", Context.MODE_PRIVATE)

    override fun invoke(method: String, args: List<Any?>, callback: (Result<Any?>) -> Unit) {
        when (method) {
            "getItem" -> {
                val key = args.getOrNull(0) as? String ?: ""
                val value = prefs.getString(key, null)
                callback(Result.success(value))
            }
            "setItem" -> {
                val key = args.getOrNull(0) as? String ?: ""
                val value = args.getOrNull(1) as? String ?: ""
                prefs.edit().putString(key, value).apply()
                callback(Result.success(null))
            }
            "removeItem" -> {
                val key = args.getOrNull(0) as? String ?: ""
                prefs.edit().remove(key).apply()
                callback(Result.success(null))
            }
            "clear" -> {
                prefs.edit().clear().apply()
                callback(Result.success(null))
            }
            "getAllKeys" -> {
                val keys = prefs.all.keys.toList()
                callback(Result.success(keys))
            }
            else -> callback(Result.failure(Exception("Unknown method: $method")))
        }
    }
}

/**
 * Vibration module
 */
class VibrationModule(private val context: Context) : STXNativeModule {
    override val name = "vibration"

    override fun invoke(method: String, args: List<Any?>, callback: (Result<Any?>) -> Unit) {
        val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as android.os.VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
        }

        when (method) {
            "vibrate" -> {
                val duration = (args.getOrNull(0) as? Number)?.toLong() ?: 100L
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    vibrator.vibrate(android.os.VibrationEffect.createOneShot(duration, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(duration)
                }
                callback(Result.success(null))
            }
            "cancel" -> {
                vibrator.cancel()
                callback(Result.success(null))
            }
            else -> callback(Result.failure(Exception("Unknown method: $method")))
        }
    }
}
