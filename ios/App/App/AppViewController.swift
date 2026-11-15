import UIKit
import WebKit
import Capacitor

/// The app's one screen: Capacitor's web view showing bitesync.io, with a
/// loading screen over it until the first page has loaded.
///
/// The SplashScreen plugin hid the logo after a fixed 0.6 s, so on a slow start
/// the web view showed black (its default in dark mode) until the site arrived.
/// This screen stays until the page is there instead, and moves while it waits.
class AppViewController: CAPBridgeViewController {
    private var loadingScreen: LoadingScreenView?
    private var observations: [NSKeyValueObservation] = []
    private let shownAt = Date()

    /// After this long, a page that has started arriving (it has a title) is
    /// shown even if something on it, say one slow image, is still loading.
    private let patience: TimeInterval = 10
    /// Never covered for longer than this, whatever the page is doing.
    private let longestWait: TimeInterval = 30

    override func viewDidLoad() {
        super.viewDidLoad() // starts loading the site

        let screen = LoadingScreenView(frame: view.bounds)
        screen.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(screen)
        loadingScreen = screen

        guard let webView else { return }
        observations = [
            webView.observe(\.isLoading, options: [.new]) { [weak self] webView, _ in
                guard !webView.isLoading else { return }
                // A short wait: the page may still be painting, and when the
                // site can't be reached Capacitor goes straight on to the offline page.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { self?.hideIfReady() }
            },
            webView.observe(\.title, options: [.new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.hideIfReady() }
            },
        ]
        for wait in [patience, longestWait] {
            DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in self?.hideIfReady() }
        }
    }

    private func hideIfReady() {
        guard let webView, loadingScreen != nil else { return }
        let waited = Date().timeIntervalSince(shownAt)
        let pageArriving = !(webView.title ?? "").isEmpty
        if !webView.isLoading || (waited >= patience && pageArriving) || waited >= longestWait {
            hideLoadingScreen()
        }
    }

    private func hideLoadingScreen() {
        observations.forEach { $0.invalidate() }
        observations = []
        guard let screen = loadingScreen else { return }
        loadingScreen = nil
        UIView.animate(withDuration: 0.25, animations: { screen.alpha = 0 }, completion: { _ in
            screen.removeFromSuperview()
        })
    }
}

/// The launch screen's logo (the same image, placed the same way, so the
/// hand-over can't be seen) with sync arrows turning under it.
final class LoadingScreenView: UIView {
    /// The logo tile's width as a share of the Splash image's (2732 px, tile 418 px).
    private static let logoShareOfImage: CGFloat = 0.153

    private let logo = UIImageView(image: UIImage(named: "Splash"))
    private let arrows = UIImageView(
        image: UIImage(
            systemName: "arrow.triangle.2.circlepath",
            withConfiguration: UIImage.SymbolConfiguration(pointSize: 22, weight: .semibold)
        )
    )

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 13 / 255, green: 41 / 255, blue: 35 / 255, alpha: 1) // #0d2923, as in Splash

        logo.contentMode = .scaleAspectFill
        logo.frame = bounds
        logo.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(logo)

        // The ivory of the logo tile, a little softer.
        arrows.tintColor = UIColor(red: 1, green: 253 / 255, blue: 248 / 255, alpha: 0.8)
        arrows.alpha = 0
        addSubview(arrows)

        isAccessibilityElement = true
        accessibilityLabel = "Loading BiteSync"
        accessibilityTraits = .updatesFrequently
        accessibilityViewIsModal = true
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) is not used")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // Splash is square and fills the screen, so it is drawn as wide as the
        // screen's longer side; the tile sits in its middle.
        let tile = max(bounds.width, bounds.height) * Self.logoShareOfImage
        arrows.center = CGPoint(x: bounds.midX, y: bounds.midY + tile / 2 + 44)
    }

    private var started = false

    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard window != nil, !started else { return }
        started = true
        let reduceMotion = UIAccessibility.isReduceMotionEnabled

        if !reduceMotion {
            let spin = CABasicAnimation(keyPath: "transform.rotation.z")
            spin.fromValue = 0
            spin.toValue = 2 * Double.pi
            spin.duration = 1.4
            spin.repeatCount = .infinity
            spin.isRemovedOnCompletion = false // keeps turning after a trip to the background
            arrows.layer.add(spin, forKey: "spin")
        }

        // Nothing moves on a quick start; the arrows come in once it's a wait.
        UIView.animate(withDuration: 0.3, delay: 0.4, options: [], animations: { self.arrows.alpha = 1 }, completion: { _ in
            guard reduceMotion else { return }
            // Reduce Motion: a slow fade in and out instead of turning.
            let pulse = CABasicAnimation(keyPath: "opacity")
            pulse.fromValue = 1
            pulse.toValue = 0.35
            pulse.duration = 0.9
            pulse.autoreverses = true
            pulse.repeatCount = .infinity
            pulse.isRemovedOnCompletion = false
            self.arrows.layer.add(pulse, forKey: "pulse")
        })
    }
}
