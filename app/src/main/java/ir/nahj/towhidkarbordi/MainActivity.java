package ir.nahj.towhidkarbordi;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.Locale;
import android.os.SystemClock;

/**
 * Android host for approved Paye Menbare Mola design.
 * The iwan and gallery are stored as local assets; media links may require Internet.
 */
public final class MainActivity extends Activity {
    private WebView web;
    private FrameLayout root;
    private View fullScreenVideo;
    private WebChromeClient.CustomViewCallback videoCallback;
    private int priorOrientation;
    private long lastEitaaLaunchMs = 0L;

    /** Only exposes validated link opening. Never accepts arbitrary intents or URLs. */
    private final class NativeMediaBridge {
        /** App exit is accepted only when the trusted main page is on the home screen. */
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || web == null ||
                    !"file:///android_asset/index.html".equals(web.getUrl())) return;
                web.evaluateJavascript("typeof screen==='string'?screen:'unknown'", current -> {
                    if ("\"home\"".equals(current) && !isFinishing()) finish();
                });
            });
        }

        @JavascriptInterface
        public void openEitaa(final String url) {
            // This interface is also visible to iframe content; validate every input.
            final Uri target = verifiedEitaaUri(url);
            if (target == null) return;
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed()) return;
                long now = SystemClock.elapsedRealtime();
                if (now - lastEitaaLaunchMs < 1200L) return; // prevent accidental double-open
                lastEitaaLaunchMs = now;
                launchEitaa(target);
            });
        }
    }

    private static Uri verifiedEitaaUri(String raw) {
        if (raw == null || raw.length() > 260) return null;
        final Uri uri;
        try { uri = Uri.parse(raw); } catch (Exception e) { return null; }
        if (!"https".equalsIgnoreCase(uri.getScheme()) ||
            !"eitaa.com".equalsIgnoreCase(uri.getHost()) ||
            uri.getPort() != -1 || uri.getUserInfo() != null) return null;
        String path = uri.getPath();
        if (path == null || !path.matches("/(?:joinchat/[a-zA-Z0-9]+|[a-zA-Z0-9_]+/[0-9]+)/?")) return null;
        return uri;
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(18, 23, 29));
        getWindow().setNavigationBarColor(Color.rgb(18, 23, 29));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        root = new FrameLayout(this);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(18, 23, 29));
        web.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        // The app's own page calls a restricted native method, never navigating
        // the WebView to a custom-scheme/error page when opening Eitaa.
        web.addJavascriptInterface(new NativeMediaBridge(), "PMMNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                return openExternal(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternal(Uri.parse(url));
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (url.startsWith("file:///android_asset/")) {
                    view.evaluateJavascript("window.PMM_ANDROID=true", null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullScreenVideo != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullScreenVideo = view;
                videoCallback = callback;
                priorOrientation = getRequestedOrientation();
                web.setVisibility(View.GONE);
                root.addView(view, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            }
            @Override public void onHideCustomView() { closeVideo(); }
        });
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        web.loadUrl("file:///android_asset/index.html");
    }

    private void closeVideo() {
        if (fullScreenVideo == null) return;
        root.removeView(fullScreenVideo);
        fullScreenVideo = null;
        web.setVisibility(View.VISIBLE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        setRequestedOrientation(priorOrientation);
        WebChromeClient.CustomViewCallback cb = videoCallback;
        videoCallback = null;
        if (cb != null) cb.onCustomViewHidden();
    }

    private boolean openExternal(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if ("pmm-aparat".equalsIgnoreCase(scheme)) {
            if (!"open".equalsIgnoreCase(uri.getHost())) return true;
            String link = uri.getQueryParameter("url");
            if (link == null) return true;
            Uri target;
            try { target = Uri.parse(link); } catch (Exception ex) { return true; }
            String host = target.getHost();
            if (!"https".equalsIgnoreCase(target.getScheme()) || host == null ||
                !("aparat.com".equalsIgnoreCase(host) || "www.aparat.com".equalsIgnoreCase(host)) ||
                target.getPath() == null || !target.getPath().startsWith("/v/")) return true;
            launchExternal(target);
            return true;
        }
        if ("pmm-eitaa".equalsIgnoreCase(scheme)) {
            if (!"open".equalsIgnoreCase(uri.getHost())) return true;
            String link = uri.getQueryParameter("url");
            if (link == null) return true;
            Uri target = verifiedEitaaUri(link);
            if (target == null) return true;
            launchEitaa(target);
            return true;
        }
        if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) {
            return false; // local file navigation
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if ("eitaa.com".equals(host) || "www.eitaa.com".equals(host)) {
            launchEitaa(uri);
            return true;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri)
                    .addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException ex) {
            Toast.makeText(this, "برنامه‌ای برای باز کردن پیوند پیدا نشد", Toast.LENGTH_SHORT).show();
        } catch (Exception ex) {
            Toast.makeText(this, "باز کردن پیوند ممکن نشد", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    /** Launch the exact Aparat URL outside WebView; no intermediate screen. */
    private void launchExternal(Uri target) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, target)
                    .addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (Exception ex) {
            Toast.makeText(this, "باز کردن ویدئو ممکن نشد", Toast.LENGTH_SHORT).show();
        }
    }

    /** Explicitly route links into Eitaa, without opening intermediary WebView pages. */
    private void launchEitaa(Uri target) {
        Intent direct = new Intent(Intent.ACTION_VIEW, target)
            .addCategory(Intent.CATEGORY_BROWSABLE)
            .setPackage("ir.eitaa.messenger");
        try {
            // No browser, no intermediary screen from *this* app, no new task flag.
            startActivity(direct);
        } catch (ActivityNotFoundException | SecurityException notAvailable) {
            // If Eitaa is missing, do not silently route through a browser/web page.
            Toast.makeText(this, "برای شنیدن این جلسه، برنامه ایتا را نصب کنید", Toast.LENGTH_LONG).show();
        } catch (Exception ex) {
            Toast.makeText(this, "باز کردن ایتا ممکن نشد", Toast.LENGTH_SHORT).show();
        }
    }

    @Override public void onBackPressed() {
        if (fullScreenVideo != null) { closeVideo(); return; }
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("typeof screen==='string'?screen:'home'", screenName -> {
            if ("\"home\"".equals(screenName)) finish();
            else web.evaluateJavascript("typeof goBack==='function'&&goBack()", null);
        });
    }
    @Override protected void onPause() { if (web!=null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web!=null) web.onResume(); }
    @Override protected void onDestroy() {
        if (web!=null) {
            web.loadUrl("about:blank");
            web.destroy(); web=null;
        }
        super.onDestroy();
    }
}
