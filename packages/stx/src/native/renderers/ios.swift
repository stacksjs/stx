/**
 * STX Native iOS Renderer
 *
 * Renders STX IR to native UIKit views.
 * Uses Yoga for flexbox layout.
 */

import UIKit
import JavaScriptCore
import YogaKit
import ObjectiveC

// Target authored nodes without changing a control's enabled state or UIKit's
// implementation children. The maintained Craft host uses the same policy.
private var stxPointerEventsKey: UInt8 = 0

private func stxPointerHitTest(_ view: UIView, point: CGPoint, event: UIEvent?, native: () -> UIView?) -> UIView? {
    let mode = objc_getAssociatedObject(view, &stxPointerEventsKey) as? String ?? "auto"
    if mode == "none" { return nil }
    if mode == "auto" { return native() }
    guard let hit = native() else { return nil }
    var candidate: UIView? = hit
    var authoredDescendant = false
    while let current = candidate, current !== view {
        if objc_getAssociatedObject(current, &stxPointerEventsKey) != nil { authoredDescendant = true; break }
        candidate = current.superview
    }
    if mode == "box-none" { return authoredDescendant ? hit : nil }
    guard view.point(inside: point, with: event) else { return nil }
    return authoredDescendant ? view : hit
}

private final class STXPointerView: UIView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerText: UILabel {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerButton: UIButton {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerInput: UITextField {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerImage: UIImageView {
    private var storedImage: UIImage?
    private var fittedImage: UIImageView?
    private var fit: String?
    private var alignment = CGPoint(x: 0.5, y: 0.5)

    override var image: UIImage? {
        get { storedImage }
        set {
            storedImage = newValue
            if fit == nil { super.image = newValue }
            else { fittedImage?.image = newValue; setNeedsLayout() }
        }
    }

    func configureGeometry(fit rawFit: String?, position: String?) {
        guard rawFit != nil || position != nil else {
            fit = nil; fittedImage?.removeFromSuperview(); fittedImage = nil
            super.image = storedImage
            return
        }
        fit = ["fill", "contain", "cover", "none", "scale-down"].contains(rawFit ?? "") ? rawFit : "fill"
        var parts = (position ?? "center").lowercased().split(whereSeparator: { $0.isWhitespace }).map(String.init)
        if parts.count == 1 { parts = ["top", "bottom"].contains(parts[0]) ? ["center", parts[0]] : [parts[0], "center"] }
        else if parts.count == 2 && (["top", "bottom"].contains(parts[0]) || ["left", "right"].contains(parts[1])) { parts.swapAt(0, 1) }
        func fraction(_ value: String, low: String, high: String) -> CGFloat? {
            if value == low { return 0 }; if value == high { return 1 }; if value == "center" { return 0.5 }
            guard value.hasSuffix("%"), let number = Double(value.dropLast()), number.isFinite else { return nil }
            return CGFloat(number / 100)
        }
        alignment = CGPoint(x: 0.5, y: 0.5)
        if parts.count == 2, let x = fraction(parts[0], low: "left", high: "right"), let y = fraction(parts[1], low: "top", high: "bottom") { alignment = CGPoint(x: x, y: y) }
        if fittedImage == nil {
            let child = UIImageView(); child.contentMode = .scaleToFill; child.isUserInteractionEnabled = false
            addSubview(child); fittedImage = child
        }
        super.image = nil
        fittedImage?.image = storedImage
        clipsToBounds = true
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard let fit, let child = fittedImage, let size = storedImage?.size, size.width > 0, size.height > 0 else { return }
        let contain = min(bounds.width / size.width, bounds.height / size.height)
        let scale = fit == "cover" ? max(bounds.width / size.width, bounds.height / size.height)
            : fit == "none" ? 1 : fit == "scale-down" ? min(1, contain) : contain
        let rendered = fit == "fill" ? bounds.size : CGSize(width: size.width * scale, height: size.height * scale)
        child.frame = CGRect(x: (bounds.width - rendered.width) * alignment.x, y: (bounds.height - rendered.height) * alignment.y, width: rendered.width, height: rendered.height)
        child.tintColor = tintColor
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerScroll: UIScrollView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerSwitch: UISwitch {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerIndicator: UIActivityIndicatorView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerSlider: UISlider {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private final class STXPointerPicker: UIPickerView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }
}

private struct STXPickerOption {
    let label: String
    let value: Any
}

private final class STXPickerAdapter: NSObject, UIPickerViewDataSource, UIPickerViewDelegate {
    let options: [STXPickerOption]
    let onChange: (STXPickerOption, Int) -> Void

    init(options: [STXPickerOption], onChange: @escaping (STXPickerOption, Int) -> Void) {
        self.options = options
        self.onChange = onChange
    }

    func numberOfComponents(in pickerView: UIPickerView) -> Int { 1 }

    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        options.count
    }

    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        options[row].label
    }

    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        guard options.indices.contains(row) else { return }
        onChange(options[row], row)
    }
}

// MARK: - STX IR Types (Mirror of TypeScript definitions)

struct STXNode: Codable {
    let type: String
    let key: String?
    let props: [String: AnyCodable]
    let style: STXStyle
    let events: [String: String]
    let children: [STXChild]
}

enum STXChild: Codable {
    case node(STXNode)
    case text(String)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let text = try? container.decode(String.self) {
            self = .text(text)
        } else {
            self = .node(try container.decode(STXNode.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .text(let text):
            try container.encode(text)
        case .node(let node):
            try container.encode(node)
        }
    }
}

struct STXStyle: Codable {
    var pointerEvents: String?
    // Layout
    var display: String?
    var flex: CGFloat?
    var flexGrow: CGFloat?
    var flexShrink: CGFloat?
    var flexDirection: String?
    var flexWrap: String?
    var justifyContent: String?
    var alignItems: String?
    var alignSelf: String?

    // Positioning
    var position: String?
    var top: CGFloat?
    var right: CGFloat?
    var bottom: CGFloat?
    var left: CGFloat?
    var zIndex: Int?

    // Dimensions
    var width: DimensionValue?
    var height: DimensionValue?
    var minWidth: DimensionValue?
    var maxWidth: DimensionValue?
    var minHeight: DimensionValue?
    var maxHeight: DimensionValue?

    // Spacing
    var padding: CGFloat?
    var paddingTop: CGFloat?
    var paddingRight: CGFloat?
    var paddingBottom: CGFloat?
    var paddingLeft: CGFloat?
    var paddingHorizontal: CGFloat?
    var paddingVertical: CGFloat?

    var margin: CGFloat?
    var marginTop: CGFloat?
    var marginRight: CGFloat?
    var marginBottom: CGFloat?
    var marginLeft: CGFloat?
    var marginHorizontal: CGFloat?
    var marginVertical: CGFloat?

    var gap: CGFloat?

    // Border
    var borderWidth: CGFloat?
    var borderColor: String?
    var borderRadius: CGFloat?
    var borderTopLeftRadius: CGFloat?
    var borderTopRightRadius: CGFloat?
    var borderBottomLeftRadius: CGFloat?
    var borderBottomRightRadius: CGFloat?

    // Background
    var backgroundColor: String?
    var gradientDirection: String?
    var gradientFrom: String?
    var gradientVia: String?
    var gradientTo: String?
    var opacity: CGFloat?

    // Shadow
    var shadowColor: String?
    var shadowOffset: STXShadowOffset?
    var shadowOpacity: CGFloat?
    var shadowRadius: CGFloat?

    // Text
    var color: String?
    // Vector drawing (svg.ts)
    var fill: String?
    var stroke: String?
    var strokeWidth: CGFloat?
    var fontSize: CGFloat?
    var fontWeight: String?
    var fontStyle: String?
    var fontFamily: String?
    var lineHeight: CGFloat?
    var letterSpacing: CGFloat?
    var textAlign: String?
    var textDecorationLine: String?
    var textDecorationColor: String?
    var textTransform: String?

    // Image
    var resizeMode: String?
    var objectFit: String?
    var objectPosition: String?
    var tintColor: String?

    // Clipping
    var overflow: String?
}

struct STXShadowOffset: Codable {
    let width: CGFloat
    let height: CGFloat
}

enum DimensionValue: Codable {
    case points(CGFloat)
    case percent(CGFloat)
    case auto

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let value = try? container.decode(CGFloat.self) {
            self = .points(value)
        } else if let str = try? container.decode(String.self) {
            if str == "auto" {
                self = .auto
            } else if str.hasSuffix("%") {
                let num = CGFloat(Double(str.dropLast()) ?? 0)
                self = .percent(num)
            } else {
                self = .points(CGFloat(Double(str) ?? 0))
            }
        } else {
            self = .auto
        }
    }
}

// MARK: - STX Renderer

class STXRenderer {
    private let jsContext: JSContext
    private var viewRegistry: [String: UIView] = [:]
    private var eventHandlers: [String: String] = [:]
    private var pickerAdapters: [ObjectIdentifier: STXPickerAdapter] = [:]

    init() {
        jsContext = JSContext()!
        setupJSBridge()
    }

    // MARK: - JavaScript Bridge

    private func setupJSBridge() {
        // Expose native functions to JavaScript
        let nativeBridge: @convention(block) (String, [String: Any]) -> Void = { [weak self] method, params in
            self?.handleJSCall(method: method, params: params)
        }
        jsContext.setObject(nativeBridge, forKeyedSubscript: "nativeBridge" as NSString)

        // Console.log bridge
        let consoleLog: @convention(block) (String) -> Void = { message in
            print("[STX JS] \(message)")
        }
        jsContext.setObject(consoleLog, forKeyedSubscript: "consoleLog" as NSString)
        jsContext.evaluateScript("console = { log: consoleLog, warn: consoleLog, error: consoleLog }")
    }

    private func handleJSCall(method: String, params: [String: Any]) {
        // Handle calls from JavaScript to native
        print("[STX Native] JS called: \(method) with params: \(params)")
    }

    // MARK: - Render Methods

    func render(_ node: STXNode) -> UIView {
        let view: UIView
        switch node.type {
        case "View":
            view = renderView(node)
        case "Text":
            view = renderText(node)
        case "Button", "Link":
            view = renderButton(node)
        case "TextInput":
            view = renderTextInput(node)
        case "Image":
            view = renderImage(node)
        case "ScrollView":
            view = renderScrollView(node)
        case "TouchableOpacity":
            view = renderTouchableOpacity(node)
        case "Switch":
            view = renderSwitch(node)
        case "ActivityIndicator":
            view = renderActivityIndicator(node)
        case "SafeAreaView":
            view = renderSafeAreaView(node)
        case "Modal":
            view = renderModal(node)
        case "Slider":
            view = renderSlider(node)
        case "Picker":
            view = renderPicker(node)
        case "Svg":
            view = renderSvg(node)
        default:
            print("[STX] Unknown component type: \(node.type), rendering as View")
            view = renderView(node)
        }
        let raw = node.props["pointerEvents"]?.value as? String ?? node.style.pointerEvents ?? "auto"
        let policy = ["auto", "none", "box-none", "box-only"].contains(raw) ? raw : "auto"
        objc_setAssociatedObject(view, &stxPointerEventsKey, policy as NSString, .OBJC_ASSOCIATION_COPY_NONATOMIC)
        return view
    }

    // MARK: - Component Renderers

    /// A vector drawing: the shapes below it, replayed from their `geometry`
    /// commands (svg.ts) and scaled from the viewBox to the view.
    private func renderSvg(_ node: STXNode) -> UIView {
        let view = STXSvgView(node: node)
        view.backgroundColor = .clear
        applyStyle(to: view, style: node.style)
        configureYogaLayout(view: view, style: node.style)
        return view
    }

    private func renderView(_ node: STXNode) -> UIView {
        let view = STXPointerView()
        applyStyle(to: view, style: node.style)
        applyEvents(to: view, events: node.events)

        for child in node.children {
            switch child {
            case .node(let childNode):
                let childView = render(childNode)
                view.addSubview(childView)
            case .text(_):
                // View doesn't render text directly
                break
            }
        }

        configureYogaLayout(view: view, style: node.style)
        return view
    }

    private func renderText(_ node: STXNode) -> UILabel {
        let label = STXPointerText()
        label.numberOfLines = 0

        // Collect text from children
        var text = ""
        for child in node.children {
            if case .text(let str) = child {
                text += str
            }
        }
        label.text = text

        applyTextStyle(to: label, style: node.style)
        applyEvents(to: label, events: node.events)
        configureYogaLayout(view: label, style: node.style)

        return label
    }

    private func renderButton(_ node: STXNode) -> UIButton {
        let button = STXPointerButton(type: .system)

        // Get title from children or props
        if let title = node.props["title"]?.value as? String {
            button.setTitle(title, for: .normal)
        } else {
            for child in node.children {
                if case .text(let str) = child {
                    button.setTitle(str, for: .normal)
                    break
                }
            }
        }

        if let colorHex = node.style.color {
            button.setTitleColor(UIColor(hex: colorHex), for: .normal)
        }

        if let bgColorHex = node.style.backgroundColor {
            button.backgroundColor = UIColor(hex: bgColorHex)
        }

        if let radius = node.style.borderRadius {
            button.layer.cornerRadius = radius
        }

        // Handle onPress event
        if let handlerName = node.events["onPress"] {
            button.addTarget(self, action: #selector(handleButtonPress(_:)), for: .touchUpInside)
            button.accessibilityIdentifier = handlerName
        }

        configureYogaLayout(view: button, style: node.style)
        return button
    }

    @objc private func handleButtonPress(_ sender: UIButton) {
        guard let handlerName = sender.accessibilityIdentifier else { return }
        jsContext.evaluateScript("\(handlerName)()")
    }

    private func renderTextInput(_ node: STXNode) -> UITextField {
        let textField = STXPointerInput()
        textField.borderStyle = .none

        if let placeholder = node.props["placeholder"]?.value as? String {
            textField.placeholder = placeholder
        }

        if let value = node.props["value"]?.value as? String {
            textField.text = value
        }

        if let colorHex = node.style.color {
            textField.textColor = UIColor(hex: colorHex)
        }

        if let bgColorHex = node.style.backgroundColor {
            textField.backgroundColor = UIColor(hex: bgColorHex)
        }

        if let fontSize = node.style.fontSize {
            textField.font = UIFont.systemFont(ofSize: fontSize)
        }

        applyStyle(to: textField, style: node.style)
        configureYogaLayout(view: textField, style: node.style)
        return textField
    }

    private func renderImage(_ node: STXNode) -> UIImageView {
        let imageView = STXPointerImage()
        switch node.style.resizeMode ?? node.props["resizeMode"]?.value as? String {
        case "cover": imageView.contentMode = .scaleAspectFill
        case "stretch": imageView.contentMode = .scaleToFill
        case "center": imageView.contentMode = .center
        default: imageView.contentMode = .scaleAspectFit
        }

        imageView.configureGeometry(fit: (node.props["objectFit"]?.value as? String) ?? node.style.objectFit,
            position: (node.props["objectPosition"]?.value as? String) ?? node.style.objectPosition)
        if let tint = node.style.tintColor.flatMap(UIColor.init(hex:)) {
            imageView.tintColor = tint
        }

        let source = node.props["source"]?.value
        if let uri = (source as? String) ?? ((source as? [String: Any])?["uri"] as? String) {
            loadImage(from: uri, into: imageView, renderAsTemplate: node.style.tintColor != nil)
        }

        applyStyle(to: imageView, style: node.style)
        configureYogaLayout(view: imageView, style: node.style)
        return imageView
    }

    private func loadImage(from urlString: String, into imageView: UIImageView, renderAsTemplate: Bool) {
        guard let url = URL(string: urlString) else { return }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data, let image = UIImage(data: data) {
                DispatchQueue.main.async {
                    imageView.image = renderAsTemplate ? image.withRenderingMode(.alwaysTemplate) : image
                }
            }
        }.resume()
    }

    private func renderScrollView(_ node: STXNode) -> UIScrollView {
        let scrollView = STXPointerScroll()
        let contentView = STXPointerView()

        scrollView.addSubview(contentView)

        for child in node.children {
            if case .node(let childNode) = child {
                let childView = render(childNode)
                contentView.addSubview(childView)
            }
        }

        applyStyle(to: scrollView, style: node.style)
        configureYogaLayout(view: scrollView, style: node.style)
        return scrollView
    }

    private func renderTouchableOpacity(_ node: STXNode) -> UIView {
        let view = STXPointerView()
        view.isUserInteractionEnabled = true

        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        view.addGestureRecognizer(tapGesture)

        if let handlerName = node.events["onPress"] {
            view.accessibilityIdentifier = handlerName
        }

        for child in node.children {
            if case .node(let childNode) = child {
                let childView = render(childNode)
                view.addSubview(childView)
            }
        }

        applyStyle(to: view, style: node.style)
        configureYogaLayout(view: view, style: node.style)
        return view
    }

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        guard let view = gesture.view,
              let handlerName = view.accessibilityIdentifier else { return }

        // Animate opacity
        UIView.animate(withDuration: 0.1, animations: {
            view.alpha = 0.5
        }) { _ in
            UIView.animate(withDuration: 0.1) {
                view.alpha = 1.0
            }
        }

        jsContext.evaluateScript("\(handlerName)()")
    }

    private func renderSwitch(_ node: STXNode) -> UISwitch {
        let switchView = STXPointerSwitch()

        if let value = node.props["value"]?.value as? Bool {
            switchView.isOn = value
        }

        if let handlerName = node.events["onValueChange"] {
            switchView.accessibilityIdentifier = handlerName
            switchView.addTarget(self, action: #selector(handleSwitchChange(_:)), for: .valueChanged)
        }

        configureYogaLayout(view: switchView, style: node.style)
        return switchView
    }

    @objc private func handleSwitchChange(_ sender: UISwitch) {
        guard let handlerName = sender.accessibilityIdentifier else { return }
        jsContext.evaluateScript("\(handlerName)(\(sender.isOn))")
    }

    private func renderActivityIndicator(_ node: STXNode) -> UIActivityIndicatorView {
        let indicator = STXPointerIndicator(style: .medium)

        if let colorHex = node.style.color ?? node.props["color"]?.value as? String {
            indicator.color = UIColor(hex: colorHex)
        }

        if let animating = node.props["animating"]?.value as? Bool, animating {
            indicator.startAnimating()
        }

        configureYogaLayout(view: indicator, style: node.style)
        return indicator
    }

    private func renderSafeAreaView(_ node: STXNode) -> UIView {
        let view = STXPointerView()
        // Safe area will be handled by layout constraints
        applyStyle(to: view, style: node.style)

        for child in node.children {
            if case .node(let childNode) = child {
                let childView = render(childNode)
                view.addSubview(childView)
            }
        }

        configureYogaLayout(view: view, style: node.style)
        return view
    }

    private func renderModal(_ node: STXNode) -> UIView {
        let container = STXPointerView()
        container.isHidden = !(node.props["visible"]?.value as? Bool ?? false)

        if node.props["transparent"]?.value as? Bool != true {
            container.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        }

        for child in node.children {
            if case .node(let childNode) = child {
                container.addSubview(render(childNode))
            }
        }

        applyStyle(to: container, style: node.style)
        configureYogaLayout(view: container, style: node.style)
        return container
    }

    private func renderSlider(_ node: STXNode) -> UISlider {
        let slider = STXPointerSlider()
        func number(_ name: String) -> Double? {
            if let value = node.props[name]?.value as? Double { return value }
            if let value = node.props[name]?.value as? Int { return Double(value) }
            return nil
        }
        slider.minimumValue = Float(number("minimumValue") ?? 0)
        slider.maximumValue = Float(number("maximumValue") ?? 1)
        slider.value = Float(number("value") ?? Double(slider.minimumValue))

        if let color = node.props["minimumTrackTintColor"]?.value as? String {
            slider.minimumTrackTintColor = UIColor(hex: color)
        }
        if let color = node.props["maximumTrackTintColor"]?.value as? String {
            slider.maximumTrackTintColor = UIColor(hex: color)
        }
        if let color = node.props["thumbTintColor"]?.value as? String {
            slider.thumbTintColor = UIColor(hex: color)
        }
        if let handlerName = node.events["onValueChange"] {
            slider.accessibilityIdentifier = handlerName
            slider.accessibilityValue = String(number("step") ?? 0)
            slider.addTarget(self, action: #selector(handleSliderChange(_:)), for: .valueChanged)
        }

        configureYogaLayout(view: slider, style: node.style)
        return slider
    }

    @objc private func handleSliderChange(_ sender: UISlider) {
        guard let handlerName = sender.accessibilityIdentifier else { return }
        let step = Float(sender.accessibilityValue ?? "0") ?? 0
        if step > 0 {
            sender.value = round(sender.value / step) * step
        }
        jsContext.evaluateScript("\(handlerName)(\(sender.value))")
    }

    private func renderPicker(_ node: STXNode) -> UIPickerView {
        let picker = STXPointerPicker()
        let rawItems = node.props["items"]?.value as? [Any] ?? []
        let options = rawItems.compactMap { item -> STXPickerOption? in
            guard let item = item as? [String: Any],
                  let label = item["label"] as? String,
                  let value = item["value"] else { return nil }
            return STXPickerOption(label: label, value: value)
        }
        let handler = node.events["onValueChange"]
        let adapter = STXPickerAdapter(options: options) { [weak self] option, index in
            guard let self, let handler else { return }
            let payload: [String: Any] = ["value": option.value, "index": index]
            guard JSONSerialization.isValidJSONObject(payload),
                  let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else { return }
            self.jsContext.evaluateScript("(function($event){\(handler)})(\(json))")
        }
        picker.dataSource = adapter
        picker.delegate = adapter
        picker.isUserInteractionEnabled = !(node.props["disabled"]?.value as? Bool ?? false)
        pickerAdapters[ObjectIdentifier(picker)] = adapter

        if let selected = node.props["selectedValue"]?.value,
           let row = options.firstIndex(where: { String(describing: $0.value) == String(describing: selected) }) {
            picker.selectRow(row, inComponent: 0, animated: false)
        }

        applyStyle(to: picker, style: node.style)
        configureYogaLayout(view: picker, style: node.style)
        return picker
    }

    // MARK: - Style Application

    private func applyStyle(to view: UIView, style: STXStyle) {
        // Background color
        if let bgColorHex = style.backgroundColor {
            view.backgroundColor = UIColor(hex: bgColorHex)
        }

        // Linear gradient (bg-gradient-to-br from-* via-* to-*)
        STXGradientLayer.apply(style, to: view)

        // Border
        if let borderWidth = style.borderWidth {
            view.layer.borderWidth = borderWidth
        }

        if let borderColorHex = style.borderColor {
            view.layer.borderColor = UIColor(hex: borderColorHex)?.cgColor
        }

        // Border radius
        if let radius = style.borderRadius {
            view.layer.cornerRadius = radius
            view.clipsToBounds = true
        }

        // Per-corner radius
        if style.borderTopLeftRadius != nil || style.borderTopRightRadius != nil ||
           style.borderBottomLeftRadius != nil || style.borderBottomRightRadius != nil {
            view.layer.maskedCorners = []

            if let _ = style.borderTopLeftRadius {
                view.layer.maskedCorners.insert(.layerMinXMinYCorner)
            }
            if let _ = style.borderTopRightRadius {
                view.layer.maskedCorners.insert(.layerMaxXMinYCorner)
            }
            if let _ = style.borderBottomLeftRadius {
                view.layer.maskedCorners.insert(.layerMinXMaxYCorner)
            }
            if let _ = style.borderBottomRightRadius {
                view.layer.maskedCorners.insert(.layerMaxXMaxYCorner)
            }
        }

        // Opacity
        if let opacity = style.opacity {
            view.alpha = opacity
        }

        // Shadow
        if let shadowColorHex = style.shadowColor {
            view.layer.shadowColor = UIColor(hex: shadowColorHex)?.cgColor
        }
        if let shadowOffset = style.shadowOffset {
            view.layer.shadowOffset = CGSize(width: shadowOffset.width, height: shadowOffset.height)
        }
        if let shadowOpacity = style.shadowOpacity {
            view.layer.shadowOpacity = Float(shadowOpacity)
        }
        if let shadowRadius = style.shadowRadius {
            view.layer.shadowRadius = shadowRadius
        }
        if let zIndex = style.zIndex {
            view.layer.zPosition = CGFloat(zIndex)
        }
        if style.overflow == "hidden" {
            view.clipsToBounds = true
        }
    }

    private func applyTextStyle(to label: UILabel, style: STXStyle) {
        // Color
        if let colorHex = style.color {
            label.textColor = UIColor(hex: colorHex)
        }

        // Font
        var fontSize: CGFloat = 16
        if let size = style.fontSize {
            fontSize = size
        }

        var fontWeight: UIFont.Weight = .regular
        if let weight = style.fontWeight {
            switch weight {
            case "bold", "700": fontWeight = .bold
            case "100": fontWeight = .ultraLight
            case "200": fontWeight = .thin
            case "300": fontWeight = .light
            case "400": fontWeight = .regular
            case "500": fontWeight = .medium
            case "600": fontWeight = .semibold
            case "800": fontWeight = .heavy
            case "900": fontWeight = .black
            default: fontWeight = .regular
            }
        }

        var font = UIFont.systemFont(ofSize: fontSize, weight: fontWeight)
        if let family = style.fontFamily, let familyFont = UIFont(name: family, size: fontSize) {
            font = familyFont
        }
        if style.fontStyle == "italic",
           let descriptor = font.fontDescriptor.withSymbolicTraits(.traitItalic) {
            font = UIFont(descriptor: descriptor, size: fontSize)
        }
        label.font = font

        if let transform = style.textTransform, let text = label.text {
            switch transform {
            case "uppercase": label.text = text.uppercased()
            case "lowercase": label.text = text.lowercased()
            case "capitalize": label.text = text.capitalized
            default: break
            }
        }

        // Text alignment
        if let align = style.textAlign {
            switch align {
            case "left": label.textAlignment = .left
            case "center": label.textAlignment = .center
            case "right": label.textAlignment = .right
            case "justify": label.textAlignment = .justified
            default: label.textAlignment = .natural
            }
        }

        let attributed = NSMutableAttributedString(string: label.text ?? "")
        let range = NSRange(location: 0, length: attributed.length)
        if let lineHeight = style.lineHeight, attributed.length > 0 {
            let paragraph = NSMutableParagraphStyle()
            paragraph.minimumLineHeight = lineHeight
            paragraph.maximumLineHeight = lineHeight
            paragraph.alignment = label.textAlignment
            attributed.addAttribute(.paragraphStyle, value: paragraph, range: range)
        }
        if let letterSpacing = style.letterSpacing, attributed.length > 0 {
            attributed.addAttribute(.kern, value: letterSpacing, range: range)
        }
        if let decoration = style.textDecorationLine, attributed.length > 0 {
            if decoration.contains("underline") {
                attributed.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: range)
            }
            if decoration.contains("line-through") {
                attributed.addAttribute(.strikethroughStyle, value: NSUnderlineStyle.single.rawValue, range: range)
            }
        }
        if let color = style.textDecorationColor.flatMap(UIColor.init(hex:)), attributed.length > 0 {
            attributed.addAttribute(.underlineColor, value: color, range: range)
            attributed.addAttribute(.strikethroughColor, value: color, range: range)
        }
        if attributed.length > 0 {
            label.attributedText = attributed
        }

        // Apply common styles
        applyStyle(to: label, style: style)
    }

    private func applyEvents(to view: UIView, events: [String: String]) {
        if let pressHandler = events["onPress"] {
            view.isUserInteractionEnabled = true
            let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
            view.addGestureRecognizer(tap)
            view.accessibilityIdentifier = pressHandler
        }
    }

    // MARK: - Yoga Layout Configuration

    private func configureYogaLayout(view: UIView, style: STXStyle) {
        view.configureLayout { layout in
            layout.isEnabled = true

            // Flex
            if let flex = style.flex {
                layout.flex = flex
            }
            if let flexGrow = style.flexGrow {
                layout.flexGrow = flexGrow
            }
            if let flexShrink = style.flexShrink {
                layout.flexShrink = flexShrink
            }

            // Flex direction
            if let direction = style.flexDirection {
                switch direction {
                case "row": layout.flexDirection = .row
                case "column": layout.flexDirection = .column
                case "row-reverse": layout.flexDirection = .rowReverse
                case "column-reverse": layout.flexDirection = .columnReverse
                default: break
                }
            }

            // Justify content
            if let justify = style.justifyContent {
                switch justify {
                case "flex-start": layout.justifyContent = .flexStart
                case "center": layout.justifyContent = .center
                case "flex-end": layout.justifyContent = .flexEnd
                case "space-between": layout.justifyContent = .spaceBetween
                case "space-around": layout.justifyContent = .spaceAround
                case "space-evenly": layout.justifyContent = .spaceEvenly
                default: break
                }
            }

            // Align items
            if let align = style.alignItems {
                switch align {
                case "flex-start": layout.alignItems = .flexStart
                case "center": layout.alignItems = .center
                case "flex-end": layout.alignItems = .flexEnd
                case "stretch": layout.alignItems = .stretch
                case "baseline": layout.alignItems = .baseline
                default: break
                }
            }

            // Dimensions
            if let width = style.width {
                switch width {
                case .points(let v): layout.width = YGValue(v)
                case .percent(let v): layout.width = YGValue(value: Float(v), unit: .percent)
                case .auto: layout.width = YGValueAuto
                }
            }
            if let height = style.height {
                switch height {
                case .points(let v): layout.height = YGValue(v)
                case .percent(let v): layout.height = YGValue(value: Float(v), unit: .percent)
                case .auto: layout.height = YGValueAuto
                }
            }

            // Padding
            if let p = style.padding { layout.padding = YGValue(p) }
            if let pt = style.paddingTop { layout.paddingTop = YGValue(pt) }
            if let pr = style.paddingRight { layout.paddingRight = YGValue(pr) }
            if let pb = style.paddingBottom { layout.paddingBottom = YGValue(pb) }
            if let pl = style.paddingLeft { layout.paddingLeft = YGValue(pl) }
            if let ph = style.paddingHorizontal {
                layout.paddingLeft = YGValue(ph)
                layout.paddingRight = YGValue(ph)
            }
            if let pv = style.paddingVertical {
                layout.paddingTop = YGValue(pv)
                layout.paddingBottom = YGValue(pv)
            }

            // Margin
            if let m = style.margin { layout.margin = YGValue(m) }
            if let mt = style.marginTop { layout.marginTop = YGValue(mt) }
            if let mr = style.marginRight { layout.marginRight = YGValue(mr) }
            if let mb = style.marginBottom { layout.marginBottom = YGValue(mb) }
            if let ml = style.marginLeft { layout.marginLeft = YGValue(ml) }
            if let mh = style.marginHorizontal {
                layout.marginLeft = YGValue(mh)
                layout.marginRight = YGValue(mh)
            }
            if let mv = style.marginVertical {
                layout.marginTop = YGValue(mv)
                layout.marginBottom = YGValue(mv)
            }

            // Gap
            if let gap = style.gap {
                // Yoga doesn't have gap directly, simulate with margins
            }

            // Position
            if let pos = style.position {
                layout.position = pos == "absolute" ? .absolute : .relative
            }
            if let top = style.top { layout.top = YGValue(top) }
            if let right = style.right { layout.right = YGValue(right) }
            if let bottom = style.bottom { layout.bottom = YGValue(bottom) }
            if let left = style.left { layout.left = YGValue(left) }
        }
    }
}

// MARK: - Gradients

/// A view's linear gradient, kept as the first sublayer and resized with it.
final class STXGradientLayer: CAGradientLayer {
    private var observation: NSKeyValueObservation?

    static func points(_ direction: String) -> (CGPoint, CGPoint) {
        switch direction {
        case "to-t": return (CGPoint(x: 0.5, y: 1), CGPoint(x: 0.5, y: 0))
        case "to-tr": return (CGPoint(x: 0, y: 1), CGPoint(x: 1, y: 0))
        case "to-r": return (CGPoint(x: 0, y: 0.5), CGPoint(x: 1, y: 0.5))
        case "to-br": return (CGPoint(x: 0, y: 0), CGPoint(x: 1, y: 1))
        case "to-bl": return (CGPoint(x: 1, y: 0), CGPoint(x: 0, y: 1))
        case "to-l": return (CGPoint(x: 1, y: 0.5), CGPoint(x: 0, y: 0.5))
        case "to-tl": return (CGPoint(x: 1, y: 1), CGPoint(x: 0, y: 0))
        default: return (CGPoint(x: 0.5, y: 0), CGPoint(x: 0.5, y: 1))
        }
    }

    static func apply(_ style: STXStyle, to view: UIView) {
        let existing = view.layer.sublayers?.first as? STXGradientLayer
        guard let direction = style.gradientDirection,
              let from = style.gradientFrom.flatMap({ UIColor(hex: $0) }),
              let to = style.gradientTo.flatMap({ UIColor(hex: $0) }) else {
            existing?.removeFromSuperlayer()
            return
        }
        let layer = existing ?? STXGradientLayer()
        layer.colors = [from, style.gradientVia.flatMap { UIColor(hex: $0) }, to].compactMap { $0?.cgColor }
        (layer.startPoint, layer.endPoint) = points(direction)
        layer.frame = view.bounds
        if existing == nil {
            view.layer.insertSublayer(layer, at: 0)
            layer.observation = view.observe(\.bounds) { [weak layer] view, _ in layer?.frame = view.bounds }
        }
    }
}

// MARK: - Vector drawing

/// What a shape inherits from the groups above it, as SVG does.
struct STXSvgPaint {
    var fill: String? = "#000000"
    var stroke: String? = nil
    var strokeWidth: CGFloat = 1
    var color: String? = "#000000"
    var opacity: CGFloat = 1

    func merged(with node: STXNode) -> STXSvgPaint {
        var next = self
        let props = node.props
        if let color = node.style.color { next.color = color }
        if let fill = node.style.fill ?? props["fill"]?.value as? String { next.fill = fill }
        if let stroke = node.style.stroke ?? props["stroke"]?.value as? String { next.stroke = stroke }
        if let width = node.style.strokeWidth ?? (props["strokeWidth"]?.value as? NSNumber).map({ CGFloat(truncating: $0) }) { next.strokeWidth = width }
        if let opacity = props["opacity"]?.value as? NSNumber { next.opacity *= CGFloat(truncating: opacity) }
        return next
    }

    func resolve(_ value: String?) -> UIColor? {
        guard let value, value != "none", value != "transparent" else { return nil }
        if value == "currentColor" { return color.flatMap { UIColor(hex: $0) } }
        return UIColor(hex: value)
    }
}

final class STXSvgView: UIView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        stxPointerHitTest(self, point: point, event: event) { super.hitTest(point, with: event) }
    }

    let node: STXNode

    init(node: STXNode) {
        self.node = node
        super.init(frame: .zero)
        isOpaque = false
        contentMode = .redraw
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private var viewBox: CGRect? {
        guard let box = node.props["viewBox"]?.value as? [Any], box.count == 4 else { return nil }
        let n = box.compactMap { ($0 as? NSNumber).map { CGFloat(truncating: $0) } }
        guard n.count == 4, n[2] > 0, n[3] > 0 else { return nil }
        return CGRect(x: n[0], y: n[1], width: n[2], height: n[3])
    }

    /// Height from the viewBox's proportions when no style set one.
    override func sizeThatFits(_ size: CGSize) -> CGSize {
        guard let box = viewBox, size.width > 0 else { return super.sizeThatFits(size) }
        return CGSize(width: size.width, height: size.width * box.height / box.width)
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }
        if let box = viewBox {
            let scale = min(bounds.width / box.width, bounds.height / box.height)
            context.translateBy(x: (bounds.width - box.width * scale) / 2, y: (bounds.height - box.height * scale) / 2)
            context.scaleBy(x: scale, y: scale)
            context.translateBy(x: -box.minX, y: -box.minY)
        }
        draw(node, paint: STXSvgPaint().merged(with: node), in: context)
    }

    private func draw(_ node: STXNode, paint: STXSvgPaint, in context: CGContext) {
        for child in node.children {
            guard case .node(let shape) = child else { continue }
            let own = paint.merged(with: shape)
            if shape.type == "G" { draw(shape, paint: own, in: context); continue }
            if shape.type == "SvgText" { drawText(shape, paint: own); continue }
            guard let path = STXSvgView.path(shape.props["geometry"]?.value) else { continue }
            context.saveGState()
            context.setAlpha(own.opacity)
            if let fill = own.resolve(own.fill) {
                fill.setFill()
                path.fill()
            }
            if let stroke = own.resolve(own.stroke), own.strokeWidth > 0 {
                stroke.setStroke()
                path.lineWidth = own.strokeWidth
                path.lineCapStyle = (shape.props["strokeLinecap"]?.value as? String) == "round" ? .round : (shape.props["strokeLinecap"]?.value as? String) == "square" ? .square : .butt
                path.lineJoinStyle = (shape.props["strokeLinejoin"]?.value as? String) == "round" ? .round : (shape.props["strokeLinejoin"]?.value as? String) == "bevel" ? .bevel : .miter
                if let dashes = shape.props["strokeDasharray"]?.value as? [Any] {
                    let pattern = dashes.compactMap { ($0 as? NSNumber).map { CGFloat(truncating: $0) } }
                    if !pattern.isEmpty { path.setLineDash(pattern, count: pattern.count, phase: 0) }
                }
                path.stroke()
            }
            context.restoreGState()
        }
    }

    private func drawText(_ node: STXNode, paint: STXSvgPaint) {
        let text = node.children.compactMap { child -> String? in if case .text(let value) = child { return value }; return nil }.joined()
        guard !text.isEmpty else { return }
        let size = (node.props["fontSize"]?.value as? NSNumber).map { CGFloat(truncating: $0) } ?? node.style.fontSize ?? 12
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size),
            .foregroundColor: paint.resolve(paint.fill) ?? .label,
        ]
        let string = NSAttributedString(string: text, attributes: attributes)
        let width = string.size().width
        var x = (node.props["x"]?.value as? NSNumber).map { CGFloat(truncating: $0) } ?? 0
        let y = (node.props["y"]?.value as? NSNumber).map { CGFloat(truncating: $0) } ?? 0
        switch node.props["textAnchor"]?.value as? String {
        case "middle": x -= width / 2
        case "end": x -= width
        default: break
        }
        string.draw(at: CGPoint(x: x, y: y - size))
    }

    /// The `geometry` commands: 0 move, 1 line, 2 cubic, 3 quadratic, 4 close.
    static func path(_ value: Any?) -> UIBezierPath? {
        guard let list = value as? [Any] else { return nil }
        let n = list.compactMap { ($0 as? NSNumber).map { CGFloat(truncating: $0) } }
        guard !n.isEmpty else { return nil }
        let path = UIBezierPath()
        var i = 0
        func point(_ at: Int) -> CGPoint { CGPoint(x: n[at], y: n[at + 1]) }
        while i < n.count {
            switch Int(n[i]) {
            case 0 where i + 2 < n.count: path.move(to: point(i + 1)); i += 3
            case 1 where i + 2 < n.count: path.addLine(to: point(i + 1)); i += 3
            case 2 where i + 6 < n.count: path.addCurve(to: point(i + 5), controlPoint1: point(i + 1), controlPoint2: point(i + 3)); i += 7
            case 3 where i + 4 < n.count: path.addQuadCurve(to: point(i + 3), controlPoint: point(i + 1)); i += 5
            case 4: path.close(); i += 1
            default: return path
            }
        }
        return path
    }
}

// MARK: - UIColor Extension

extension UIColor {
    convenience init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        let length = hexSanitized.count
        if length == 6 {
            self.init(
                red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
                green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
                blue: CGFloat(rgb & 0x0000FF) / 255.0,
                alpha: 1.0
            )
        } else if length == 8 {
            self.init(
                red: CGFloat((rgb & 0xFF000000) >> 24) / 255.0,
                green: CGFloat((rgb & 0x00FF0000) >> 16) / 255.0,
                blue: CGFloat((rgb & 0x0000FF00) >> 8) / 255.0,
                alpha: CGFloat(rgb & 0x000000FF) / 255.0
            )
        } else {
            return nil
        }
    }
}

// MARK: - AnyCodable Helper

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
        } else {
            value = NSNull()
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
        default:
            try container.encodeNil()
        }
    }
}
