package ir.nahj.towhidkarbordi;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import java.util.Locale;
import org.json.JSONObject;

/**
 * Approved first-party direct audio from Kafi, Nahj commentary and the
 * offline-course catalog uses ONE native foreground playback engine. It lives
 * in a mediaPlayback foreground service so switching the display off does not
 * pause the WebView's audio. The exact second is saved locally every 2 seconds,
 * on manual pause, when seeking and before release.
 *
 * No downloads, bookmark library, new screens, auto-next, or any other owner-
 * rejected v108 features are included.
 */
public final class PmmKafiAudioService extends Service {
    static final String ACTION_PLAY="ir.nahj.towhidkarbordi.KAFI_PLAY";
    static final String ACTION_TOGGLE="ir.nahj.towhidkarbordi.KAFI_TOGGLE";
    static final String ACTION_SEEK="ir.nahj.towhidkarbordi.KAFI_SEEK";
    static final String ACTION_SPEED="ir.nahj.towhidkarbordi.KAFI_SPEED";
    static final String ACTION_STOP="ir.nahj.towhidkarbordi.KAFI_STOP";

    private static final int NOTIFICATION_ID=10109;
    private static final String CHANNEL_ID="pmm_kafi_media_v109";
    private static final String PREFS="pmm_owner_kafi_resume_v109";
    private static final int MAX_SECOND=86400;
    private static volatile PmmKafiAudioService instance;

    // JNI @JavascriptInterface queries run off the main thread. Read only
    // these snapshots there; never access MediaPlayer off its service thread.
    private volatile String source="";
    private volatile String heading="";
    private volatile boolean playing=false;
    private volatile boolean preparing=false;
    private volatile boolean active=false;
    private volatile int position=0;
    private volatile int duration=0;
    // Actual foreground-service PLAYING wall time (not seeking); persists while
    // the user browses elsewhere, and is never awarded for jumping forward.
    private volatile long listenedMillis=0L;
    private long lastListenWall=0L;
    private volatile float rate=1f;
    private volatile String lastError="";
    private volatile String errorSource="";

    private final Handler handler=new Handler(Looper.getMainLooper());
    private MediaPlayer player;
    private MediaSession mediaSession;
    private AudioManager audioManager;
    private AudioManager.OnAudioFocusChangeListener focusListener;
    private boolean prepared=false;
    private boolean foreground=false;
    private volatile boolean buffering=false;
    private int lastSaved=-1;

    private final Runnable pulse=new Runnable() {
        @Override public void run() {
            captureListening();
            if(player!=null&&prepared) {
                try {
                    position=Math.max(0,player.getCurrentPosition()/1000);
                    duration=Math.max(0,player.getDuration()/1000);
                    if(playing&&Math.abs(position-lastSaved)>=2)saveSecond();
                }catch(Exception ignored){}
            }
            if(active)handler.postDelayed(this,1000);
        }
    };

    static boolean approved(String raw) {
        if(raw==null||raw.length()>260)return false;
        try {
            Uri uri=Uri.parse(raw);
            if(!"https".equalsIgnoreCase(uri.getScheme())||
               !"dl.kazeminia110.ir".equalsIgnoreCase(uri.getHost())||
               uri.getPort()!=-1||uri.getUserInfo()!=null||
               uri.getEncodedQuery()!=null||uri.getFragment()!=null)return false;
            String p=uri.getPath();
            return p!=null&&(
                p.matches("/Audio/kafi/(?:kafi kotobe arbae|kafi (?:[1-9]|[1-4][0-9]|5[0-4]))\\.mp3")
                || p.matches("/Audio/nahj-al-balaghe/tartibi/(?:khotbe/khotbe|name/name|hekmat/hekmat) [A-Za-z0-9. &]+\\.mp3")
            );
        }catch(Exception ignored){return false;}
    }

    private static String key(String url) {
        // Preserve Kafi's established progress keys byte-for-byte.
        String file=Uri.parse(url).getLastPathSegment();
        if("kafi kotobe arbae.mp3".equals(file))return "kafi-intro";
        if(file!=null&&file.matches("kafi (?:[1-9]|[1-4][0-9]|5[0-4])\\.mp3"))
            return "kafi-"+file.substring(5,file.length()-4);
        // Stable SHA-256 per approved Nahj URL avoids collisions among 1019
        // separate tracks. Never persist the URL itself as a preference key.
        try {
            byte[] bytes=java.security.MessageDigest.getInstance("SHA-256")
                .digest(url.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex=new StringBuilder("nahj-");
            for(int i=0;i<16;i++)hex.append(String.format(java.util.Locale.ROOT,"%02x",bytes[i]&255));
            return hex.toString();
        }catch(java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("Android SHA-256 unavailable",impossible);
        }
    }
    private static int clamp(int value){return Math.max(0,Math.min(MAX_SECOND,value));}
    private static float clampRate(float value) {
        if(!Float.isFinite(value))return 1f;
        return Math.max(0.75f,Math.min(2f,value));
    }
    static int savedSecond(Context ctx,String url) {
        if(!approved(url))return 0;
        return clamp(ctx.getSharedPreferences(PREFS,MODE_PRIVATE).getInt(key(url),0));
    }
    private static long savedListened(Context ctx,String url){
        if(!approved(url))return 0L;
        return Math.max(0L,ctx.getSharedPreferences(PREFS,MODE_PRIVATE)
                .getLong("heard-"+key(url),0L));
    }
    private void captureListening() {
        final long now=SystemClock.elapsedRealtime();
        if(playing&&lastListenWall>0&&now>lastListenWall){
            final long delta=Math.min(2200L,now-lastListenWall);
            listenedMillis=Math.min((long)MAX_SECOND*1000L,listenedMillis+delta);
        }
        lastListenWall=now;
    }
    private void saveSecond() {
        if(!approved(source))return;
        captureListening();
        int n=clamp(position);
        getSharedPreferences(PREFS,MODE_PRIVATE).edit()
            .putInt(key(source),n)
            .putLong("heard-"+key(source),listenedMillis).apply();
        lastSaved=n;
    }
    private void clearSavedSecond() {
        if(!approved(source))return;
        getSharedPreferences(PREFS,MODE_PRIVATE).edit().putInt(key(source),0).apply();
        lastSaved=0;position=0;
    }
    static String status(Context ctx,String requestedUrl) {
        JSONObject answer=new JSONObject();
        try {
            if(!approved(requestedUrl)) {
                answer.put("valid",false);return answer.toString();
            }
            PmmKafiAudioService service=instance;
            boolean same=service!=null&&requestedUrl.equals(service.source)&&service.active;
            answer.put("valid",true);
            answer.put("active",same);
            answer.put("playing",same&&service.playing);
            answer.put("preparing",same&&service.preparing);
            answer.put("buffering",same&&service.buffering);
            answer.put("position",same?service.position:savedSecond(ctx,requestedUrl));
            answer.put("saved",savedSecond(ctx,requestedUrl));
            answer.put("duration",same?service.duration:0);
            answer.put("listened",(same?service.listenedMillis:savedListened(ctx,requestedUrl))/1000.0);
            answer.put("rate",same?service.rate:1f);
            answer.put("error",service!=null&&requestedUrl.equals(service.errorSource)?service.lastError:"");
        }catch(Exception ignored){}
        return answer.toString();
    }

    @Override public void onCreate() {
        super.onCreate();
        instance=this;
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26&&nm!=null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL_ID,
                "پخش صوت پای منبر مولا",NotificationManager.IMPORTANCE_LOW));
        }
        audioManager=(AudioManager)getSystemService(AUDIO_SERVICE);
        focusListener=focus->{
            if(focus==AudioManager.AUDIOFOCUS_LOSS||
               focus==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT||
               focus==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)pause();
        };
        mediaSession=new MediaSession(this,"PayeMenbareMola-Audio");
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS|
                              MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override public void onPlay(){resume();}
            @Override public void onPause(){pause();}
            @Override public void onStop(){stopSelf();}
            @Override public void onSeekTo(long ms){seek((int)(ms/1000L));}
        });
        mediaSession.setActive(true);
        updateSession();
    }
    private PendingIntent action(String what,int request) {
        Intent intent=new Intent(this,PmmKafiAudioService.class).setAction(what);
        int flags=PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this,request,intent,flags);
    }
    private Notification notification() {
        Intent intent=new Intent(this,MainActivity.class);
        int flags=PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE;
        Notification.Builder n=Build.VERSION.SDK_INT>=26?
            new Notification.Builder(this,CHANNEL_ID):new Notification.Builder(this);
        n.setSmallIcon(android.R.drawable.ic_media_play)
         .setContentTitle("پای منبر مولا — پخش صوت")
         .setContentText(heading.isEmpty()?"پخش صوت":heading)
         .setContentIntent(PendingIntent.getActivity(this,0,intent,flags))
         .setOnlyAlertOnce(true).setOngoing(playing||preparing)
         .setCategory(Notification.CATEGORY_TRANSPORT)
         .setVisibility(Notification.VISIBILITY_PUBLIC)
         .addAction(playing?android.R.drawable.ic_media_pause:android.R.drawable.ic_media_play,
                 playing?"مکث":"ادامه پخش",action(ACTION_TOGGLE,11))
         .addAction(android.R.drawable.ic_menu_close_clear_cancel,
                 "پایان پخش",action(ACTION_STOP,12));
        if(Build.VERSION.SDK_INT>=21&&mediaSession!=null) {
            n.setStyle(new Notification.MediaStyle()
              .setMediaSession(mediaSession.getSessionToken())
              .setShowActionsInCompactView(0,1));
        }
        return n.build();
    }
    private void showForeground() {
        if(!foreground) {
            if(Build.VERSION.SDK_INT>=29) {
                startForeground(NOTIFICATION_ID,notification(),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            }else startForeground(NOTIFICATION_ID,notification());
            foreground=true;
        }else {
            NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            if(nm!=null)nm.notify(NOTIFICATION_ID,notification());
        }
    }
    private void updateSession() {
        if(mediaSession==null)return;
        int state=(preparing||buffering)?PlaybackState.STATE_BUFFERING:
            playing?PlaybackState.STATE_PLAYING:
            active?PlaybackState.STATE_PAUSED:PlaybackState.STATE_STOPPED;
        mediaSession.setPlaybackState(new PlaybackState.Builder()
            .setActions(PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|
                        PlaybackState.ACTION_PLAY_PAUSE|PlaybackState.ACTION_STOP|
                        PlaybackState.ACTION_SEEK_TO)
            .setState(state,position*1000L,playing?rate:0f,SystemClock.elapsedRealtime())
            .build());
        mediaSession.setMetadata(new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE,heading)
            .putString(MediaMetadata.METADATA_KEY_ARTIST,"پای منبر مولا")
            .putLong(MediaMetadata.METADATA_KEY_DURATION,duration*1000L)
            .build());
        if(foreground)showForeground();
    }
    private void discardPlayer() {
        handler.removeCallbacks(pulse);
        if(player!=null) {
            try{player.reset();player.release();}catch(Exception ignored){}
            player=null;
        }
        prepared=false;preparing=false;playing=false;active=false;buffering=false;
    }
    private void error(String message) {
        errorSource=source;lastError=message;
        saveSecond();
        discardPlayer();
        stopSelf();
    }
    private void start(String url,String title,float requestedRate,int userResumeSecond) {
        if(!approved(url)) {stopSelf();return;}
        if(active&&url.equals(source)&&player!=null) {
            speed(requestedRate);
            if(prepared)resume();
            return;
        }
        if(active)saveSecond();
        discardPlayer();
        source=url;
        heading=title==null?"پخش صوت":title.substring(0,Math.min(title.length(),100));
        rate=clampRate(requestedRate);
        position=savedSecond(this,url);
        if(position<=0&&userResumeSecond>0)position=clamp(userResumeSecond);
        listenedMillis=savedListened(this,url);
        lastListenWall=SystemClock.elapsedRealtime();
        duration=0;
        errorSource="";lastError="";
        lastSaved=position;
        active=true;preparing=true;playing=false;buffering=false;
        showForeground();
        updateSession();
        try {
            player=new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            player.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);
            // Host and full path validated before building URI; no redirects of own making.
            player.setDataSource(this,Uri.parse(url.replace(" ","%20")));
            player.setOnPreparedListener(mp->{
                if(mp!=player)return;
                prepared=true;preparing=false;
                try {
                    duration=Math.max(0,mp.getDuration()/1000);
                    if(position>0&&mp.getDuration()>2000)
                        mp.seekTo(Math.min(position*1000,mp.getDuration()-1200));
                    if(audioManager!=null)audioManager.requestAudioFocus(focusListener,
                        AudioManager.STREAM_MUSIC,AudioManager.AUDIOFOCUS_GAIN);
                    mp.start();playing=true;lastListenWall=SystemClock.elapsedRealtime();
                    mp.setPlaybackParams(new PlaybackParams().setSpeed(rate));
                    handler.removeCallbacks(pulse);handler.post(pulse);
                    updateSession();
                }catch(Exception e){error("پخش صوت برقرار نشد؛ اینترنت را بررسی کنید.");}
            });
            player.setOnCompletionListener(mp->{
                if(mp!=player)return;
                captureListening();
                saveSecond(); // never grant the full duration merely for seeking to the end
                clearSavedSecond();
                discardPlayer();
                stopSelf();
            });
            player.setOnErrorListener((mp,what,extra)->{
                if(mp==player)error(what==MediaPlayer.MEDIA_ERROR_TIMED_OUT?
                    "پاسخ سرور صوت بیش از حد طول کشید؛ دوباره پخش را بزنید.":
                    "این فایل صوتی دریافت نشد؛ اتصال اینترنت را بررسی کنید.");
                return true;
            });
            player.setOnInfoListener((mp,what,extra)->{
                if(mp!=player)return false;
                if(what==MediaPlayer.MEDIA_INFO_BUFFERING_START){buffering=true;updateSession();}
                else if(what==MediaPlayer.MEDIA_INFO_BUFFERING_END){buffering=false;updateSession();}
                return false;
            });
            player.prepareAsync();
        }catch(Exception e){error("ارتباط با فایل صوتی برقرار نشد.");}
    }
    private void pause() {
        if(player==null||!prepared)return;
        if(playing) {
            captureListening();
            try{player.pause();}catch(Exception ignored){}
            playing=false;buffering=false;
            try{position=Math.max(0,player.getCurrentPosition()/1000);}catch(Exception ignored){}
            saveSecond();
            updateSession();
        }
    }
    private void resume() {
        if(player==null||preparing||!prepared||playing)return;
        try {
            if(audioManager!=null)audioManager.requestAudioFocus(focusListener,
                AudioManager.STREAM_MUSIC,AudioManager.AUDIOFOCUS_GAIN);
            player.start();
            player.setPlaybackParams(new PlaybackParams().setSpeed(rate));
            playing=true;lastListenWall=SystemClock.elapsedRealtime();updateSession();
        }catch(Exception e){error("ادامه پخش صوت ممکن نشد.");}
    }
    private void seek(int second) {
        if(player==null||preparing||!prepared)return;
        try {
            captureListening(); // seeking alone earns ZERO listening credit
            int safe=clamp(second);
            int max=Math.max(0,player.getDuration()/1000-1);
            position=Math.min(safe,max);
            player.seekTo(position*1000);
            saveSecond();updateSession();
        }catch(Exception ignored){}
    }
    private void speed(float requested) {
        rate=clampRate(requested);
        if(player!=null&&prepared) {
            try{player.setPlaybackParams(new PlaybackParams().setSpeed(rate));}
            catch(Exception ignored){}
        }
        updateSession();
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        String action=intent==null?"":intent.getAction();
        if(ACTION_PLAY.equals(action)) {
            start(intent.getStringExtra("url"),intent.getStringExtra("title"),
                intent.getFloatExtra("rate",1f),
                clamp(intent.getIntExtra("resumeSeconds",0)));
        }else if(ACTION_TOGGLE.equals(action)){
            if(playing)pause();else resume();
        }else if(ACTION_SEEK.equals(action)){
            if(intent.getStringExtra("url")!=null&&intent.getStringExtra("url").equals(source))
                seek(intent.getIntExtra("seconds",0));
        }else if(ACTION_SPEED.equals(action)){
            speed(intent.getFloatExtra("rate",1f));
        }else if(ACTION_STOP.equals(action))stopSelf();
        else if(!active)stopSelf();
        return START_NOT_STICKY;
    }
    @Override public void onDestroy() {
        captureListening();
        if(active&&!playing&&position==0) { /* No new progress from a never-started file. */ }
        else if(active) {
            try{if(player!=null&&prepared)position=player.getCurrentPosition()/1000;}catch(Exception ignored){}
            saveSecond();
        }
        discardPlayer();
        if(audioManager!=null&&focusListener!=null)
            audioManager.abandonAudioFocus(focusListener);
        if(mediaSession!=null){mediaSession.setActive(false);mediaSession.release();mediaSession=null;}
        if(foreground){stopForeground(true);foreground=false;}
        if(instance==this)instance=null;
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}
