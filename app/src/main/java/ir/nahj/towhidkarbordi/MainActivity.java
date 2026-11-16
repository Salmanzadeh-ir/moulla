package ir.nahj.towhidkarbordi;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
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
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import android.os.SystemClock;

/**
 * Android host for approved Paye Menbare Mola design.
 * The iwan and gallery are stored as local assets; media links may require Internet.
 */
public final class MainActivity extends Activity {
    // Set ONLY after deploying the owner's private content publishing service.
    // HTTPS endpoint is public/read-only; administrator credentials never enter the APK.
    private static final String PMM_CONTENT_MANIFEST_URL = "https://pmm-content-updates.kazeminia-mohamad110.workers.dev/api/manifest";
    private static final int PMM_MAX_MANIFEST_BYTES = 1024 * 1024;
    private final ExecutorService contentExecutor = Executors.newSingleThreadExecutor();
    private WebView web;
    private FrameLayout root;
    private View fullScreenVideo;
    private WebChromeClient.CustomViewCallback videoCallback;
    private int priorOrientation;
    private long lastEitaaLaunchMs = 0L;
    private boolean eitaaReturnPending = false;
    private android.window.OnBackInvokedCallback platformBackCallback;
    private static final int REMINDER_PERMISSION_REQUEST = 9031;
    private boolean visibleToUser = false;
    private boolean pendingWisdomOpen = false;

    /** Only exposes validated link opening. Never accepts arbitrary intents or URLs. */
    private final class NativeMediaBridge {
        /** Read-only installed application version from APK package metadata. */
        @JavascriptInterface
        public String getAppVersion() {
            try {
                String name = MainActivity.this.getPackageManager()
                        .getPackageInfo(MainActivity.this.getPackageName(), 0).versionName;
                return name == null ? "" : name;
            } catch (android.content.pm.PackageManager.NameNotFoundException ignored) {
                return "";
            }
        }

        /** App exit is accepted only when the trusted main page is on the home screen. */
        @android.webkit.JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || web == null || !"file:///android_asset/index.html".equals(web.getUrl())) return;
                web.evaluateJavascript(
                    "(function(){try{var s=document.getElementById('scene');"
                    + "var t=document.getElementById('stage');var now=Date.now();"
                    + "var home=typeof screen==='string'&&screen==='home'&&s&&t&&"
                    + "((!s.hidden&&s.dataset.screen==='home'&&t.hidden)||(s.hidden&&!t.hidden));"
                    + "return !!home&&window.PMM_EXIT_AUTHORIZED_AT>0&&"
                    + "now-window.PMM_EXIT_AUTHORIZED_AT>=0&&now-window.PMM_EXIT_AUTHORIZED_AT<1700&&"
                    + "now-(window.PMM_LAST_BACK_NAV_AT||0)>1000;"
                    + "}catch(e){return false;}})()",
                    canExit -> {
                        if ("true".equals(canExit) && !isFinishing() && !isDestroyed()) {
                            web.evaluateJavascript("window.PMM_EXIT_AUTHORIZED_AT=0", null);
                            finish();
                        }
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

        /** Copies a vetted Nahj al-Balagha wisdom only; exposed JS must be restricted. */
        @JavascriptInterface
        public void copyText(final String value) {
            if (value == null || value.length() < 1 || value.length() > 20000
                    || !value.startsWith("نهج‌البلاغه — ")
                    || !value.endsWith("https://eitaa.com/joinchat/2066481246Cb13f0be69d")) return;
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || web == null
                        || !"file:///android_asset/index.html".equals(web.getUrl())) return;
                android.content.ClipboardManager manager = (android.content.ClipboardManager)
                        getSystemService(CLIPBOARD_SERVICE);
                if (manager != null) manager.setPrimaryClip(
                        android.content.ClipData.newPlainText("حکمت نهج‌البلاغه", value));
            });
        }


        /** Small, validated on-device settings API for the trusted local reminder panel. */
        @JavascriptInterface
        public String getReminderSettings() {
            JSONObject status = new JSONObject();
            try {
                status.put("frequency", WisdomReminderScheduler.frequency(MainActivity.this));
                status.put("consent", WisdomReminderScheduler.hasConsent(MainActivity.this));
                status.put("allowed", WisdomReminderScheduler.hasSystemPermission(MainActivity.this));
                status.put("minutesAfterFirstOpen", 5);
                status.put("silent", true);
            } catch (Exception ignored) { }
            return status.toString();
        }

        @JavascriptInterface
        public void setReminderFrequency(final String value) {
            if (!WisdomReminderScheduler.validFrequency(value)) return;
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || web == null ||
                    !"file:///android_asset/index.html".equals(web.getUrl())) return;
                WisdomReminderScheduler.setFrequency(MainActivity.this, value);
                if (!"off".equals(value) &&
                    (!WisdomReminderScheduler.hasConsent(MainActivity.this) ||
                     !WisdomReminderScheduler.hasSystemPermission(MainActivity.this)))
                    requestReminderPermission();
            });
        }

        @JavascriptInterface
        public void askReminderPermission() {
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || !visibleToUser || web == null ||
                    !"file:///android_asset/index.html".equals(web.getUrl())) return;
                requestReminderPermission();
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
        WisdomReminderScheduler.initialize(this);
        pendingWisdomOpen = getIntent() != null &&
                getIntent().getBooleanExtra(WisdomReminderScheduler.EXTRA_OPEN_WISDOM, false);
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
        web.setFocusableInTouchMode(true);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        // Do not keep fetched online photo/media responses in persistent HTTP cache.
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
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
                if ("file:///android_asset/index.html".equals(url)) {
                    view.evaluateJavascript("window.PMM_ANDROID=true", null);
                    checkContentUpdates();
                    openWisdomIfPending();
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
        // Android 13+ predictive/system Back may bypass the deprecated Activity
        // callback. Intercept it explicitly and send it to the same JS router.
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            platformBackCallback = this::handleBackNavigation;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    platformBackCallback);
        }
    }


    /**
     * Fetch ONLY the owner's fixed, HTTPS public manifest. Avoid granting file://
     * JavaScript universal network access or exposing a generic URL-fetch bridge.
     * The manifest is held in memory; no remote media or JSON is written to disk.
     */
    private void checkContentUpdates() {
        if (PMM_CONTENT_MANIFEST_URL.isEmpty() || web == null) return;
        final URL endpoint;
        try {
            endpoint = new URL(PMM_CONTENT_MANIFEST_URL);
            if (!"https".equalsIgnoreCase(endpoint.getProtocol()) ||
                endpoint.getUserInfo() != null ||
                !"/api/manifest".equals(endpoint.getPath()) ||
                endpoint.getQuery() != null || endpoint.getRef() != null) return;
        } catch (Exception invalid) { return; }

        contentExecutor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) endpoint.openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(6500);
                connection.setReadTimeout(6500);
                connection.setUseCaches(false);
                connection.setRequestProperty("Accept", "application/json");
                if (connection.getResponseCode() != 200) return;
                if (connection.getContentLengthLong() > PMM_MAX_MANIFEST_BYTES) return;
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                try (InputStream input = connection.getInputStream()) {
                    byte[] bytes = new byte[8192];
                    int read;
                    while ((read = input.read(bytes)) != -1) {
                        if (buffer.size() + read > PMM_MAX_MANIFEST_BYTES) return;
                        buffer.write(bytes, 0, read);
                    }
                }
                final String body = buffer.toString(StandardCharsets.UTF_8.name());
                // A syntax check before handing the untrusted data to the vetted JS parser.
                JSONObject manifest = new JSONObject(body);
                if (manifest.optInt("schema", -1) != 1 ||
                    manifest.optJSONArray("items") == null) return;
                final String origin = endpoint.getProtocol() + "://" + endpoint.getAuthority();
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed() || web == null ||
                        !"file:///android_asset/index.html".equals(web.getUrl())) return;
                    // JSONObject.quote makes raw JSON a JS string literal, never JS code.
                    web.evaluateJavascript(
                        "window.PMM_UPDATE_ORIGIN=" + JSONObject.quote(origin) + ";" +
                        "if(window.PMM_CONTENT_UPDATES)window.PMM_CONTENT_UPDATES.receiveManifest(" +
                        JSONObject.quote(body) + ");", null);
                });
            } catch (Exception ignored) {
                // No internet or publishing service: keep the original offline V16 usable.
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
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
            eitaaReturnPending = true;
        } catch (ActivityNotFoundException | SecurityException notAvailable) {
            // If Eitaa is missing, do not silently route through a browser/web page.
            Toast.makeText(this, "برای شنیدن این جلسه، برنامه ایتا را نصب کنید", Toast.LENGTH_LONG).show();
        } catch (Exception ex) {
            Toast.makeText(this, "باز کردن ایتا ممکن نشد", Toast.LENGTH_SHORT).show();
        }
    }

    /** Restore WebView input and route when the Android window actually regains focus. */
    private void restoreAfterEitaaIfFocused() {
        if (!eitaaReturnPending || !hasWindowFocus() || isFinishing() || isDestroyed() || web == null) return;
        web.post(() -> {
            if (!eitaaReturnPending || !hasWindowFocus() || isFinishing() || isDestroyed() || web == null) return;
            eitaaReturnPending = false;
            web.requestFocus();
            if ("file:///android_asset/index.html".equals(web.getUrl())) {
                web.evaluateJavascript("window.dispatchEvent(new Event('pmm:external-return'))", null);
            }
        });
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) restoreAfterEitaaIfFocused();
    }

    /** System Back is navigation ONLY. The separate Home Exit button is the
     *  sole path that may finish this Activity. */
    private void handleBackNavigation() {
        if (fullScreenVideo != null) { closeVideo(); return; }
        if (isFinishing() || isDestroyed() || web == null) return;
        if ("file:///android_asset/index.html".equals(web.getUrl())) {
            web.evaluateJavascript(
                    "(function(){if(typeof goBack==='function'){goBack();return true;}return false;})()",
                    null);
        } else if (web.canGoBack()) {
            web.goBack();
        }
    }


    /**
     * Android 13+ cannot send ANY notification to the status shade without
     * a system-granted POST_NOTIFICATIONS permission. The only lawful way
     * to ensure a five-minute background reminder is to request this OS
     * permission while the app is in the foreground, on first opening.
     * The notification itself is a real AlarmManager notification after
     * FIVE MINUTES, whether or not this Activity remains visible.
     */
    private void initializeReminderPermissionIfNeeded() {
        if (!visibleToUser || isFinishing() || isDestroyed() ||
                WisdomReminderScheduler.wasAsked(this)) return;
        WisdomReminderScheduler.markAsked(this); // do not pester on each return
        requestReminderPermission();
    }

    private void requestReminderPermission() {
        if (!visibleToUser || isFinishing() || isDestroyed()) return;
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REMINDER_PERMISSION_REQUEST);
        } else {
            // On Android 12 or earlier the system has no runtime permission.
            // A pre-granted Android 13+ install is also handled here.
            WisdomReminderScheduler.consent(this, true);
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                                       int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REMINDER_PERMISSION_REQUEST) {
            boolean granted = grantResults.length > 0 &&
                    grantResults[0] == PackageManager.PERMISSION_GRANTED;
            WisdomReminderScheduler.consent(this, granted);
            // If declined, never send a hidden background notification.
        }
    }

    private void openWisdomIfPending() {
        if (!pendingWisdomOpen || web == null ||
                !"file:///android_asset/index.html".equals(web.getUrl())) return;
        pendingWisdomOpen = false;
        web.evaluateJavascript("(function(){if(window.PMM_WISDOM_PROTOTYPE)" +
                "window.PMM_WISDOM_PROTOTYPE.open();})()", null);
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        pendingWisdomOpen = intent != null &&
                intent.getBooleanExtra(WisdomReminderScheduler.EXTRA_OPEN_WISDOM, false);
        openWisdomIfPending();
    }

    @Override public void onBackPressed() { handleBackNavigation(); }
    @Override protected void onPause() {
        visibleToUser = false;
        if (web != null) web.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        visibleToUser = true;
        if (web != null) web.onResume();
        restoreAfterEitaaIfFocused();
        WisdomReminderScheduler.sync(this);
        // Reset only the visual × dismissals; keep stored audio progress.
        if (web != null && "file:///android_asset/index.html".equals(web.getUrl()))
            web.evaluateJavascript("window.dispatchEvent(new Event('pmm:app-foreground'))", null);
        initializeReminderPermissionIfNeeded();
    }
    @Override protected void onDestroy() {
        contentExecutor.shutdownNow();
        if (android.os.Build.VERSION.SDK_INT >= 33 && platformBackCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(platformBackCallback);
            platformBackCallback = null;
        }
        if (web!=null) {
            web.loadUrl("about:blank");
            web.destroy(); web=null;
        }
        super.onDestroy();
    }
}
