import React, { useEffect, useState } from 'react';

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { list, upload, test, reset, confirm } from 'react-native-mcuboot';
import { uniqBy, filter } from 'lodash';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

const VERSION = '0.1.64';

const downloadOptions = {
  fromUrl: `https://firmware.heatle.de/nrf/heatle-ble-signed-encrypted-development-${VERSION}.bin`,
  toFile: `${RNFS.TemporaryDirectoryPath}/${VERSION}.bin`,
};

export default function App() {
  const actions = ['Download', 'Upload', 'Test', 'Reset', 'Confirm'];
  const [bleManager, setBleManager] = useState<BleManager | undefined>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [device, setDevice] = useState<Device | undefined>(null);
  const [images, setImages] = useState<Array | undefined>([]);
  const [downloading, setDownloading] = useState<Boolean | undefined>(false);
  const [totalBytes, setTotalBytes] = useState<number | undefined>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number | undefined>(0);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.NrfDeviceManager);
    const eventListener = eventEmitter.addListener(
      'onUploadProgress',
      (event) => {
        console.log(event); // "someValue"
      }
    );
    const manager = new BleManager();
    setBleManager(manager);

    return () => {
      console.log('Destroying BLE Manager');
      manager.destroy();
      eventListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!bleManager) return;

    bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {
      if (error) {
        console.log('Scan error', error);
        return;
      }

      if (!scannedDevice) return;

      if (scannedDevice.name !== 'Heatle-Hub') return;

      setDevices((oldDevices) => uniqBy([...oldDevices, scannedDevice], 'id'));
    });
  }, [bleManager]);

  useEffect(() => {
    if (!device) return;

    listImages(device.id);
  }, [device]);

  const handleDevice = async (d) => {
    console.log(`found Heatle ${d.id}`);
    bleManager.stopDeviceScan();
    //await d.connect();
    setDevice(d);
  };

  const listImages = (id) => {
    list(
      id,
      (error) => {
        console.log('List error', error);
      },
      (images) => {
        console.log('Images', images);
        setImages(images);
      }
    );
  };

  const handleAction = async (action) => {
    console.log(action);
    switch (action) {
      case 'Download':
        RNFS.downloadFile({
          ...downloadOptions,
          begin: (data) => {
            setTotalBytes(data.contentLength);
            setDownloading(true);
          },
          progress: (data) => {
            setDownloadedBytes(data.bytesWritten);
          },
        })
          .promise.then((response) => {
            setDownloading(false);
            console.log(response);
            if (response.statusCode == 200) {
              return true;
            } else {
              console.log('Download failed', res);
              return false;
            }
          })
          .catch((err) => {
            console.log('DownloadFile error', err);
            return false;
          });
        break;
      case 'Upload':
        const response = await RNFS.readFile(downloadOptions.toFile, 'base64');
        const bytes = Buffer.from(response, 'base64');
        const data = bytes.toJSON().data;
        upload(device.id, response, 0, (result) => {
          console.log(result);
          listImages(device.id);
        });
        break;
      case 'Test':
        if (images.length < 2) break;
        test(
          device.id,
          images[1].hash,
          (error) => {
            console.log('Test error', error);
          },
          (response) => {
            console.log('Test', response);
            listImages(device.id);
          }
        );
        break;
      case 'Reset':
        reset(
          device.id,
          (error) => {
            console.log('Reset error', error);
          },
          (response) => {
            console.log('Reset', response);
            listImages(device.id);
          }
        );
        break;
      case 'Confirm':
        confirm(
          device.id,
          images[0].hash,
          (error) => {
            console.log('Confirm error', error);
          },
          (response) => {
            console.log('Confirm', response);
            listImages(device.id);
          }
        );
        break;
    }
  };

  return (
    <View style={styles.container}>
      {device ? (
        <View style={styles.images}>
          <Text style={{ fontSize: 18 }}>{device.name || '[Unnamed]'}</Text>
          <Text>{device.id}</Text>
          {images.map((item) => (
            <TouchableOpacity key={item.version} style={styles.item}>
              <Text>{`Image: ${item.image}`}</Text>
              <Text>{`Hash: ${item.hash}`}</Text>
              <Text>{`Version: ${item.version}`}</Text>
              <Text>{`Flags: ${item.flags.toString()}`}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.actions}>
            {actions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.action}
                onPress={() => handleAction(item)}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {downloading && (
            <Text>
              Downloading ({downloadedBytes}/{totalBytes})
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.devices}>
          {devices.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => handleDevice(item)}
            >
              <Text style={{ fontSize: 18 }}>{item.name || '[Unnamed]'}</Text>
              <Text>{item.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  images: {
    width: '60%',
  },
  devices: {
    width: '60%',
  },
  item: {
    marginVertical: '2%',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  action: {
    backgroundColor: '#DDD',
    borderRadius: 20,
    paddingVertical: '4%',
    paddingHorizontal: '6%',
    marginRight: '2%',
  },
});
