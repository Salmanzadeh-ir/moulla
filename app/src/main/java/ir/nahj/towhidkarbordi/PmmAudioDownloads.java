package ir.nahj.towhidkarbordi;

import android.app.Activity;
import android.content.Context;
import android.os.Environment;
import android.webkit.MimeTypeMap;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.HttpURLConnection;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicBoolean;

/** Owner-hosted audio, user-requested downloads only. Files are kept in app-specific storage. */
public final class PmmAudioDownloads {
    private static final AtomicBoolean BUSY=new AtomicBoolean(false);
    private static final long MAX_BYTES=150L*1024L*1024L;
    private PmmAudioDownloads(){}

    public interface Callback{void onFinished(String url,String title,boolean ok,String error);}
    public static File offlineFile(Context context,String url){
        if(!PmmBackgroundAudioService.allowed(url))return null;
        try{
            File base=context.getExternalFilesDir(Environment.DIRECTORY_MUSIC);
            if(base==null)return null;
            File folder=new File(base,"PayeMenbareMola");
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            byte[] hash=digest.digest(url.getBytes("UTF-8"));
            StringBuilder name=new StringBuilder();
            for(byte b:hash)name.append(String.format(java.util.Locale.ROOT,"%02x",b&255));
            return new File(folder,name.toString()+".mp3");
        }catch(Exception ignored){return null;}
    }
    public static boolean available(Context context,String url){
        File f=offlineFile(context,url);return f!=null&&f.isFile()&&f.length()>128;
    }
    public static boolean delete(Context context,String url){
        File f=offlineFile(context,url);return f!=null&&(!f.exists()||f.delete());
    }
    public static boolean download(Activity activity,String url,String title,Callback cb){
        if(!PmmBackgroundAudioService.allowed(url)||!BUSY.compareAndSet(false,true))return false;
        // The caller must be the trusted first-party page, after a download-button tap.
        Thread worker=new Thread(()->{
            String error="";
            boolean success=false;
            File dest=offlineFile(activity,url),temp=null;
            HttpURLConnection connection=null;
            try{
                if(dest==null)throw new IllegalStateException("فضای ذخیره در دسترس نیست");
                if(available(activity,url)){success=true;return;}
                File parent=dest.getParentFile();
                if(parent==null||(!parent.exists()&&!parent.mkdirs()))throw new IllegalStateException("پوشه ساخته نشد");
                temp=new File(parent,dest.getName()+".partial");
                URL remote=new URL(url.replace(" ","%20"));
                connection=(HttpURLConnection)remote.openConnection();
                connection.setConnectTimeout(16000);
                connection.setReadTimeout(24000);
                connection.setInstanceFollowRedirects(false);
                connection.setRequestProperty("Accept","audio/mpeg");
                connection.setRequestProperty("User-Agent","PayeMenbareMola/1.0");
                int response=connection.getResponseCode();
                if(response!=200)throw new IllegalStateException("پاسخ سرور "+response);
                String type=connection.getContentType();
                if(type!=null&&!type.toLowerCase(java.util.Locale.ROOT).startsWith("audio/")&&
                     !type.toLowerCase(java.util.Locale.ROOT).startsWith("application/octet-stream"))
                    throw new IllegalStateException("پاسخ سرور فایل صوتی نیست");
                long len=connection.getContentLengthLong();
                if(len>MAX_BYTES)throw new IllegalStateException("حجم این صوت بیشتر از حد مجاز است");
                long read=0;
                byte[] buffer=new byte[32*1024];
                try(InputStream in=connection.getInputStream();FileOutputStream out=new FileOutputStream(temp)){
                    int count;
                    while((count=in.read(buffer))!=-1){
                        read+=count;if(read>MAX_BYTES)throw new IllegalStateException("فایل بسیار بزرگ است");
                        out.write(buffer,0,count);
                    }
                    out.getFD().sync();
                }
                if(read<256||(len>0&&len!=read))throw new IllegalStateException("دانلود ناقص است");
                if(!temp.renameTo(dest))throw new IllegalStateException("ذخیره فایل ممکن نشد");
                success=true;
            }catch(Exception ex){error=ex.getMessage()==null?"خطا در دریافت صوت":ex.getMessage();}
            finally{
                if(connection!=null)connection.disconnect();
                if(temp!=null&&temp.exists())temp.delete();
                BUSY.set(false);
                final boolean ok=success;final String problem=error;
                activity.runOnUiThread(()->cb.onFinished(url,title,ok,problem));
            }
        },"PMM-Owner-Audio-Download");
        worker.setDaemon(true);
        worker.start();
        return true;
    }
}
