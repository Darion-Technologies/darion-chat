package com.darion.chat;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DarionCall")
public class DarionCallPlugin extends Plugin {

    private static final String CALL_CHANNEL_ID = "darion_native_incoming_call_channel";
    private static final int CALL_NOTIFICATION_ID = 99991;

    private Ringtone currentRingtone = null;
    private MediaPlayer mediaPlayer = null;
    private Vibrator vibrator = null;
    private PowerManager.WakeLock wakeLock = null;

    @Override
    public void load() {
        super.load();
        createCallNotificationChannel();
    }

    private void createCallNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build();

                NotificationChannel channel = new NotificationChannel(
                        CALL_CHANNEL_ID,
                        "Incoming Calls",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Full-screen ringing alert for incoming audio and video calls");
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 600, 300, 600, 300, 600});
                channel.setSound(ringtoneUri, audioAttributes);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setBypassDnd(true);

                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @PluginMethod
    public void showIncomingCall(PluginCall call) {
        String callerName = call.getString("callerName", "Team Member");
        String roomCode = call.getString("roomCode", "");
        String callType = call.getString("callType", "video");

        Context context = getContext();

        // 1. Acquire WakeLock to turn on screen and keep CPU active
        try {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.release();
                }
                wakeLock = powerManager.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                        "DarionChat:IncomingCallWakeLock"
                );
                wakeLock.acquire(35000); // Max 35s
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Build Intent to launch MainActivity over Lock Screen
        Intent fullScreenIntent = new Intent(context, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("callId", roomCode);
        fullScreenIntent.putExtra("callerName", callerName);
        fullScreenIntent.putExtra("callType", callType);
        fullScreenIntent.putExtra("action", "accept");

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                context,
                0,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        // 3. Create High-Priority Full Screen Notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CALL_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setContentTitle("📞 Incoming " + (callType.equals("audio") ? "Voice" : "Video") + " Call")
                .setContentText(callerName + " is calling you...")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setOngoing(true)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(android.R.drawable.ic_menu_call, "Answer", fullScreenPendingIntent);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(CALL_NOTIFICATION_ID, builder.build());
        }

        // 4. Start Hardware Ringtone & Vibration
        startNativeRingtone(context);

        call.resolve(new JSObject().put("success", true));
    }

    private void startNativeRingtone(Context context) {
        stopNativeRingtone();
        try {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            currentRingtone = RingtoneManager.getRingtone(context, ringtoneUri);
            if (currentRingtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    currentRingtone.setLooping(true);
                }
                currentRingtone.play();
            }

            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 600, 300, 600, 300, 600};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopNativeRingtone() {
        try {
            if (currentRingtone != null && currentRingtone.isPlaying()) {
                currentRingtone.stop();
                currentRingtone = null;
            }
            if (vibrator != null) {
                vibrator.cancel();
                vibrator = null;
            }
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
            }
            NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(CALL_NOTIFICATION_ID);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PluginMethod
    public void startRingtone(PluginCall call) {
        startNativeRingtone(getContext());
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void stopRingtone(PluginCall call) {
        stopNativeRingtone();
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void setSpeakerphone(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                audioManager.setSpeakerphoneOn(enabled);
            }
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("Failed to set speakerphone: " + e.getMessage());
        }
    }
}
