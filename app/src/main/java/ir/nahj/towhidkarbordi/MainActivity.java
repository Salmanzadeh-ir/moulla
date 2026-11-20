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
    private static final int MEDIA_STORAGE_PERMISSION_REQUEST = 9032;
    // Optional owner-approved consent for startup manifest check; Android INTERNET does not require runtime permission.
    private static final String CONTENT_OPT_IN_PREFS = "pmm_content_startup_consent_v1";
    private static final String CONTENT_ALLOWED = "allowed";
    private boolean contentPageReady = false;
    private boolean contentCheckStarted = false;
    private boolean contentConsentPromptOpen = false;
    private boolean contentConsentDeclinedThisLaunch = false;
    private boolean notificationPermissionFlowOpen = false;
    private String pendingSaveMediaSource = null;
    private boolean pendingSaveMediaVideo = false;
    private boolean visibleToUser = false;
    private boolean pendingWisdomOpen = false;
    private boolean pendingCourseOpen = false;

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
                    + "((!s.hidden&&s.dataset.screen==='home'&&s.dataset.navMode==='home-root'&&t.hidden&&document.getElementById('home-main-menu')&&!document.getElementById('home-main-menu').hidden)||(s.hidden&&!t.hidden&&document.getElementById('home-pane')&&!document.getElementById('home-pane').classList.contains('gone')));"
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
                status.put("clockBasis", "initial_opt_in_local_clock");
                status.put("quietHours", "00:00-07:00");
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

        /** Schedule only an owner-approved, fully validated local course reminder. */
        @JavascriptInterface
        public void setCourseReminderSchedule(final String mode,final int weekday,final String time) {
            if (!PmmReminderClock.validCourseTime(time) ||
                !("daily1".equals(mode) || "daily2".equals(mode) ||
                  ("weekly".equals(mode) && weekday>=0 && weekday<=6))) return;
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || web==null ||
                    !"file:///android_asset/index.html".equals(web.getUrl())) return;
                CourseReminderScheduler.setPlan(MainActivity.this,mode,weekday,time);
            });
        }

        @JavascriptInterface
        public void clearCourseReminderSchedule() {
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed() || web==null ||
                    !"file:///android_asset/index.html".equals(web.getUrl())) return;
                CourseReminderScheduler.clearPlan(MainActivity.this);
            });
        }

        /** A user-selected installed/photo-quote poster, including the approved online CDN. */
        @JavascriptInterface
        public void savePhotoToGallery(final String source) {
            if (!PmmMediaSaver.allowedPhoto(source)) return;
            runOnUiThread(() -> requestMediaSave(false, source));
        }

        /** Only an owner's direct HTTPS MP4 file, never an Eitaa/Aparat page. */
        @JavascriptInterface
        public void saveVideoToGallery(final String source) {
            if (!PmmMediaSaver.allowedVideo(source)) return;
            runOnUiThread(() -> requestMediaSave(true, source));
        }

        /**
         * Only the original Kafi player may start the native mediaPlayback
         * service. No bookmark, download, playlist, or learning UI is added.
         * The service retains playback after WebView.onPause()/screen lock.
         */
        @JavascriptInterface
        public void kafiPlay(final String url, final String title, final float rate) {
            if(!PmmKafiAudioService.approved(url))return;
            runOnUiThread(()->{
                if(isFinishing()||isDestroyed()||!visibleToUser||web==null||
                   !"file:///android_asset/index.html".equals(web.getUrl()))return;
                Intent start=new Intent(MainActivity.this,PmmKafiAudioService.class)
                    .setAction(PmmKafiAudioService.ACTION_PLAY);
                start.putExtra("url",url);
                start.putExtra("title",title);
                start.putExtra("rate",rate);
                try{
                    if(Build.VERSION.SDK_INT>=26)startForegroundService(start);
                    else startService(start);
                }catch(Exception e){
                    Toast.makeText(MainActivity.this,
                        "پخش صوت کافی ممکن نشد",Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void kafiToggle(final String url) {
            if(!PmmKafiAudioService.approved(url))return;
            runOnUiThread(()->{
                if(isFinishing()||isDestroyed()||!visibleToUser||web==null||
                    !"file:///android_asset/index.html".equals(web.getUrl()))return;
                try{
                    JSONObject state=new JSONObject(PmmKafiAudioService.status(MainActivity.this,url));
                    if(!state.optBoolean("active",false))return;
                    Intent command=new Intent(MainActivity.this,PmmKafiAudioService.class)
                        .setAction(PmmKafiAudioService.ACTION_TOGGLE);
                    startService(command);
                }catch(Exception ignored){}
            });
        }

        @JavascriptInterface
        public String kafiStatus(final String url) {
            return PmmKafiAudioService.status(MainActivity.this,url);
        }

        @JavascriptInterface
        public void kafiSeek(final String url,final int seconds) {
            if(!PmmKafiAudioService.approved(url)||seconds<0||seconds>86400)return;
            runOnUiThread(()->{
                if(isFinishing()||isDestroyed()||!visibleToUser)return;
                try{
                    JSONObject state=new JSONObject(PmmKafiAudioService.status(MainActivity.this,url));
                    if(!state.optBoolean("active",false))return;
                    Intent command=new Intent(MainActivity.this,PmmKafiAudioService.class)
                        .setAction(PmmKafiAudioService.ACTION_SEEK);
                    command.putExtra("url",url);
                    command.putExtra("seconds",seconds);
                    startService(command);
                }catch(Exception ignored){}
            });
        }

        @JavascriptInterface
        public void kafiSpeed(final String url,final float value) {
            if(!PmmKafiAudioService.approved(url)||!Float.isFinite(value)||
               value<0.75f||value>2f)return;
            runOnUiThread(()->{
                if(isFinishing()||isDestroyed()||!visibleToUser)return;
                try{
                    JSONObject state=new JSONObject(PmmKafiAudioService.status(MainActivity.this,url));
                    if(!state.optBoolean("active",false))return;
                    Intent command=new Intent(MainActivity.this,PmmKafiAudioService.class)
                        .setAction(PmmKafiAudioService.ACTION_SPEED);
                    command.putExtra("rate",value);
                    startService(command);
                }catch(Exception ignored){}
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
        CourseReminderScheduler.initialize(this);
        pendingWisdomOpen = getIntent() != null &&
                getIntent().getBooleanExtra(WisdomReminderScheduler.EXTRA_OPEN_WISDOM, false);
        pendingCourseOpen = getIntent() != null &&
                getIntent().getBooleanExtra(CourseReminderScheduler.EXTRA_OPEN_COURSE, false);
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
        // Cache is used only for explicitly requested resources and obeys the server policy.
        // No media file is prefetched before the Play button.
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
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
                    contentPageReady = true;
                    openWisdomIfPending();
                    openCourseIfPending();
                    // v122: ask owner-approved content permission after the OS notification flow.
                    maybeStartContentUpdates();
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
    /**
     * Owner-approved one-time opt-in for a READ-ONLY content manifest check.
     * The full app, course and historical audio remain offline until user action.
     * INTERNET is a normal Android permission and has no OS runtime prompt.
     */
    private void maybeStartContentUpdates() {
        if (!contentPageReady || !visibleToUser || contentCheckStarted ||
            contentConsentDeclinedThisLaunch || notificationPermissionFlowOpen || contentConsentPromptOpen ||
            isFinishing() || isDestroyed() || web == null ||
            !"file:///android_asset/index.html".equals(web.getUrl())) return;
        if (getSharedPreferences(CONTENT_OPT_IN_PREFS, MODE_PRIVATE)
                .getBoolean(CONTENT_ALLOWED, false)) {
            contentCheckStarted = true;
            checkContentUpdates();
            return;
        }
        contentConsentPromptOpen = true;
        new android.app.AlertDialog.Builder(this)
            .setTitle("اجازه بررسی مطالب جدید")
            .setMessage("اگر اجازه دهید، هنگام ورود به برنامه فقط فهرست مطالب تازه بررسی می‌شود. در صورت انتشار صوت، عکس، کلیپ یا حکمت تازه، پنجره «دریافت مطالب جدید» یا «بعداً» نمایش داده می‌شود. خود فایل‌های صوتی و تصویری خودکار دریافت یا پخش نمی‌شوند. این اجازه مستقل از مجوز اعلان‌های تفأل و دوره آفلاین است.")
            .setPositiveButton("اجازه می‌دهم", (dialog, which) -> {
                contentConsentPromptOpen = false;
                getSharedPreferences(CONTENT_OPT_IN_PREFS, MODE_PRIVATE).edit()
                    .putBoolean(CONTENT_ALLOWED, true).apply();
                maybeStartContentUpdates();
            })
            .setNegativeButton("فعلاً نه", (dialog, which) -> {
                contentConsentPromptOpen = false;
                contentConsentDeclinedThisLaunch = true;
                // No network request, no saved denial; the user can choose next time.
            })
            .setCancelable(false)
            .show();
    }

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
        notificationPermissionFlowOpen = true;
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // Android 13+: genuine system permission. It can only be granted by the user.
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REMINDER_PERMISSION_REQUEST);
        } else {
            // Android 12 and earlier have no runtime POST_NOTIFICATIONS dialog.
            // A first-run, user-visible app consent dialog is required instead.
            // Also used for an Android 13+ app that already has system permission.
            new android.app.AlertDialog.Builder(this)
                .setTitle("اجازه اعلان‌های پای منبر مولا")
                .setMessage("مایلید یادآوری‌های بی‌صدای تفأل و زمان همراهی دوره آفلاین در نوار اعلان گوشی نمایش داده شوند؟ می‌توانید بعداً یادآور تفأل را خاموش کنید.")
                .setPositiveButton("اجازه می‌دهم", (dialog, which) -> {
                    WisdomReminderScheduler.consent(MainActivity.this, true);
                    CourseReminderScheduler.sync(MainActivity.this);
                    notificationPermissionFlowOpen = false;
                    maybeStartContentUpdates();
                })
                .setNegativeButton("فعلاً نه", (dialog, which) -> {
                    WisdomReminderScheduler.consent(MainActivity.this, false);
                    CourseReminderScheduler.sync(MainActivity.this);
                    notificationPermissionFlowOpen = false;
                    maybeStartContentUpdates();
                })
                .setCancelable(false)
                .show();
        }
    }

    private void requestMediaSave(boolean video, String source) {
        if (isFinishing() || isDestroyed() || !visibleToUser || web == null ||
            !"file:///android_asset/index.html".equals(web.getUrl())) return;
        if (video ? !PmmMediaSaver.allowedVideo(source) : !PmmMediaSaver.allowedPhoto(source)) return;
        if (Build.VERSION.SDK_INT <= 28 &&
            checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) !=
                PackageManager.PERMISSION_GRANTED) {
            pendingSaveMediaVideo = video;
            pendingSaveMediaSource = source;
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                MEDIA_STORAGE_PERMISSION_REQUEST);
            return;
        }
        PmmMediaSaver.save(this, contentExecutor, video, source);
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                                       int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MEDIA_STORAGE_PERMISSION_REQUEST) {
            final String source = pendingSaveMediaSource;
            final boolean video = pendingSaveMediaVideo;
            pendingSaveMediaSource = null;
            pendingSaveMediaVideo = false;
            if (source != null && grantResults.length > 0 &&
                grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                requestMediaSave(video, source);
            } else {
                Toast.makeText(this, "برای ذخیره در گالری، مجوز حافظه لازم است.",
                        Toast.LENGTH_LONG).show();
            }
            return;
        }
        if (requestCode == REMINDER_PERMISSION_REQUEST) {
            boolean granted = grantResults.length > 0 &&
                    grantResults[0] == PackageManager.PERMISSION_GRANTED;
            WisdomReminderScheduler.consent(this, granted);
            CourseReminderScheduler.sync(this);
            notificationPermissionFlowOpen = false;
            maybeStartContentUpdates();
            // A denial deactivates both reminder streams; no hidden background notice.
        }
    }

    private void openWisdomIfPending() {
        if (!pendingWisdomOpen || web == null ||
                !"file:///android_asset/index.html".equals(web.getUrl())) return;
        pendingWisdomOpen = false;
        web.evaluateJavascript("(function(){if(window.PMM_WISDOM_PROTOTYPE)" +
                "window.PMM_WISDOM_PROTOTYPE.open();})()", null);
    }

    private void openCourseIfPending() {
        if (!pendingCourseOpen || web == null ||
            !"file:///android_asset/index.html".equals(web.getUrl())) return;
        pendingCourseOpen=false;
        web.evaluateJavascript("(function(){if(window.PMM_OFFLINE_COURSE)" +
                "window.PMM_OFFLINE_COURSE.open();})()",null);
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        pendingWisdomOpen = intent != null &&
                intent.getBooleanExtra(WisdomReminderScheduler.EXTRA_OPEN_WISDOM, false);
        pendingCourseOpen = intent != null &&
                intent.getBooleanExtra(CourseReminderScheduler.EXTRA_OPEN_COURSE, false);
        openWisdomIfPending();
        openCourseIfPending();
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
        CourseReminderScheduler.sync(this);
        // Reset only the visual × dismissals; keep stored audio progress.
        if (web != null && "file:///android_asset/index.html".equals(web.getUrl()))
            web.evaluateJavascript("window.dispatchEvent(new Event('pmm:app-foreground'))", null);
        initializeReminderPermissionIfNeeded();
        maybeStartContentUpdates();
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
