import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-mcuboot' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const NrfDeviceManager = NativeModules.NrfDeviceManager
  ? NativeModules.NrfDeviceManager
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function list(
  id: String,
  failureCallback: Function,
  successCallback: Function
): Promise<Array<Object>> {
  return NrfDeviceManager.list(id, failureCallback, successCallback);
}

export function upload(
  id: String,
  data: String,
  image: number,
  callback: Function
): Promise<Array<Object>> {
  return NrfDeviceManager.upload(id, data, image, callback);
}

export function test(
  id: String,
  hash: String,
  failureCallback: Function,
  successCallback: Function
): Promise<String> {
  return NrfDeviceManager.test(id, hash, failureCallback, successCallback);
}

export function reset(
  id: String,
  failureCallback: Function,
  successCallback: Function
): Promise<String> {
  return NrfDeviceManager.reset(id, failureCallback, successCallback);
}

export function confirm(
  id: String,
  hash: String,
  failureCallback: Function,
  successCallback: Function
): Promise<String> {
  return NrfDeviceManager.confirm(id, hash, failureCallback, successCallback);
}
