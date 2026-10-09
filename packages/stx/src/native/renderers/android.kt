/**
 * STX Native Android Renderer
 *
 * Renders STX IR to native Android views.
 * Uses Yoga for flexbox layout.
 */

package com.stx.native.renderer

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.text.InputType
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.view.ViewCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.yoga.*
import org.json.JSONArray
import org.json.JSONObject

// ============================================================================
// STX IR Types (Mirror of TypeScript definitions)
// ============================================================================

data class STXNode(
    val type: String,
    val key: String? = null,
    val props: Map<String, Any?> = emptyMap(),
    val style: STXStyle = STXStyle(),
    val events: Map<String, String> = emptyMap(),
    val children: List<STXChild> = emptyList()
) {
    companion object {
        fun fromJson(json: JSONObject): STXNode {
            val children = mutableListOf<STXChild>()
            json.optJSONArray("children")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val item = arr.get(i)
                    when (item) {
                        is String -> children.add(STXChild.Text(item))
                        is JSONObject -> children.add(STXChild.Node(fromJson(item)))
                    }
                }
            }

            return STXNode(
                type = json.getString("type"),
                key = json.optString("key", null),
                props = json.optJSONObject("props")?.toMap() ?: emptyMap(),
                style = STXStyle.fromJson(json.optJSONObject("style") ?: JSONObject()),
                events = json.optJSONObject("events")?.toStringMap() ?: emptyMap(),
                children = children
            )
        }
    }
}

sealed class STXChild {
    data class Node(val node: STXNode) : STXChild()
    data class Text(val text: String) : STXChild()
}

data class STXStyle(
    // Layout
    val display: String? = null,
    val flex: Float? = null,
    val flexGrow: Float? = null,
    val flexShrink: Float? = null,
    val flexBasis: Any? = null,
    val flexDirection: String? = null,
    val flexWrap: String? = null,
    val justifyContent: String? = null,
    val alignItems: String? = null,
    val alignSelf: String? = null,
    val alignContent: String? = null,

    // Positioning
    val position: String? = null,
    val top: Float? = null,
    val right: Float? = null,
    val bottom: Float? = null,
    val left: Float? = null,
    val zIndex: Int? = null,

    // Dimensions
    val width: Any? = null,
    val height: Any? = null,
    val minWidth: Any? = null,
    val maxWidth: Any? = null,
    val minHeight: Any? = null,
    val maxHeight: Any? = null,
    val aspectRatio: Float? = null,

    // Spacing
    val margin: Float? = null,
    val marginTop: Float? = null,
    val marginRight: Float? = null,
    val marginBottom: Float? = null,
    val marginLeft: Float? = null,
    val marginHorizontal: Float? = null,
    val marginVertical: Float? = null,

    val padding: Float? = null,
    val paddingTop: Float? = null,
    val paddingRight: Float? = null,
    val paddingBottom: Float? = null,
    val paddingLeft: Float? = null,
    val paddingHorizontal: Float? = null,
    val paddingVertical: Float? = null,

    val gap: Float? = null,
    val rowGap: Float? = null,
    val columnGap: Float? = null,

    // Border
    val borderWidth: Float? = null,
    val borderColor: String? = null,
    val borderRadius: Float? = null,
    val borderTopLeftRadius: Float? = null,
    val borderTopRightRadius: Float? = null,
    val borderBottomLeftRadius: Float? = null,
    val borderBottomRightRadius: Float? = null,

    // Background
    val backgroundColor: String? = null,
    val opacity: Float? = null,

    // Shadow / Elevation
    val elevation: Float? = null,
    val shadowColor: String? = null,
    val shadowOpacity: Float? = null,
    val shadowRadius: Float? = null,

    // Text
    val color: String? = null,
    val fontSize: Float? = null,
    val fontWeight: String? = null,
    val fontStyle: String? = null,
    val fontFamily: String? = null,
    val lineHeight: Float? = null,
    val letterSpacing: Float? = null,
    val textAlign: String? = null,
    val textDecorationLine: String? = null,
    val textTransform: String? = null,

    // Image
    val resizeMode: String? = null,
    val tintColor: String? = null,

    // Overflow
    val overflow: String? = null
) {
    companion object {
        fun fromJson(json: JSONObject): STXStyle {
            return STXStyle(
                display = json.optString("display", null),
                flex = json.optDouble("flex").takeIf { !it.isNaN() }?.toFloat(),
                flexGrow = json.optDouble("flexGrow").takeIf { !it.isNaN() }?.toFloat(),
                flexShrink = json.optDouble("flexShrink").takeIf { !it.isNaN() }?.toFloat(),
                flexDirection = json.optString("flexDirection", null),
                flexWrap = json.optString("flexWrap", null),
                justifyContent = json.optString("justifyContent", null),
                alignItems = json.optString("alignItems", null),
                alignSelf = json.optString("alignSelf", null),
                alignContent = json.optString("alignContent", null),

                position = json.optString("position", null),
                top = json.optDouble("top").takeIf { !it.isNaN() }?.toFloat(),
                right = json.optDouble("right").takeIf { !it.isNaN() }?.toFloat(),
                bottom = json.optDouble("bottom").takeIf { !it.isNaN() }?.toFloat(),
                left = json.optDouble("left").takeIf { !it.isNaN() }?.toFloat(),
                zIndex = json.optInt("zIndex").takeIf { it != 0 },

                width = parseDimension(json, "width"),
                height = parseDimension(json, "height"),
                minWidth = parseDimension(json, "minWidth"),
                maxWidth = parseDimension(json, "maxWidth"),
                minHeight = parseDimension(json, "minHeight"),
                maxHeight = parseDimension(json, "maxHeight"),
                aspectRatio = json.optDouble("aspectRatio").takeIf { !it.isNaN() }?.toFloat(),

                margin = json.optDouble("margin").takeIf { !it.isNaN() }?.toFloat(),
                marginTop = json.optDouble("marginTop").takeIf { !it.isNaN() }?.toFloat(),
                marginRight = json.optDouble("marginRight").takeIf { !it.isNaN() }?.toFloat(),
                marginBottom = json.optDouble("marginBottom").takeIf { !it.isNaN() }?.toFloat(),
                marginLeft = json.optDouble("marginLeft").takeIf { !it.isNaN() }?.toFloat(),
                marginHorizontal = json.optDouble("marginHorizontal").takeIf { !it.isNaN() }?.toFloat(),
                marginVertical = json.optDouble("marginVertical").takeIf { !it.isNaN() }?.toFloat(),

                padding = json.optDouble("padding").takeIf { !it.isNaN() }?.toFloat(),
                paddingTop = json.optDouble("paddingTop").takeIf { !it.isNaN() }?.toFloat(),
                paddingRight = json.optDouble("paddingRight").takeIf { !it.isNaN() }?.toFloat(),
                paddingBottom = json.optDouble("paddingBottom").takeIf { !it.isNaN() }?.toFloat(),
                paddingLeft = json.optDouble("paddingLeft").takeIf { !it.isNaN() }?.toFloat(),
                paddingHorizontal = json.optDouble("paddingHorizontal").takeIf { !it.isNaN() }?.toFloat(),
                paddingVertical = json.optDouble("paddingVertical").takeIf { !it.isNaN() }?.toFloat(),

                gap = json.optDouble("gap").takeIf { !it.isNaN() }?.toFloat(),
                rowGap = json.optDouble("rowGap").takeIf { !it.isNaN() }?.toFloat(),
                columnGap = json.optDouble("columnGap").takeIf { !it.isNaN() }?.toFloat(),

                borderWidth = json.optDouble("borderWidth").takeIf { !it.isNaN() }?.toFloat(),
                borderColor = json.optString("borderColor", null),
                borderRadius = json.optDouble("borderRadius").takeIf { !it.isNaN() }?.toFloat(),
                borderTopLeftRadius = json.optDouble("borderTopLeftRadius").takeIf { !it.isNaN() }?.toFloat(),
                borderTopRightRadius = json.optDouble("borderTopRightRadius").takeIf { !it.isNaN() }?.toFloat(),
                borderBottomLeftRadius = json.optDouble("borderBottomLeftRadius").takeIf { !it.isNaN() }?.toFloat(),
                borderBottomRightRadius = json.optDouble("borderBottomRightRadius").takeIf { !it.isNaN() }?.toFloat(),

                backgroundColor = json.optString("backgroundColor", null),
                opacity = json.optDouble("opacity").takeIf { !it.isNaN() }?.toFloat(),

                elevation = json.optDouble("elevation").takeIf { !it.isNaN() }?.toFloat(),
                shadowColor = json.optString("shadowColor", null),
                shadowOpacity = json.optDouble("shadowOpacity").takeIf { !it.isNaN() }?.toFloat(),
                shadowRadius = json.optDouble("shadowRadius").takeIf { !it.isNaN() }?.toFloat(),

                color = json.optString("color", null),
                fontSize = json.optDouble("fontSize").takeIf { !it.isNaN() }?.toFloat(),
                fontWeight = json.optString("fontWeight", null),
                fontStyle = json.optString("fontStyle", null),
                fontFamily = json.optString("fontFamily", null),
                lineHeight = json.optDouble("lineHeight").takeIf { !it.isNaN() }?.toFloat(),
                letterSpacing = json.optDouble("letterSpacing").takeIf { !it.isNaN() }?.toFloat(),
                textAlign = json.optString("textAlign", null),
                textDecorationLine = json.optString("textDecorationLine", null),
                textTransform = json.optString("textTransform", null),

                resizeMode = json.optString("resizeMode", null),
                tintColor = json.optString("tintColor", null),
                overflow = json.optString("overflow", null)
            )
        }

        private fun parseDimension(json: JSONObject, key: String): Any? {
            if (!json.has(key)) return null
            return try {
                json.getDouble(key).toFloat()
            } catch (e: Exception) {
                json.getString(key)
            }
        }
    }
}

// ============================================================================
// JSON Extensions
// ============================================================================

fun JSONObject.toMap(): Map<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    keys().forEach { key ->
        map[key] = when (val value = get(key)) {
            is JSONObject -> value.toMap()
            is JSONArray -> value.toList()
            JSONObject.NULL -> null
            else -> value
        }
    }
    return map
}

fun JSONObject.toStringMap(): Map<String, String> {
    val map = mutableMapOf<String, String>()
    keys().forEach { key ->
        map[key] = getString(key)
    }
    return map
}

fun JSONArray.toList(): List<Any?> {
    val list = mutableListOf<Any?>()
    for (i in 0 until length()) {
        list.add(when (val value = get(i)) {
            is JSONObject -> value.toMap()
            is JSONArray -> value.toList()
            JSONObject.NULL -> null
            else -> value
        })
    }
    return list
}

// ============================================================================
// STX Renderer
// ============================================================================

class STXRenderer(private val context: Context) {

    private val viewRegistry = mutableMapOf<String, View>()
    private var eventHandler: ((String, Map<String, Any?>) -> Unit)? = null

    /**
     * Set the event handler that will be called when native events occur
     */
    fun setEventHandler(handler: (String, Map<String, Any?>) -> Unit) {
        eventHandler = handler
    }

    /**
     * Render an STX node tree to native Android views
     */
    fun render(node: STXNode): View {
        val view = when (node.type) {
            "View" -> renderView(node)
            "Text" -> renderText(node)
            "Button" -> renderButton(node)
            "TextInput" -> renderTextInput(node)
            "Image" -> renderImage(node)
            "ScrollView" -> renderScrollView(node)
            "TouchableOpacity" -> renderTouchableOpacity(node)
            "Switch" -> renderSwitch(node)
            "ActivityIndicator" -> renderActivityIndicator(node)
            "SafeAreaView" -> renderSafeAreaView(node)
            "FlatList" -> renderFlatList(node)
            "Modal" -> renderModal(node)
            "Slider" -> renderSlider(node)
            else -> {
                android.util.Log.w("STX", "Unknown component type: ${node.type}, rendering as View")
                renderView(node)
            }
        }

        // Register view if it has a key
        node.key?.let { viewRegistry[it] = view }

        return view
    }

    /**
     * Render from JSON string
     */
    fun renderFromJson(json: String): View {
        val node = STXNode.fromJson(JSONObject(json))
        return render(node)
    }

    // ========================================================================
    // Component Renderers
    // ========================================================================

    private fun renderView(node: STXNode): ViewGroup {
        val layout = YogaLayout(context)

        applyStyle(layout, node.style)
        applyYogaLayout(layout, node.style)
        applyEvents(layout, node.events)

        // Render children
        for (child in node.children) {
            when (child) {
                is STXChild.Node -> {
                    val childView = render(child.node)
                    layout.addView(childView)
                }
                is STXChild.Text -> {
                    // View doesn't render text directly
                }
            }
        }

        return layout
    }

    private fun renderText(node: STXNode): TextView {
        val textView = TextView(context)

        // Collect text from children
        val text = StringBuilder()
        for (child in node.children) {
            if (child is STXChild.Text) {
                text.append(child.text)
            }
        }
        textView.text = text.toString()

        // Apply text styles
        applyTextStyle(textView, node.style)
        applyStyle(textView, node.style)
        applyYogaLayout(textView, node.style)
        applyEvents(textView, node.events)

        return textView
    }

    private fun renderButton(node: STXNode): Button {
        val button = Button(context)

        // Get title from props or children
        val title = node.props["title"] as? String
            ?: node.children.filterIsInstance<STXChild.Text>().firstOrNull()?.text
            ?: ""
        button.text = title

        // Apply styles
        applyTextStyle(button, node.style)
        applyButtonStyle(button, node.style)
        applyYogaLayout(button, node.style)

        // Handle onPress
        node.events["onPress"]?.let { handlerName ->
            button.setOnClickListener {
                eventHandler?.invoke(handlerName, emptyMap())
            }
        }

        return button
    }

    private fun renderTextInput(node: STXNode): EditText {
        val editText = EditText(context)

        // Apply props
        (node.props["placeholder"] as? String)?.let {
            editText.hint = it
        }
        (node.props["value"] as? String)?.let {
            editText.setText(it)
        }
        (node.props["secureTextEntry"] as? Boolean)?.takeIf { it }?.let {
            editText.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        (node.props["keyboardType"] as? String)?.let { type ->
            editText.inputType = when (type) {
                "numeric", "number-pad" -> InputType.TYPE_CLASS_NUMBER
                "decimal-pad" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
                "email-address" -> InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
                "phone-pad" -> InputType.TYPE_CLASS_PHONE
                else -> InputType.TYPE_CLASS_TEXT
            }
        }
        (node.props["multiline"] as? Boolean)?.takeIf { it }?.let {
            editText.inputType = editText.inputType or InputType.TYPE_TEXT_FLAG_MULTI_LINE
            editText.isSingleLine = false
        }

        // Apply styles
        applyTextStyle(editText, node.style)
        applyStyle(editText, node.style)
        applyYogaLayout(editText, node.style)

        // Handle events
        node.events["onChangeText"]?.let { handlerName ->
            editText.addTextChangedListener(object : android.text.TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: android.text.Editable?) {
                    eventHandler?.invoke(handlerName, mapOf("text" to (s?.toString() ?: "")))
                }
            })
        }
        node.events["onFocus"]?.let { handlerName ->
            editText.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) eventHandler?.invoke(handlerName, emptyMap())
            }
        }
        node.events["onBlur"]?.let { handlerName ->
            editText.setOnFocusChangeListener { _, hasFocus ->
                if (!hasFocus) eventHandler?.invoke(handlerName, emptyMap())
            }
        }

        return editText
    }

    private fun renderImage(node: STXNode): ImageView {
        val imageView = ImageView(context)

        // Set scale type based on resizeMode
        imageView.scaleType = when (node.style.resizeMode ?: node.props["resizeMode"] as? String) {
            "cover" -> ImageView.ScaleType.CENTER_CROP
            "contain" -> ImageView.ScaleType.FIT_CENTER
            "stretch" -> ImageView.ScaleType.FIT_XY
            "center" -> ImageView.ScaleType.CENTER
            else -> ImageView.ScaleType.FIT_CENTER
        }

        // Load image from source
        val source = node.props["source"]
        when (source) {
            is Map<*, *> -> {
                val uri = source["uri"] as? String
                uri?.let { loadImage(it, imageView) }
            }
            is String -> loadImage(source, imageView)
        }

        // Apply tint
        node.style.tintColor?.let { color ->
            imageView.setColorFilter(parseColor(color))
        }

        applyStyle(imageView, node.style)
        applyYogaLayout(imageView, node.style)
        applyEvents(imageView, node.events)

        return imageView
    }

    private fun loadImage(url: String, imageView: ImageView) {
        // Simple image loading - in production use Glide/Coil/Picasso
        Thread {
            try {
                val connection = java.net.URL(url).openConnection()
                connection.connect()
                val input = connection.getInputStream()
                val bitmap = android.graphics.BitmapFactory.decodeStream(input)
                imageView.post { imageView.setImageBitmap(bitmap) }
            } catch (e: Exception) {
                android.util.Log.e("STX", "Failed to load image: $url", e)
            }
        }.start()
    }

    private fun renderScrollView(node: STXNode): ScrollView {
        val isHorizontal = node.props["horizontal"] as? Boolean ?: false

        val scrollView: ViewGroup = if (isHorizontal) {
            HorizontalScrollView(context)
        } else {
            ScrollView(context)
        }

        val contentView = YogaLayout(context)

        for (child in node.children) {
            if (child is STXChild.Node) {
                val childView = render(child.node)
                contentView.addView(childView)
            }
        }

        (scrollView as ViewGroup).addView(contentView)

        applyStyle(scrollView, node.style)
        applyYogaLayout(scrollView, node.style)

        // Handle scroll events
        node.events["onScroll"]?.let { handlerName ->
            if (scrollView is ScrollView) {
                scrollView.viewTreeObserver.addOnScrollChangedListener {
                    eventHandler?.invoke(handlerName, mapOf(
                        "contentOffset" to mapOf(
                            "x" to scrollView.scrollX,
                            "y" to scrollView.scrollY
                        )
                    ))
                }
            }
        }

        return scrollView as ScrollView
    }

    private fun renderTouchableOpacity(node: STXNode): ViewGroup {
        val layout = YogaLayout(context)
        layout.isClickable = true
        layout.isFocusable = true

        val activeOpacity = (node.props["activeOpacity"] as? Number)?.toFloat() ?: 0.5f

        // Render children
        for (child in node.children) {
            if (child is STXChild.Node) {
                val childView = render(child.node)
                layout.addView(childView)
            }
        }

        applyStyle(layout, node.style)
        applyYogaLayout(layout, node.style)

        // Handle press with opacity animation
        node.events["onPress"]?.let { handlerName ->
            layout.setOnTouchListener { view, event ->
                when (event.action) {
                    android.view.MotionEvent.ACTION_DOWN -> {
                        view.alpha = activeOpacity
                    }
                    android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL -> {
                        view.alpha = 1.0f
                        if (event.action == android.view.MotionEvent.ACTION_UP) {
                            eventHandler?.invoke(handlerName, emptyMap())
                        }
                    }
                }
                true
            }
        }

        return layout
    }

    private fun renderSwitch(node: STXNode): Switch {
        val switch = Switch(context)

        // Apply props
        (node.props["value"] as? Boolean)?.let {
            switch.isChecked = it
        }
        (node.props["disabled"] as? Boolean)?.let {
            switch.isEnabled = !it
        }

        // Apply track/thumb colors
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            (node.props["trackColor"] as? Map<*, *>)?.let { colors ->
                val onColor = parseColor(colors["true"] as? String ?: colors["on"] as? String ?: "#34c759")
                val offColor = parseColor(colors["false"] as? String ?: colors["off"] as? String ?: "#e5e5ea")
                switch.trackTintList = android.content.res.ColorStateList(
                    arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()),
                    intArrayOf(onColor, offColor)
                )
            }
            (node.props["thumbColor"] as? String)?.let {
                switch.thumbTintList = android.content.res.ColorStateList.valueOf(parseColor(it))
            }
        }

        applyYogaLayout(switch, node.style)

        // Handle value change
        node.events["onValueChange"]?.let { handlerName ->
            switch.setOnCheckedChangeListener { _, isChecked ->
                eventHandler?.invoke(handlerName, mapOf("value" to isChecked))
            }
        }

        return switch
    }

    private fun renderActivityIndicator(node: STXNode): ProgressBar {
        val progressBar = ProgressBar(context)

        // Set size
        val size = node.props["size"] as? String ?: "small"
        val sizeValue = when (size) {
            "large" -> android.R.attr.progressBarStyleLarge
            else -> android.R.attr.progressBarStyle
        }

        // Apply color
        val color = node.style.color ?: node.props["color"] as? String
        color?.let {
            progressBar.indeterminateTintList = android.content.res.ColorStateList.valueOf(parseColor(it))
        }

        // Handle animating prop
        val animating = node.props["animating"] as? Boolean ?: true
        progressBar.visibility = if (animating) View.VISIBLE else View.GONE

        applyYogaLayout(progressBar, node.style)

        return progressBar
    }

    private fun renderSafeAreaView(node: STXNode): ViewGroup {
        val layout = YogaLayout(context)

        // Apply safe area insets on Android 28+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            layout.setOnApplyWindowInsetsListener { view, insets ->
                val displayCutout = insets.displayCutout
                displayCutout?.let {
                    view.setPadding(
                        it.safeInsetLeft,
                        it.safeInsetTop,
                        it.safeInsetRight,
                        it.safeInsetBottom
                    )
                }
                insets
            }
        }

        applyStyle(layout, node.style)
        applyYogaLayout(layout, node.style)

        for (child in node.children) {
            if (child is STXChild.Node) {
                val childView = render(child.node)
                layout.addView(childView)
            }
        }

        return layout
    }

    private fun renderFlatList(node: STXNode): androidx.recyclerview.widget.RecyclerView {
        val recyclerView = androidx.recyclerview.widget.RecyclerView(context)

        // Set layout manager
        val horizontal = node.props["horizontal"] as? Boolean ?: false
        val layoutManager = if (horizontal) {
            androidx.recyclerview.widget.LinearLayoutManager(context, androidx.recyclerview.widget.LinearLayoutManager.HORIZONTAL, false)
        } else {
            androidx.recyclerview.widget.LinearLayoutManager(context)
        }
        recyclerView.layoutManager = layoutManager

        // Number of columns for grid
        (node.props["numColumns"] as? Number)?.toInt()?.takeIf { it > 1 }?.let { columns ->
            recyclerView.layoutManager = androidx.recyclerview.widget.GridLayoutManager(context, columns)
        }

        applyStyle(recyclerView, node.style)
        applyYogaLayout(recyclerView, node.style)

        // Handle onEndReached
        node.events["onEndReached"]?.let { handlerName ->
            val threshold = (node.props["onEndReachedThreshold"] as? Number)?.toFloat() ?: 0.5f
            recyclerView.addOnScrollListener(object : androidx.recyclerview.widget.RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: androidx.recyclerview.widget.RecyclerView, dx: Int, dy: Int) {
                    val lm = recyclerView.layoutManager as? androidx.recyclerview.widget.LinearLayoutManager ?: return
                    val totalItems = lm.itemCount
                    val lastVisible = lm.findLastVisibleItemPosition()
                    if (lastVisible >= totalItems * (1 - threshold)) {
                        eventHandler?.invoke(handlerName, emptyMap())
                    }
                }
            })
        }

        return recyclerView
    }

    private fun renderModal(node: STXNode): FrameLayout {
        val container = FrameLayout(context)

        val visible = node.props["visible"] as? Boolean ?: false
        container.visibility = if (visible) View.VISIBLE else View.GONE

        // Semi-transparent background
        if (node.props["transparent"] != true) {
            container.setBackgroundColor(Color.parseColor("#80000000"))
        }

        // Handle onRequestClose (back button)
        node.events["onRequestClose"]?.let { handlerName ->
            container.isFocusableInTouchMode = true
            container.setOnKeyListener { _, keyCode, event ->
                if (keyCode == android.view.KeyEvent.KEYCODE_BACK && event.action == android.view.KeyEvent.ACTION_UP) {
                    eventHandler?.invoke(handlerName, emptyMap())
                    true
                } else false
            }
        }

        // Render children
        for (child in node.children) {
            if (child is STXChild.Node) {
                val childView = render(child.node)
                container.addView(childView)
            }
        }

        applyStyle(container, node.style)
        applyYogaLayout(container, node.style)

        return container
    }

    private fun renderSlider(node: STXNode): SeekBar {
        val seekBar = SeekBar(context)

        val minValue = (node.props["minimumValue"] as? Number)?.toFloat() ?: 0f
        val maxValue = (node.props["maximumValue"] as? Number)?.toFloat() ?: 1f
        val value = (node.props["value"] as? Number)?.toFloat() ?: minValue
        val step = (node.props["step"] as? Number)?.toFloat() ?: 0f

        seekBar.max = 1000 // Use 1000 steps for precision
        seekBar.progress = ((value - minValue) / (maxValue - minValue) * 1000).toInt()

        // Apply colors
        (node.props["minimumTrackTintColor"] as? String)?.let {
            seekBar.progressTintList = android.content.res.ColorStateList.valueOf(parseColor(it))
        }
        (node.props["maximumTrackTintColor"] as? String)?.let {
            seekBar.progressBackgroundTintList = android.content.res.ColorStateList.valueOf(parseColor(it))
        }
        (node.props["thumbTintColor"] as? String)?.let {
            seekBar.thumbTintList = android.content.res.ColorStateList.valueOf(parseColor(it))
        }

        applyYogaLayout(seekBar, node.style)

        // Handle value change
        node.events["onValueChange"]?.let { handlerName ->
            seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    if (fromUser) {
                        var newValue = minValue + (progress / 1000f) * (maxValue - minValue)
                        if (step > 0) {
                            newValue = (Math.round(newValue / step) * step).toFloat()
                        }
                        eventHandler?.invoke(handlerName, mapOf("value" to newValue))
                    }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
        }

        return seekBar
    }

    // ========================================================================
    // Style Application
    // ========================================================================

    private fun applyStyle(view: View, style: STXStyle) {
        // Background
        val drawable = GradientDrawable()
        var hasDrawable = false

        style.backgroundColor?.let {
            drawable.setColor(parseColor(it))
            hasDrawable = true
        }

        // Border
        style.borderWidth?.let { width ->
            val borderColor = style.borderColor?.let { parseColor(it) } ?: Color.BLACK
            drawable.setStroke(dpToPx(width).toInt(), borderColor)
            hasDrawable = true
        }

        // Border radius
        val radius = style.borderRadius?.let { dpToPx(it) } ?: 0f
        if (radius > 0 || style.borderTopLeftRadius != null || style.borderTopRightRadius != null ||
            style.borderBottomLeftRadius != null || style.borderBottomRightRadius != null) {

            val radii = floatArrayOf(
                style.borderTopLeftRadius?.let { dpToPx(it) } ?: radius,
                style.borderTopLeftRadius?.let { dpToPx(it) } ?: radius,
                style.borderTopRightRadius?.let { dpToPx(it) } ?: radius,
                style.borderTopRightRadius?.let { dpToPx(it) } ?: radius,
                style.borderBottomRightRadius?.let { dpToPx(it) } ?: radius,
                style.borderBottomRightRadius?.let { dpToPx(it) } ?: radius,
                style.borderBottomLeftRadius?.let { dpToPx(it) } ?: radius,
                style.borderBottomLeftRadius?.let { dpToPx(it) } ?: radius
            )
            drawable.cornerRadii = radii
            hasDrawable = true
        }

        if (hasDrawable) {
            view.background = drawable
        }

        // Opacity
        style.opacity?.let { view.alpha = it }

        // Elevation (Android shadow)
        style.elevation?.let {
            ViewCompat.setElevation(view, dpToPx(it))
        }

        // Z-index
        style.zIndex?.let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                view.translationZ = it.toFloat()
            }
        }

        // Overflow
        if (style.overflow == "hidden") {
            if (view is ViewGroup) {
                view.clipChildren = true
                view.clipToPadding = true
            }
        }
    }

    private fun applyTextStyle(textView: TextView, style: STXStyle) {
        // Color
        style.color?.let { textView.setTextColor(parseColor(it)) }

        // Font size
        val fontSize = style.fontSize ?: 16f
        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, fontSize)

        // Font weight and style
        val isBold = style.fontWeight in listOf("bold", "700", "800", "900")
        val isItalic = style.fontStyle == "italic"
        val typeface = when {
            isBold && isItalic -> Typeface.BOLD_ITALIC
            isBold -> Typeface.BOLD
            isItalic -> Typeface.ITALIC
            else -> Typeface.NORMAL
        }
        textView.setTypeface(textView.typeface, typeface)

        // Font family
        style.fontFamily?.let { family ->
            try {
                textView.typeface = Typeface.create(family, typeface)
            } catch (e: Exception) {
                // Font not found, use default
            }
        }

        // Text alignment
        textView.gravity = when (style.textAlign) {
            "left" -> Gravity.START
            "center" -> Gravity.CENTER
            "right" -> Gravity.END
            "justify" -> Gravity.START // Android doesn't support justify well
            else -> Gravity.START
        }

        // Line height
        style.lineHeight?.let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                textView.lineHeight = dpToPx(it).toInt()
            }
        }

        // Letter spacing
        style.letterSpacing?.let {
            textView.letterSpacing = it / fontSize // Convert to em
        }

        // Text transform
        style.textTransform?.let { transform ->
            val text = textView.text.toString()
            textView.text = when (transform) {
                "uppercase" -> text.uppercase()
                "lowercase" -> text.lowercase()
                "capitalize" -> text.split(" ").joinToString(" ") {
                    it.replaceFirstChar { c -> c.uppercase() }
                }
                else -> text
            }
        }

        // Text decoration
        style.textDecorationLine?.let { decoration ->
            textView.paintFlags = textView.paintFlags or when (decoration) {
                "underline" -> android.graphics.Paint.UNDERLINE_TEXT_FLAG
                "line-through" -> android.graphics.Paint.STRIKE_THRU_TEXT_FLAG
                "underline line-through" -> android.graphics.Paint.UNDERLINE_TEXT_FLAG or android.graphics.Paint.STRIKE_THRU_TEXT_FLAG
                else -> 0
            }
        }
    }

    private fun applyButtonStyle(button: Button, style: STXStyle) {
        // Remove default button styling for more control
        button.stateListAnimator = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            button.elevation = 0f
        }

        applyStyle(button, style)
    }

    private fun applyEvents(view: View, events: Map<String, String>) {
        events["onPress"]?.let { handlerName ->
            view.isClickable = true
            view.isFocusable = true
            view.setOnClickListener {
                eventHandler?.invoke(handlerName, emptyMap())
            }
        }

        events["onLongPress"]?.let { handlerName ->
            view.isLongClickable = true
            view.setOnLongClickListener {
                eventHandler?.invoke(handlerName, emptyMap())
                true
            }
        }

        events["onLayout"]?.let { handlerName ->
            view.addOnLayoutChangeListener { _, left, top, right, bottom, _, _, _, _ ->
                eventHandler?.invoke(handlerName, mapOf(
                    "layout" to mapOf(
                        "x" to left,
                        "y" to top,
                        "width" to (right - left),
                        "height" to (bottom - top)
                    )
                ))
            }
        }
    }

    // ========================================================================
    // Yoga Layout Configuration
    // ========================================================================

    private fun applyYogaLayout(view: View, style: STXStyle) {
        // Get or create YogaNode for this view
        val yogaNode = (view.layoutParams as? YogaLayout.LayoutParams)?.node
            ?: YogaNodeFactory.create().also {
                view.layoutParams = YogaLayout.LayoutParams(it)
            }

        // Display
        if (style.display == "none") {
            yogaNode.display = YogaDisplay.NONE
        }

        // Flex
        style.flex?.let { yogaNode.flex = it }
        style.flexGrow?.let { yogaNode.flexGrow = it }
        style.flexShrink?.let { yogaNode.flexShrink = it }

        // Flex direction
        style.flexDirection?.let { dir ->
            yogaNode.flexDirection = when (dir) {
                "row" -> YogaFlexDirection.ROW
                "column" -> YogaFlexDirection.COLUMN
                "row-reverse" -> YogaFlexDirection.ROW_REVERSE
                "column-reverse" -> YogaFlexDirection.COLUMN_REVERSE
                else -> YogaFlexDirection.COLUMN
            }
        }

        // Flex wrap
        style.flexWrap?.let { wrap ->
            yogaNode.wrap = when (wrap) {
                "wrap" -> YogaWrap.WRAP
                "nowrap" -> YogaWrap.NO_WRAP
                "wrap-reverse" -> YogaWrap.WRAP_REVERSE
                else -> YogaWrap.NO_WRAP
            }
        }

        // Justify content
        style.justifyContent?.let { justify ->
            yogaNode.justifyContent = when (justify) {
                "flex-start" -> YogaJustify.FLEX_START
                "center" -> YogaJustify.CENTER
                "flex-end" -> YogaJustify.FLEX_END
                "space-between" -> YogaJustify.SPACE_BETWEEN
                "space-around" -> YogaJustify.SPACE_AROUND
                "space-evenly" -> YogaJustify.SPACE_EVENLY
                else -> YogaJustify.FLEX_START
            }
        }

        // Align items
        style.alignItems?.let { align ->
            yogaNode.alignItems = when (align) {
                "flex-start" -> YogaAlign.FLEX_START
                "center" -> YogaAlign.CENTER
                "flex-end" -> YogaAlign.FLEX_END
                "stretch" -> YogaAlign.STRETCH
                "baseline" -> YogaAlign.BASELINE
                else -> YogaAlign.STRETCH
            }
        }

        // Align self
        style.alignSelf?.let { align ->
            yogaNode.alignSelf = when (align) {
                "auto" -> YogaAlign.AUTO
                "flex-start" -> YogaAlign.FLEX_START
                "center" -> YogaAlign.CENTER
                "flex-end" -> YogaAlign.FLEX_END
                "stretch" -> YogaAlign.STRETCH
                "baseline" -> YogaAlign.BASELINE
                else -> YogaAlign.AUTO
            }
        }

        // Dimensions
        applyDimension(style.width) { value, unit ->
            if (unit == YogaUnit.PERCENT) yogaNode.setWidthPercent(value)
            else if (unit == YogaUnit.AUTO) yogaNode.setWidthAuto()
            else yogaNode.setWidth(dpToPx(value))
        }
        applyDimension(style.height) { value, unit ->
            if (unit == YogaUnit.PERCENT) yogaNode.setHeightPercent(value)
            else if (unit == YogaUnit.AUTO) yogaNode.setHeightAuto()
            else yogaNode.setHeight(dpToPx(value))
        }
        applyDimension(style.minWidth) { value, unit ->
            if (unit == YogaUnit.PERCENT) yogaNode.setMinWidthPercent(value)
            else yogaNode.setMinWidth(dpToPx(value))
        }
        applyDimension(style.maxWidth) { value, unit ->
            if (unit == YogaUnit.PERCENT) yogaNode.setMaxWidthPercent(value)
            else yogaNode.setMaxWidth(dpToPx(value))
        }
        applyDimension(style.minHeight) { value, unit ->
            if (unit == YogaUnit.PERCENT) yogaNode.setMinHeightPercent(value)
            else yogaNode.setMinHeight(dpToPx(value))
        }
        applyDimension(style.maxHeight) { value, unit ->
            if (unit == YogaUnit.PERCENT) yogaNode.setMaxHeightPercent(value)
            else yogaNode.setMaxHeight(dpToPx(value))
        }

        // Aspect ratio
        style.aspectRatio?.let { yogaNode.aspectRatio = it }

        // Position
        style.position?.let { pos ->
            yogaNode.positionType = when (pos) {
                "absolute" -> YogaPositionType.ABSOLUTE
                else -> YogaPositionType.RELATIVE
            }
        }
        style.top?.let { yogaNode.setPosition(YogaEdge.TOP, dpToPx(it)) }
        style.right?.let { yogaNode.setPosition(YogaEdge.RIGHT, dpToPx(it)) }
        style.bottom?.let { yogaNode.setPosition(YogaEdge.BOTTOM, dpToPx(it)) }
        style.left?.let { yogaNode.setPosition(YogaEdge.LEFT, dpToPx(it)) }

        // Padding
        style.padding?.let { yogaNode.setPadding(YogaEdge.ALL, dpToPx(it)) }
        style.paddingTop?.let { yogaNode.setPadding(YogaEdge.TOP, dpToPx(it)) }
        style.paddingRight?.let { yogaNode.setPadding(YogaEdge.RIGHT, dpToPx(it)) }
        style.paddingBottom?.let { yogaNode.setPadding(YogaEdge.BOTTOM, dpToPx(it)) }
        style.paddingLeft?.let { yogaNode.setPadding(YogaEdge.LEFT, dpToPx(it)) }
        style.paddingHorizontal?.let {
            yogaNode.setPadding(YogaEdge.HORIZONTAL, dpToPx(it))
        }
        style.paddingVertical?.let {
            yogaNode.setPadding(YogaEdge.VERTICAL, dpToPx(it))
        }

        // Margin
        style.margin?.let { yogaNode.setMargin(YogaEdge.ALL, dpToPx(it)) }
        style.marginTop?.let { yogaNode.setMargin(YogaEdge.TOP, dpToPx(it)) }
        style.marginRight?.let { yogaNode.setMargin(YogaEdge.RIGHT, dpToPx(it)) }
        style.marginBottom?.let { yogaNode.setMargin(YogaEdge.BOTTOM, dpToPx(it)) }
        style.marginLeft?.let { yogaNode.setMargin(YogaEdge.LEFT, dpToPx(it)) }
        style.marginHorizontal?.let {
            yogaNode.setMargin(YogaEdge.HORIZONTAL, dpToPx(it))
        }
        style.marginVertical?.let {
            yogaNode.setMargin(YogaEdge.VERTICAL, dpToPx(it))
        }

        // Gap
        style.gap?.let {
            yogaNode.setGap(YogaGutter.ALL, dpToPx(it))
        }
        style.rowGap?.let {
            yogaNode.setGap(YogaGutter.ROW, dpToPx(it))
        }
        style.columnGap?.let {
            yogaNode.setGap(YogaGutter.COLUMN, dpToPx(it))
        }
    }

    private inline fun applyDimension(value: Any?, apply: (Float, YogaUnit) -> Unit) {
        when (value) {
            is Float -> apply(value, YogaUnit.POINT)
            is Int -> apply(value.toFloat(), YogaUnit.POINT)
            is Double -> apply(value.toFloat(), YogaUnit.POINT)
            is String -> {
                when {
                    value == "auto" -> apply(0f, YogaUnit.AUTO)
                    value.endsWith("%") -> {
                        val num = value.dropLast(1).toFloatOrNull() ?: 0f
                        apply(num, YogaUnit.PERCENT)
                    }
                    else -> value.toFloatOrNull()?.let { apply(it, YogaUnit.POINT) }
                }
            }
        }
    }

    // ========================================================================
    // Utilities
    // ========================================================================

    private fun dpToPx(dp: Float): Float {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            context.resources.displayMetrics
        )
    }

    private fun parseColor(hex: String?): Int {
        if (hex == null) return Color.TRANSPARENT
        return try {
            Color.parseColor(if (hex.startsWith("#")) hex else "#$hex")
        } catch (e: Exception) {
            Color.TRANSPARENT
        }
    }

    /**
     * Get a view by its key
     */
    fun getView(key: String): View? = viewRegistry[key]

    /**
     * Update a view's style
     */
    fun updateStyle(key: String, style: STXStyle) {
        viewRegistry[key]?.let { view ->
            applyStyle(view, style)
            applyYogaLayout(view, style)
            view.requestLayout()
        }
    }
}

// ============================================================================
// Yoga Layout Container
// ============================================================================

/**
 * A ViewGroup that uses Yoga for layout
 */
class YogaLayout(context: Context) : ViewGroup(context) {

    private val yogaNode: YogaNode = YogaNodeFactory.create()

    class LayoutParams(val node: YogaNode) : ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        // Calculate layout using Yoga
        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val widthSize = MeasureSpec.getSize(widthMeasureSpec).toFloat()
        val heightMode = MeasureSpec.getMode(heightMeasureSpec)
        val heightSize = MeasureSpec.getSize(heightMeasureSpec).toFloat()

        yogaNode.setWidth(if (widthMode == MeasureSpec.UNSPECIFIED) YogaConstants.UNDEFINED else widthSize)
        yogaNode.setHeight(if (heightMode == MeasureSpec.UNSPECIFIED) YogaConstants.UNDEFINED else heightSize)

        // Sync children to Yoga nodes
        syncChildrenToYoga()

        yogaNode.calculateLayout(
            if (widthMode == MeasureSpec.UNSPECIFIED) YogaConstants.UNDEFINED else widthSize,
            if (heightMode == MeasureSpec.UNSPECIFIED) YogaConstants.UNDEFINED else heightSize
        )

        setMeasuredDimension(
            yogaNode.layoutWidth.toInt(),
            yogaNode.layoutHeight.toInt()
        )
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val childNode = (child.layoutParams as? LayoutParams)?.node
                ?: yogaNode.getChildAt(i)

            child.layout(
                childNode.layoutX.toInt(),
                childNode.layoutY.toInt(),
                (childNode.layoutX + childNode.layoutWidth).toInt(),
                (childNode.layoutY + childNode.layoutHeight).toInt()
            )
        }
    }

    private fun syncChildrenToYoga() {
        // Remove all yoga children first
        while (yogaNode.childCount > 0) {
            yogaNode.removeChildAt(0)
        }

        // Add children back
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val childNode = (child.layoutParams as? LayoutParams)?.node
                ?: YogaNodeFactory.create()

            // Measure child to get intrinsic size
            child.measure(
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
            )

            // Set measured size as Yoga dimensions if not already set
            if (childNode.width.unit == YogaUnit.UNDEFINED) {
                childNode.setWidth(child.measuredWidth.toFloat())
            }
            if (childNode.height.unit == YogaUnit.UNDEFINED) {
                childNode.setHeight(child.measuredHeight.toFloat())
            }

            yogaNode.addChildAt(childNode, i)
        }
    }

    override fun generateLayoutParams(attrs: android.util.AttributeSet?): LayoutParams {
        return LayoutParams(YogaNodeFactory.create())
    }

    override fun generateDefaultLayoutParams(): LayoutParams {
        return LayoutParams(YogaNodeFactory.create())
    }

    override fun checkLayoutParams(p: ViewGroup.LayoutParams?): Boolean {
        return p is LayoutParams
    }
}
