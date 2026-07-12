import SwiftUI
import WebKit

// Native iOS wrapper for the Block Blast web game.
// The web assets are bundled under www/ and loaded from disk, so the
// app runs fully offline with no server.

@main
struct BlockBlastApp: App {
    var body: some Scene {
        WindowGroup {
            GameWebView()
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)   // dims the home indicator
                .background(Color(red: 0.102, green: 0.106, blue: 0.149)) // #1a1b26
        }
    }
}

struct GameWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.websiteDataStore = .default()   // persistent localStorage for best score

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.102, green: 0.106, blue: 0.149, alpha: 1)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
