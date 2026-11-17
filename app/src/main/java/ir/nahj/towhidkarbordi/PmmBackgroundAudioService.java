package ir.nahj.towhidkarbordi;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.media.PlaybackParams;
import org.json.JSONObject;
import java.io.File;

/** Opt-in native media playback; runs independently of WebView lifecycle.
 * Never accepts arbitrary streaming URLs or intent callers outside this app. */
public final class PmmBackgroundAudioService extends Service {
    public static final String PLAY="ir.nahj.towhidkarbordi.PMM_PLAY";
    public static final String PAUSE="ir.nahj.towhidkarbordi.PMM_PAUSE";
    public static final String RESUME="ir.nahj.towhidkarbordi.PMM_RESUME";
    public static final String STOP="ir.nahj.towhidkarbordi.PMM_STOP";
    public static final String SEEK="ir.nahj.towhidkarbordi.PMM_SEEK";
    public static final String SLEEP="ir.nahj.towhidkarbordi.PMM_SLEEP";
    public static final String EXTRA_URL="url",EXTRA_TITLE="title",EXTRA_SECONDS="seconds",EXTRA_SPEED="speed";
    private static final String CHANNEL="pmm_audio_playback_v1";
    private static final int NOTIFICATION=7118;
    private static volatile boolean active=false,playing=false;
    private static volatile String stateTitle="",stateUrl="";
    private static volatile int stateSeconds=0,stateDuration=0;
    private MediaPlayer player;
    private MediaSession session;
    private AudioManager audioManager;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private Runnable ticker,sleepJob;
    private float preferredSpeed=1f;
    private String title="",url="";
    private int initialMs=0;
    private int generation=0;

    public static boolean allowed(String link) {
        try {
            if (link==null||link.length()>350||!link.startsWith("https://"))return false;
            Uri u=Uri.parse(link);
            if(!"https".equals(u.getScheme())||!"dl.kazeminia110.ir".equals(u.getHost())||
                    u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null||u.getPort()!=-1)return false;
            String p=u.getPath();
            if(p==null)return false;
            if(p.equals("/Audio/kafi/kafi kotobe arbae.mp3"))return true;
            if(p.matches("^/Audio/kafi/kafi (?:[1-9]|[1-4][0-9]|5[0-4])\\.mp3$"))return true;
            return p.matches("^/Audio/nahj-al-balaghe/tartibi/(?:khotbe/khotbe|name/name|hekmat/hekmat) [A-Za-z0-9. &]+\\.mp3$");
        }catch(Exception ignored){return false;}
    }

    public static String state(){
        JSONObject j=new JSONObject();
        try {
            j.put("active",active);j.put("playing",playing);
            j.put("title",stateTitle);j.put("url",stateUrl);
            j.put("seconds",stateSeconds);j.put("duration",stateDuration);
        }catch(Exception ignored){}
        return j.toString();
    }
    private static void clear(){
        active=false;playing=false;stateTitle="";stateUrl="";stateSeconds=0;stateDuration=0;
    }
    public static Intent command(Context context,String action){
        return new Intent(context,PmmBackgroundAudioService.class).setAction(action);
    }
    @Override public void onCreate(){
        super.onCreate();
        audioManager=(AudioManager)getSystemService(AUDIO_SERVICE);
        NotificationManager n=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(n!=null&&Build.VERSION.SDK_INT>=26){
            NotificationChannel channel=new NotificationChannel(CHANNEL,"پخش درس‌های پای منبر مولا",NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("کنترل پخش صوت در پس‌زمینه");
            channel.setSound(null,null);
            n.createNotificationChannel(channel);
        }
        session=new MediaSession(this,"PayeMenbareMolaLearning");
        session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS|MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setCallback(new MediaSession.Callback(){
            @Override public void onPlay(){resume();}
            @Override public void onPause(){pause();}
            @Override public void onStop(){stopSelfPlayback();}
            @Override public void onSeekTo(long pos){seekTo(Math.max(0,(int)Math.min(Integer.MAX_VALUE,pos)));}
        });
        session.setActive(true);
        ticker=new Runnable(){
            @Override public void run(){
                if(player!=null&&active){
                    try{
                        stateSeconds=Math.max(0,player.getCurrentPosition()/1000);
                        stateDuration=Math.max(0,player.getDuration()/1000);
                    }catch(IllegalStateException ignored){}
                }
                handler.postDelayed(this,1000);
            }
        };
        handler.post(ticker);
    }
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent==null)return active?START_STICKY:START_NOT_STICKY;
        String action=intent.getAction();
        if(PLAY.equals(action)){
            String link=intent.getStringExtra(EXTRA_URL);
            if(!allowed(link)){stopSelf(startId);return START_NOT_STICKY;}
            String name=intent.getStringExtra(EXTRA_TITLE);
            name=name==null?"درس صوتی":name.trim();
            if(name.length()>130)name=name.substring(0,130);
            title=name.isEmpty()?"درس صوتی":name;
            url=link;
            initialMs=Math.max(0,Math.min(86400000,intent.getIntExtra(EXTRA_SECONDS,0)*1000));
            float speed=intent.getFloatExtra(EXTRA_SPEED,1f);
            preferredSpeed=speed>=0.75f&&speed<=2f?speed:1f;
            // First create notification, then prepare remote media asynchronously.
            active=true;playing=false;stateTitle=title;stateUrl=url;stateSeconds=initialMs/1000;stateDuration=0;
            startForeground(NOTIFICATION,notification());
            prepare();
        }else if(PAUSE.equals(action))pause();
        else if(RESUME.equals(action))resume();
        else if(STOP.equals(action))stopSelfPlayback();
        else if(SEEK.equals(action))seekTo(Math.max(0,intent.getIntExtra(EXTRA_SECONDS,0))*1000);
        else if(SLEEP.equals(action)){
            if(sleepJob!=null)handler.removeCallbacks(sleepJob);
            int mins=intent.getIntExtra("minutes",0);
            if(mins>0&&mins<=180){
                sleepJob=this::pause;
                handler.postDelayed(sleepJob,mins*60000L);
            }else sleepJob=null;
        }
        return active?START_STICKY:START_NOT_STICKY;
    }
    private void prepare(){
        generation++;
        final int thisRun=generation;
        releasePlayer();
        try{
            player=new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            player.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);
            File local=PmmAudioDownloads.offlineFile(this,url);
            if(local!=null&&local.isFile()&&local.length()>128)
                player.setDataSource(this,Uri.fromFile(local));
            else player.setDataSource(url.replace(" ","%20"));
            player.setOnPreparedListener(mp->{
                if(thisRun!=generation)return;
                try{
                    stateDuration=Math.max(0,mp.getDuration()/1000);
                    if(initialMs>0)mp.seekTo(Math.min(initialMs,Math.max(0,mp.getDuration()-500)));
                    mp.setPlaybackParams(mp.getPlaybackParams().setSpeed(preferredSpeed));
                    requestAudioFocus();
                    mp.start();playing=true;updateSession();notifyChange();
                }catch(Exception ex){showFailure();}
            });
            player.setOnCompletionListener(mp->{playing=false;stateSeconds=0;updateSession();notifyChange();});
            player.setOnErrorListener((mp,what,extra)->{showFailure();return true;});
            player.prepareAsync();
        }catch(Exception ex){showFailure();}
    }
    private void showFailure(){playing=false;updateSession();notifyChange();}
    private void requestAudioFocus(){
        if(audioManager!=null)audioManager.requestAudioFocus(focusListener,AudioManager.STREAM_MUSIC,AudioManager.AUDIOFOCUS_GAIN);
    }
    private final AudioManager.OnAudioFocusChangeListener focusListener=change->{
        if(change<=AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)pause();
    };
    private void pause(){
        try{if(player!=null&&player.isPlaying())player.pause();}catch(IllegalStateException ignored){}
        playing=false;updateSession();notifyChange();
    }
    private void resume(){
        try{
            if(player!=null){
                requestAudioFocus();player.start();playing=true;
            }
        }catch(IllegalStateException ignored){playing=false;}
        updateSession();notifyChange();
    }
    private void seekTo(int ms){
        try{if(player!=null)player.seekTo(ms);}catch(IllegalStateException ignored){}
    }
    private void stopSelfPlayback(){
        generation++;releasePlayer();
        clear();updateSession();
        if(audioManager!=null)audioManager.abandonAudioFocus(focusListener);
        if(sleepJob!=null)handler.removeCallbacks(sleepJob);
        sleepJob=null;
        stopForeground(true);stopSelf();
    }
    private void releasePlayer(){
        if(player!=null){
            try{player.reset();player.release();}catch(Exception ignored){}
            player=null;
        }
    }
    private void updateSession(){
        if(session==null)return;
        long pos=Math.max(0,stateSeconds)*1000L;
        session.setPlaybackState(new PlaybackState.Builder()
          .setActions(PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_STOP|PlaybackState.ACTION_SEEK_TO)
          .setState(playing?PlaybackState.STATE_PLAYING:active?PlaybackState.STATE_PAUSED:PlaybackState.STATE_STOPPED,
           pos,playing?preferredSpeed:0f).build());
    }
    private PendingIntent action(String label,String action,int code){
        Intent in=command(this,action);
        return PendingIntent.getService(this,code,in,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    private Notification notification(){
        Intent launch=new Intent(this,MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent p=PendingIntent.getActivity(this,77,launch,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b=Build.VERSION.SDK_INT>=26?
            new Notification.Builder(this,CHANNEL):new Notification.Builder(this);
        b.setSmallIcon(R.drawable.app_icon).setContentTitle(title.isEmpty()?"پای منبر مولا":title)
         .setContentText(playing?"در حال پخش درس صوتی":"آماده پخش یا متوقف شده")
         .setOngoing(playing).setContentIntent(p).setVisibility(Notification.VISIBILITY_PUBLIC)
         .setCategory(Notification.CATEGORY_TRANSPORT).setOnlyAlertOnce(true)
         .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_pause,"توقف موقت",action("pause",PAUSE,1)).build())
         .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_play,"ادامه",action("resume",RESUME,2)).build())
         .addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel,"پایان",action("stop",STOP,3)).build());
        if(Build.VERSION.SDK_INT>=21&&session!=null)
            b.setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken())
                .setShowActionsInCompactView(0,1));
        return b.build();
    }
    private void notifyChange(){
        if(!active)return;
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(manager!=null)manager.notify(NOTIFICATION,notification());
    }
    @Override public void onDestroy(){
        generation++;releasePlayer();clear();
        if(ticker!=null)handler.removeCallbacks(ticker);
        if(sleepJob!=null)handler.removeCallbacks(sleepJob);
        if(audioManager!=null)audioManager.abandonAudioFocus(focusListener);
        if(session!=null){session.setActive(false);session.release();session=null;}
        super.onDestroy();
    }
}
