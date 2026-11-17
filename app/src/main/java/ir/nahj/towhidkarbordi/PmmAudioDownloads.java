package ir.nahj.towhidkarbordi;

import android.content.Context;
import android.net.Uri;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;

/** User-requested, private offline MP3 cache. Never exports private files or follows redirects.
 *  Strict host/path allowlist shared with the original audio catalog. */
public final class PmmAudioDownloads {
    private PmmAudioDownloads(){}
    private static final long MAX_BYTES=120L*1024*1024;
    private static final ConcurrentHashMap<String,Integer> progress=new ConcurrentHashMap<>();
    static boolean allowed(String raw){
        if(raw==null||raw.length()>350)return false;
        try{
            Uri uri=Uri.parse(raw);
            if(!"https".equals(uri.getScheme())||!"dl.kazeminia110.ir".equals(uri.getHost())||
               uri.getPort()!=-1||uri.getUserInfo()!=null||uri.getEncodedQuery()!=null||uri.getFragment()!=null)return false;
            String path=uri.getPath();
            if(path==null)return false;
            if(path.matches("/Audio/kafi/(?:kafi kotobe arbae|kafi (?:[1-9]|[1-4][0-9]|5[0-4]))\\.mp3"))return true;
            return path.matches("/Audio/nahj-al-balaghe/tartibi/(?:khotbe/khotbe|name/name|hekmat/hekmat) [A-Za-z0-9. &]+\\.mp3");
        }catch(Exception ignored){return false;}
    }
    static String hash(String url){
        try{
            byte[] data=MessageDigest.getInstance("SHA-256").digest(url.getBytes(StandardCharsets.UTF_8));
            StringBuilder out=new StringBuilder();
            for(byte b:data)out.append(String.format(java.util.Locale.US,"%02x",b&0xff));
            return out.toString();
        }catch(Exception e){return Integer.toHexString(url.hashCode());}
    }
    static File fileFor(Context ctx,String url){
        return new File(new File(ctx.getFilesDir(),"pmm_audio_cache"),hash(url)+".mp3");
    }
    private static void remember(Context ctx,String url){
        try{
            android.content.SharedPreferences p=ctx.getSharedPreferences("pmm_audio_v108",Context.MODE_PRIVATE);
            JSONArray list=new JSONArray(p.getString("links","[]"));
            for(int i=0;i<list.length();i++)if(url.equals(list.optString(i)))return;
            list.put(url);
            p.edit().putString("links",list.toString()).apply();
        }catch(Exception ignored){}
    }
    private static void forget(Context ctx,String url){
        try{
            android.content.SharedPreferences p=ctx.getSharedPreferences("pmm_audio_v108",Context.MODE_PRIVATE);
            JSONArray list=new JSONArray(p.getString("links","[]")),revised=new JSONArray();
            for(int i=0;i<list.length();i++)if(!url.equals(list.optString(i)))revised.put(list.optString(i));
            p.edit().putString("links",revised.toString()).apply();
        }catch(Exception ignored){}
    }
    static String info(Context ctx,String url){
        JSONObject data=new JSONObject();
        try{
            data.put("valid",allowed(url));
            File f=allowed(url)?fileFor(ctx,url):null;
            data.put("downloaded",f!=null&&f.isFile()&&f.length()>1000);
            data.put("bytes",f!=null&&f.isFile()?f.length():0);
            data.put("downloading",progress.containsKey(url));
            data.put("percent",progress.getOrDefault(url,0));
        }catch(Exception ignored){}
        return data.toString();
    }
    static String all(Context ctx){
        JSONArray result=new JSONArray();
        try{
            android.content.SharedPreferences p=ctx.getSharedPreferences("pmm_audio_v108",Context.MODE_PRIVATE);
            JSONArray list=new JSONArray(p.getString("links","[]"));
            for(int i=0;i<list.length();i++){
                String url=list.optString(i);
                if(!allowed(url))continue;
                File f=fileFor(ctx,url);
                if(!f.exists()&&!progress.containsKey(url))continue;
                JSONObject x=new JSONObject();
                x.put("url",url);
                x.put("title",Uri.parse(url).getLastPathSegment());
                x.put("complete",f.length()>1000);
                x.put("percent",progress.getOrDefault(url,f.length()>1000?100:0));
                result.put(x);
            }
        }catch(Exception ignored){}
        return result.toString();
    }
    static void remove(Context ctx,String url){
        if(!allowed(url)||progress.containsKey(url))return;
        File f=fileFor(ctx,url);
        if(f.exists())f.delete();
        forget(ctx,url);
    }
    static void start(Context ctx,ExecutorService executor,String url){
        if(!allowed(url)||progress.putIfAbsent(url,0)!=null)return;
        File target=fileFor(ctx,url);
        if(target.isFile()&&target.length()>1000){progress.remove(url);remember(ctx,url);return;}
        remember(ctx,url);
        executor.execute(()->{
            HttpURLConnection conn=null;
            File temp=new File(target.getParentFile(),target.getName()+".part");
            try{
                File directory=target.getParentFile();
                if(directory==null||(!directory.exists()&&!directory.mkdirs()))throw new IllegalStateException("cache dir");
                URL endpoint=new URL(url.replace(" ","%20"));
                conn=(HttpURLConnection)endpoint.openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(14000);
                conn.setInstanceFollowRedirects(false);
                conn.setUseCaches(false);
                conn.setRequestProperty("Accept","audio/mpeg, application/octet-stream");
                if(conn.getResponseCode()!=200)throw new IllegalStateException("HTTP "+conn.getResponseCode());
                String type=conn.getContentType();
                if(type!=null&&type.toLowerCase(java.util.Locale.ROOT).contains("text/html"))
                   throw new IllegalStateException("server HTML");
                long length=conn.getContentLengthLong();
                if(length>MAX_BYTES)throw new IllegalStateException("oversize");
                long total=0;
                try(InputStream source=conn.getInputStream();FileOutputStream file=new FileOutputStream(temp)){
                    byte[] block=new byte[16384];int n;
                    while((n=source.read(block))!=-1){
                        total+=n;
                        if(total>MAX_BYTES)throw new IllegalStateException("oversize");
                        file.write(block,0,n);
                        if(length>0)progress.put(url,(int)Math.min(99,total*100/length));
                    }
                    file.getFD().sync();
                }
                if(total<1000)throw new IllegalStateException("empty");
                if(target.exists()&&!target.delete())throw new IllegalStateException("existing");
                if(!temp.renameTo(target))throw new IllegalStateException("rename");
            }catch(Exception invalid){
                if(temp.exists())temp.delete();
                forget(ctx,url);
            }finally{
                if(conn!=null)conn.disconnect();
                progress.remove(url);
            }
        });
    }
}
