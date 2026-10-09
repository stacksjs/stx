/**
 * STX Native iOS Renderer
 *
 * Renders STX IR to native UIKit views.
 * Uses Yoga for flexbox layout.
 */

import UIKit
import JavaScriptCore
import YogaKit

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
    var opacity: CGFloat?

    // Shadow
    var shadowColor: String?
    var shadowOpacity: CGFloat?
    var shadowRadius: CGFloat?

    // Text
    var color: String?
    var fontSize: CGFloat?
    var fontWeight: String?
    var fontStyle: String?
    var textAlign: String?
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
        switch node.type {
        case "View":
            return renderView(node)
        case "Text":
            return renderText(node)
        case "Button":
            return renderButton(node)
        case "TextInput":
            return renderTextInput(node)
        case "Image":
            return renderImage(node)
        case "ScrollView":
            return renderScrollView(node)
        case "TouchableOpacity":
            return renderTouchableOpacity(node)
        case "Switch":
            return renderSwitch(node)
        case "ActivityIndicator":
            return renderActivityIndicator(node)
        case "SafeAreaView":
            return renderSafeAreaView(node)
        default:
            print("[STX] Unknown component type: \(node.type), rendering as View")
            return renderView(node)
        }
    }

    // MARK: - Component Renderers

    private func renderView(_ node: STXNode) -> UIView {
        let view = UIView()
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
        let label = UILabel()
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
        let button = UIButton(type: .system)

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
        let textField = UITextField()
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
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit

        if let source = node.props["source"]?.value as? [String: Any],
           let uri = source["uri"] as? String {
            // Load image from URL
            loadImage(from: uri, into: imageView)
        }

        applyStyle(to: imageView, style: node.style)
        configureYogaLayout(view: imageView, style: node.style)
        return imageView
    }

    private func loadImage(from urlString: String, into imageView: UIImageView) {
        guard let url = URL(string: urlString) else { return }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data, let image = UIImage(data: data) {
                DispatchQueue.main.async {
                    imageView.image = image
                }
            }
        }.resume()
    }

    private func renderScrollView(_ node: STXNode) -> UIScrollView {
        let scrollView = UIScrollView()
        let contentView = UIView()

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
        let view = UIView()
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
        let switchView = UISwitch()

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
        let indicator = UIActivityIndicatorView(style: .medium)

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
        let view = UIView()
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

    // MARK: - Style Application

    private func applyStyle(to view: UIView, style: STXStyle) {
        // Background color
        if let bgColorHex = style.backgroundColor {
            view.backgroundColor = UIColor(hex: bgColorHex)
        }

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
        if let shadowOpacity = style.shadowOpacity {
            view.layer.shadowOpacity = Float(shadowOpacity)
        }
        if let shadowRadius = style.shadowRadius {
            view.layer.shadowRadius = shadowRadius
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

        label.font = UIFont.systemFont(ofSize: fontSize, weight: fontWeight)

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
