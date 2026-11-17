package ir.nahj.towhidkarbordi;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.MediaMetadata;
import android.media.PlaybackParams;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import java.io.File;
import org.json.JSONObject;

/** Optional audio-only player for the exact owner's HTTPS MP3 catalog or cached copies.
 * The approved HTML audio controls remain available; this service is opt-in.
 * Users can continue/pause from the lock-screen and headphone media controls. */
public final class PmmAudioService extends Service {
    public static final String START="ir.nahj.towhidkarbordi.PMM_AUDIO_START";
    public static final String TOGGLE="ir.nahj.towhidkarbordi.PMM_AUDIO_TOGGLE";
    public static final String STOP="ir.nahj.towhidkarbordi.PMM_AUDIO_STOP";
    private static final int ID=8108;
    private static final String CHANNEL="pmm_owner_audio_v108";
    private static volatile PmmAudioService instance;
    private MediaPlayer player;
    private MediaSession mediaSession;
    private String title="";
    private String currentUrl="";
    private int requestedSecond=0;
    private float requestedRate=1f;
    private boolean preparing=false;
    private boolean playing=false;
    private boolean foreground=false;

    public static String status() {
        PmmAudioService service=instance;
        JSONObject result=new JSONObject();
        try {
            result.put("active",service!=null&&(service.preparing||service.player!=null));
            result.put("playing",service!=null&&service.playing);
            result.put("title",service!=null?service.title:"");
            result.put("url",service!=null?service.currentUrl:"");
            result.put("position",service!=null?service.position():0);
            result.put("duration",service!=null?service.duration():0);
        }catch(Exception ignored){}
        return result.toString();
    }
    @Override public void onCreate() {
        super.onCreate();
        instance=this;
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26&&manager!=null)
            manager.createNotificationChannel(new NotificationChannel(
                CHANNEL,"پخش صوت پای منبر مولا",NotificationManager.IMPORTANCE_LOW));
        mediaSession=new MediaSession(this,"PMM-Audio-Owner");
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS|
            MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSession.Callback(){
            @Override public void onPlay(){resumeAudio();}
            @Override public void onPause(){pauseAudio();}
            @Override public void onStop(){stopSelf();}
            @Override public void onSeekTo(long pos){seek(Math.max(0,(int)(pos/1000L)));}
        });
        mediaSession.setActive(true);
        updateSession();
    }
    private PendingIntent command(String action,int request){
        Intent intent=new Intent(this,PmmAudioService.class).setAction(action);
        int flags=PendingIntent.FLAG_UPDATE_CURRENT;
        if(Build.VERSION.SDK_INT>=23)flags|=PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this,request,intent,flags);
    }
    private Notification notification(){
        Intent home=new Intent(this,MainActivity.class);
        int flags=PendingIntent.FLAG_UPDATE_CURRENT;
        if(Build.VERSION.SDK_INT>=23)flags|=PendingIntent.FLAG_IMMUTABLE;
        Notification.Builder b=Build.VERSION.SDK_INT>=26?
            new Notification.Builder(this,CHANNEL):new Notification.Builder(this);
        b.setContentTitle("پای منبر مولا")
            .setContentText(title.isEmpty()?"شرح صوتی":title)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(PendingIntent.getActivity(this,0,home,flags))
            .setOnlyAlertOnce(true).setOngoing(playing)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .addAction(playing?android.R.drawable.ic_media_pause:android.R.drawable.ic_media_play,
                playing?"توقف موقت":"ادامه",command(TOGGLE,1))
            .addAction(android.R.drawable.ic_menu_close_clear_cancel,"پایان",command(STOP,2));
        if(Build.VERSION.SDK_INT>=21)b.setStyle(new Notification.MediaStyle()
            .setMediaSession(mediaSession.getSessionToken()).setShowActionsInCompactView(0,1));
        return b.build();
    }
    private int position(){try{return player==null?0:player.getCurrentPosition()/1000}catch(Exception e){return requestedSecond;}}
    private int duration(){try{return player==null?0:player.getDuration()/1000}catch(Exception e){return 0;}}
    private void updateSession(){
        if(mediaSession==null)return;
        long actions=PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|
            PlaybackState.ACTION_PLAY_PAUSE|PlaybackState.ACTION_STOP|PlaybackState.ACTION_SEEK_TO;
        PlaybackState state=new PlaybackState.Builder().setActions(actions)
          .setState(preparing?PlaybackState.STATE_BUFFERING:playing?PlaybackState.STATE_PLAYING:PlaybackState.STATE_PAUSED,
              position()*1000L,playing?requestedRate:0f,SystemClock.elapsedRealtime()).build();
        mediaSession.setPlaybackState(state);
        mediaSession.setMetadata(new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE,title)
            .putString(MediaMetadata.METADATA_KEY_ARTIST,"پای منبر مولا")
            .putLong(MediaMetadata.METADATA_KEY_DURATION,duration()*1000L).build());
        if(foreground)((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(ID,notification());
    }
    private void refreshNotification(){
        if(!foreground){
            if(Build.VERSION.SDK_INT>=29)startForeground(ID,notification(),android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(ID,notification());
            foreground=true;
        }else{
            NotificationManager n=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            if(n!=null)n.notify(ID,notification());
        }
    }
    private void releasePlayer(){
        preparing=false;playing=false;
        if(player!=null){try{player.reset();player.release();}catch(Exception ignored){}player=null;}
    }
    private void startAudio(Intent intent){
        String url=intent.getStringExtra("url");
        if(!PmmAudioDownloads.allowed(url)){stopSelf();return;}
        String requestedTitle=intent.getStringExtra("title");
        title=requestedTitle==null?"شرح صوتی":requestedTitle.substring(0,Math.min(110,requestedTitle.length()));
        currentUrl=url;
        requestedSecond=Math.max(0,Math.min(86400,intent.getIntExtra("second",0)));
        requestedRate=Math.max(0.75f,Math.min(2f,intent.getFloatExtra("rate",1f)));
        releasePlayer();
        try{
            player=new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            File file=PmmAudioDownloads.fileFor(this,url);
            if(file.isFile()&&file.length()>1000)player.setDataSource(file.getAbsolutePath());
            else player.setDataSource(this,Uri.parse(url));
            preparing=true;refreshNotification();updateSession();
            player.setOnPreparedListener(mp->{
                preparing=false;
                if(requestedSecond>0&&mp.getDuration()>2000)
                   mp.seekTo(Math.min(requestedSecond*1000,mp.getDuration()-1000));
                mp.start();playing=true;
                try{mp.setPlaybackParams(new PlaybackParams().setSpeed(requestedRate));}catch(Exception ignored){}
                updateSession();
            });
            player.setOnCompletionListener(mp->{playing=false;updateSession();stopSelf();});
            player.setOnErrorListener((mp,what,extra)->{releasePlayer();stopSelf();return true;});
            player.prepareAsync();
        }catch(Exception invalid){releasePlayer();stopSelf();}
    }
    private void pauseAudio(){if(player!=null&&!preparing&&playing){
        try{player.pause();playing=false;updateSession();}catch(Exception ignored){}
    }}
    private void resumeAudio(){if(player!=null&&!preparing&&!playing){
        try{player.start();playing=true;updateSession();refreshNotification();}catch(Exception ignored){}
    }}
    private void seek(int second){
        if(player!=null&&!preparing)try{player.seekTo(Math.min(second*1000,Math.max(0,player.getDuration()-1000)));updateSession();}catch(Exception ignored){}
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        String action=intent==null?"":intent.getAction();
        if(START.equals(action))startAudio(intent);
        else if(TOGGLE.equals(action)){if(playing)pauseAudio();else resumeAudio();}
        else if(STOP.equals(action))stopSelf();
        else if(player==null)stopSelf();
        return START_NOT_STICKY;
    }
    @Override public void onDestroy(){
        releasePlayer();
        if(mediaSession!=null){mediaSession.setActive(false);mediaSession.release();mediaSession=null;}
        if(foreground){stopForeground(true);foreground=false;}
        if(instance==this)instance=null;
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}
