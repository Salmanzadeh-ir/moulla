package ir.nahj.towhidkarbordi;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.ExecutorService;

/**
 * The owner's opt-in media export. Nothing is saved on browsing/playing.
 *
 * - The original 93 poster files are copied BYTE FOR BYTE from APK assets.
 * - Online posters are restricted to the owner's existing HTTPS media endpoint.
 * - Videos require an actual HTTPS .mp4 resource on the owner's media host.
 *   Eitaa/Aparat page links are NOT MP4s and must not be saved as fake videos.
 * - Android 10+ writes directly into the public MediaStore gallery.
 * - Android 6-9 writes to public Pictures/Movies after runtime storage consent.
 *
 * Never accept generic arbitrary URLs from the JS bridge (it is iframe-visible).
 */
final class PmmMediaSaver {
    private static final String PHOTO_PREFIX = "images/photo_quotes/";
    private static final String OWNER_WORKER = "pmm-content-updates.kazeminia-mohamad110.workers.dev";
    private static final String OWNER_VIDEO_HOST = "dl.kazeminia110.ir";
    private static final long MAX_IMAGE_BYTES = 20L * 1024L * 1024L;
    private static final long MAX_VIDEO_BYTES = 300L * 1024L * 1024L;

    private PmmMediaSaver() { }

    static boolean allowedPhoto(String value) {
        return value != null && value.length() <= 250 &&
            (value.matches("^images/photo_quotes/quote_[0-9]{3}\\.(jpg|jpeg|png|webp)$") ||
             isOnlinePhoto(value));
    }

    static boolean allowedVideo(String value) {
        if (value == null || value.length() > 500) return false;
        try {
            Uri uri = Uri.parse(value);
            return isPlainHttps(uri) && OWNER_VIDEO_HOST.equalsIgnoreCase(uri.getHost()) &&
                uri.getPath() != null && uri.getPath().matches("(?i)^/(?:[a-zA-Z0-9_.-]+/)*[a-zA-Z0-9_.-]+\\.mp4$");
        } catch (Exception ignored) { return false; }
    }

    private static boolean isOnlinePhoto(String value) {
        try {
            Uri uri = Uri.parse(value);
            return isPlainHttps(uri) && OWNER_WORKER.equalsIgnoreCase(uri.getHost()) &&
                uri.getPath() != null &&
                uri.getPath().matches("^/media/[a-f0-9-]{36}$");
        } catch (Exception ignored) { return false; }
    }

    private static boolean isPlainHttps(Uri uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme()) &&
            uri.getPort() == -1 && uri.getUserInfo() == null &&
            uri.getQuery() == null && uri.getFragment() == null;
    }

    static void save(Activity activity, ExecutorService executor, boolean video, String source) {
        if (video ? !allowedVideo(source) : !allowedPhoto(source)) return;
        Toast.makeText(activity, "در حال ذخیره در گالری…", Toast.LENGTH_SHORT).show();
        executor.execute(() -> {
            try {
                saveChecked(activity, video, source);
                activity.runOnUiThread(() ->
                    Toast.makeText(activity, video ? "کلیپ در گالری ذخیره شد." :
                            "عکس در گالری ذخیره شد.", Toast.LENGTH_LONG).show());
            } catch (Exception failure) {
                activity.runOnUiThread(() ->
                    Toast.makeText(activity, "ذخیره انجام نشد؛ فضا یا اتصال اینترنت را بررسی کنید.",
                            Toast.LENGTH_LONG).show());
            }
        });
    }

    private static void saveChecked(Activity activity, boolean video, String source) throws IOException {
        HttpURLConnection connection = null;
        InputStream input = null;
        try {
            String mime;
            String filename;
            long limit = video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
            if (!video && source.startsWith(PHOTO_PREFIX)) {
                String basename = source.substring(PHOTO_PREFIX.length());
                mime = extensionMime(basename);
                if (mime == null) throw new IOException("Unsupported local image");
                filename = "PMM_" + basename;
                input = activity.getAssets().open(source);
            } else {
                URL url = new URL(source);
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(9000);
                connection.setReadTimeout(20000);
                connection.setUseCaches(false);
                connection.setRequestProperty("Accept",video ? "video/mp4" : "image/jpeg, image/png, image/webp");
                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK)
                    throw new IOException("Media response unavailable");
                if (connection.getContentLengthLong() > limit) throw new IOException("Media too large");
                String contentType = connection.getContentType();
                mime = contentType == null ? "" :
                    contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
                if (video) {
                    if (!"video/mp4".equals(mime) && !"application/octet-stream".equals(mime))
                        throw new IOException("Response is not MP4");
                    mime = "video/mp4";
                    filename = "PMM_clip_" + System.currentTimeMillis() + ".mp4";
                } else {
                    if (!"image/jpeg".equals(mime) && !"image/png".equals(mime) &&
                        !"image/webp".equals(mime)) throw new IOException("Response is not an image");
                    String ext = "image/png".equals(mime) ? "png" :
                            "image/webp".equals(mime) ? "webp" : "jpg";
                    filename = "PMM_photo_" + System.currentTimeMillis() + "." + ext;
                }
                input = connection.getInputStream();
            }
            writeToPublicGallery(activity, input, filename, mime, limit, video);
        } finally {
            if (input != null) try { input.close(); } catch (IOException ignored) { }
            if (connection != null) connection.disconnect();
        }
    }

    private static String extensionMime(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return null;
    }

    private static void copyLimited(InputStream input, OutputStream output, long limit)
            throws IOException {
        long count = 0;
        byte[] buffer = new byte[16384];
        int n;
        while ((n = input.read(buffer)) != -1) {
            count += n;
            if (count > limit) throw new IOException("Size limit exceeded");
            output.write(buffer, 0, n);
        }
        if (count == 0) throw new IOException("Empty media");
        output.flush();
    }

    private static void writeToPublicGallery(Activity activity, InputStream input, String filename,
                                             String mime, long limit, boolean video)
            throws IOException {
        final String directory = video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES;
        if (Build.VERSION.SDK_INT >= 29) {
            ContentResolver resolver = activity.getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, directory + "/PayeMenbareMola");
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri collection = video ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI :
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
            Uri inserted = resolver.insert(collection, values);
            if (inserted == null) throw new IOException("MediaStore insert rejected");
            boolean complete = false;
            try {
                try (OutputStream out = resolver.openOutputStream(inserted, "w")) {
                    if (out == null) throw new IOException("Gallery stream unavailable");
                    copyLimited(input, out, limit);
                }
                ContentValues publish = new ContentValues();
                publish.put(MediaStore.MediaColumns.IS_PENDING, 0);
                if (resolver.update(inserted, publish, null, null) <= 0)
                    throw new IOException("Could not publish media");
                complete = true;
            } finally {
                if (!complete) resolver.delete(inserted, null, null);
            }
        } else {
            File root = Environment.getExternalStoragePublicDirectory(directory);
            File folder = new File(root, "PayeMenbareMola");
            if (!folder.isDirectory() && !folder.mkdirs()) throw new IOException("Cannot create gallery folder");
            File target = new File(folder, filename);
            if (target.exists()) {
                String stem = filename.substring(0, filename.lastIndexOf('.'));
                String suffix = filename.substring(filename.lastIndexOf('.'));
                target = new File(folder, stem + "_" + System.currentTimeMillis() + suffix);
            }
            boolean complete = false;
            try {
                try (OutputStream out = new FileOutputStream(target)) {
                    copyLimited(input, out, limit);
                }
                complete = true;
            } finally {
                if (!complete) target.delete();
            }
            MediaScannerConnection.scanFile(activity,
                    new String[]{target.getAbsolutePath()}, new String[]{mime}, null);
        }
    }
}
