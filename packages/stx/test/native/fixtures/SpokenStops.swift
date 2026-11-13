import UIKit

/// The stops VoiceOver makes on a screen, in the order it makes them.
///
/// XCUITest lists every view that has an identifier, whether or not a reader
/// can reach it, so it cannot say that a decorative image is skipped or that
/// a caption is read once rather than twice. This walks the views the way
/// UIKit hands them to VoiceOver: an accessibility element is one stop and
/// hides what is inside it, a hidden or transparent view and everything in it
/// is skipped, a container may list its own elements, and a modal view takes
/// over from its siblings.
///
/// Each stop is `name | value | what it is`. The name and value are the ones
/// set on the view. Where UIKit derives them instead (a label reads its text,
/// a field its contents) this does the same, since the accessibility runtime
/// that would derive them is not loaded in a unit test.
enum SpokenStops {
    static func of(_ root: UIView) -> [String] {
        var stops: [String] = []
        walk(root, into: &stops)
        return stops
    }

    private static func walk(_ view: UIView, into stops: inout [String]) {
        if view.isHidden || view.alpha < 0.01 || view.accessibilityElementsHidden { return }
        if view.isAccessibilityElement { stops.append(stop(view)); return }
        if let elements = view.accessibilityElements {
            for element in elements {
                if let child = element as? UIView { walk(child, into: &stops) }
                else if let object = element as? NSObject, object.isAccessibilityElement { stops.append(stop(object)) }
            }
            return
        }
        let modal = view.subviews.filter { $0.accessibilityViewIsModal && !$0.isHidden }
        for child in modal.isEmpty ? view.subviews : modal { walk(child, into: &stops) }
    }

    private static func stop(_ object: NSObject) -> String {
        var name = object.accessibilityLabel ?? ""
        var value = object.accessibilityValue ?? ""
        var kinds: [String] = []
        if let field = object as? UITextField {
            if value.isEmpty { value = field.isSecureTextEntry ? String(repeating: "•", count: field.text?.count ?? 0) : field.text ?? "" }
            kinds.append(field.isSecureTextEntry ? "secure field" : "field")
        } else if let label = object as? UILabel {
            if name.isEmpty { name = label.text ?? "" }
        } else if let toggle = object as? UISwitch {
            if value.isEmpty { value = toggle.isOn ? "1" : "0" }
            kinds.append("switch")
        }
        let traits = object.accessibilityTraits
        let named: [(UIAccessibilityTraits, String)] = [
            (.button, "button"), (.link, "link"), (.header, "header"), (.image, "image"), (.searchField, "search"),
            (.adjustable, "adjustable"), (.selected, "selected"), (.notEnabled, "dimmed"),
        ]
        for (trait, word) in named where traits.contains(trait) { kinds.append(word) }
        if let hint = object.accessibilityHint, !hint.isEmpty { kinds.append("hint: \(hint)") }
        return "\(name) | \(value) | \(kinds.joined(separator: ", "))"
    }
}
