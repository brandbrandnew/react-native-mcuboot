import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-mcuboot' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const Mcuboot = NativeModules.Mcuboot
  ? NativeModules.Mcuboot
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
  return Mcuboot.list(id, failureCallback, successCallback);
}

export function upload(
  id: String,
  data: String,
  image: number,
  callback: Function
): Promise<Array<Object>> {
  return Mcuboot.upload(id, data, image, callback);
}

export function test(
  id: String,
  hash: String,
  failureCallback: Function,
  successCallback: Function
): Promise<String> {
  return Mcuboot.test(id, hash, failureCallback, successCallback);
}

export function reset(
  id: String,
  failureCallback: Function,
  successCallback: Function
): Promise<String> {
  return Mcuboot.reset(id, failureCallback, successCallback);
}

export function confirm(
  id: String,
  hash: String,
  failureCallback: Function,
  successCallback: Function
): Promise<String> {
  return Mcuboot.confirm(id, hash, failureCallback, successCallback);
}

export const UploadEvents = new NativeEventEmitter(Mcuboot);
