package com.reactnativemcuboot;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;
import java.util.Arrays;

import io.runtime.mcumgr.McuMgrCallback;
import io.runtime.mcumgr.McuMgrTransport;
import io.runtime.mcumgr.ble.McuMgrBleTransport;
import io.runtime.mcumgr.exception.McuMgrException;
import io.runtime.mcumgr.managers.DefaultManager;
import io.runtime.mcumgr.managers.ImageManager;
import io.runtime.mcumgr.response.McuMgrResponse;
import io.runtime.mcumgr.response.img.McuMgrImageStateResponse;
import io.runtime.mcumgr.transfer.UploadCallback;

@ReactModule(name = McubootModule.NAME)
public class McubootModule extends ReactContextBaseJavaModule {
  public static final String NAME = "Mcuboot";
  private final ReactApplicationContext reactContext;
  BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
  McuMgrTransport transport;
  ImageManager imageManager;
  DefaultManager mManager;

  public McubootModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void list(String id, Callback failureCallback, Callback successCallback) throws McuMgrException {
    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(id);
    transport = new McuMgrBleTransport(this.reactContext, device);
    imageManager = new ImageManager(transport);
    imageManager.list(new McuMgrCallback<McuMgrImageStateResponse>() {
      @Override
      public void onResponse(@NotNull McuMgrImageStateResponse response) {
        WritableArray images = new WritableNativeArray();
        if(response.images != null) {
          for (McuMgrImageStateResponse.ImageSlot slot : response.images) {
            WritableMap map = new WritableNativeMap();
            map.putString("image", String.valueOf(slot.image));
            byte[] hash = Base64.encode(slot.hash, Base64.DEFAULT);
            map.putString("hash", new String(hash));
            map.putString("version", slot.version);
            WritableArray flags = new WritableNativeArray();
            if(slot.active)
              flags.pushString("active");
            if(slot.confirmed)
              flags.pushString("confirmed");
            if(slot.pending)
              flags.pushString("pending");
            if(slot.permanent)
              flags.pushString("permanent");
            map.putArray("flags", flags);
            images.pushMap(map);
          }
          successCallback.invoke(images);
        }
      }

      @Override
      public void onError(@NotNull McuMgrException error) {
        failureCallback.invoke(error.toString());
      }
    });
  }

  @ReactMethod
  public void upload(String id, String data, int image, Callback callback) throws McuMgrException, IOException {
    byte [] bytes = Base64.decode(data, Base64.DEFAULT);
    System.out.println(Arrays.toString(bytes));
    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(id);
    transport = new McuMgrBleTransport(this.reactContext, device);
    imageManager = new ImageManager(transport);
    imageManager.imageUpload(bytes, image, new UploadCallback() {
      @Override
      public void onUploadProgressChanged(int current, int total, long timestamp) {
        WritableMap map = new WritableNativeMap();
        map.putInt("current", current);
        map.putInt("total", total);
        map.putInt("timestamp", (int) timestamp);
        reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("onUploadProgress", map);
      }

      @Override
      public void onUploadFailed(@NotNull McuMgrException error) {
        callback.invoke("failed " + error);
      }

      @Override
      public void onUploadCanceled() {
        callback.invoke("canceled");
      }

      @Override
      public void onUploadCompleted() {
        callback.invoke("completed");
      }
    });
  }

  @ReactMethod
  public void test(String id, String hash, Callback failureCallback, Callback successCallback) throws McuMgrException, IOException {
    byte [] bytesHash = Base64.decode(hash, Base64.DEFAULT);
    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(id);
    transport = new McuMgrBleTransport(this.reactContext, device);
    imageManager = new ImageManager(transport);
    imageManager.test(bytesHash, new McuMgrCallback<McuMgrImageStateResponse>() {
      @Override
      public void onResponse(@NotNull McuMgrImageStateResponse response) {
        successCallback.invoke(response.toString());
      }

      @Override
      public void onError(@NotNull McuMgrException error) {
        failureCallback.invoke(error.toString());
      }
    });
  }

  @ReactMethod
  public void reset(String id, Callback failureCallback, Callback successCallback) throws McuMgrException, IOException {
    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(id);
    transport = new McuMgrBleTransport(this.reactContext, device);
    mManager = new DefaultManager(transport);
    mManager.reset(new McuMgrCallback<McuMgrResponse>() {
      @Override
      public void onResponse(@NotNull McuMgrResponse response) {
        successCallback.invoke(response.toString());
        mManager.getTransporter().addObserver(new McuMgrTransport.ConnectionObserver() {
          @Override
          public void onConnected() {
            System.out.println("Connected");
          }

          @Override
          public void onDisconnected() {
            System.out.println("Disconnected");
          }
        });
      }

      @Override
      public void onError(@NotNull McuMgrException error) {
        failureCallback.invoke(error.toString());
      }
    });
  }

  @ReactMethod
  public void confirm(String id, String hash, Callback failureCallback, Callback successCallback) throws McuMgrException, IOException {
    byte [] bytesHash = Base64.decode(hash, Base64.DEFAULT);
    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(id);
    transport = new McuMgrBleTransport(this.reactContext, device);
    imageManager = new ImageManager(transport);
    imageManager.confirm(bytesHash, new McuMgrCallback<McuMgrImageStateResponse>() {
      @Override
      public void onResponse(@NotNull McuMgrImageStateResponse response) {
        successCallback.invoke(response.toString());
      }

      @Override
      public void onError(@NotNull McuMgrException error) {
        failureCallback.invoke(error.toString());
      }
    });
  }

  public static native int nativeMultiply(int a, int b);
}
