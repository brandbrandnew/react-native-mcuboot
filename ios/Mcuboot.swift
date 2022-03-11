import McuManager
import os
import CoreBluetooth

@objc(RNMcuboot)
class RNMcuboot: RCTEventEmitter {
    var bleTransport: McuMgrBleTransport?
    var imageManager: ImageManager?
    var mManager: DefaultManager?
    var callback: RCTResponseSenderBlock?

    @objc
    func list(_ id: NSString, withFailureCallback failureCallback: @escaping RCTResponseSenderBlock, withSuccessCallback successCallback: @escaping RCTResponseSenderBlock) -> Void {
        guard let uuid = UUID(uuidString: id as String) else {
            return failureCallback([NSError(domain: "", code: 200, userInfo: nil), "failed to parse uuid"])
        }
        bleTransport = McuMgrBleTransport(uuid)
        imageManager = ImageManager(transporter: bleTransport!)
        imageManager?.list(callback: { (response, error) in
            if let response = response {
                if response.isSuccess() {
                    let images: NSMutableArray = []
                    
                    for (i, image) in response.images!.enumerated() {
                        let map: NSMutableDictionary = [:]
                        map["image"] = i
                        map["hash"] = image.hash
                        map["version"] = image.version
                        let flags: NSMutableArray = []
                        if image.active {
                            flags.add("active")
                        }
                        if image.confirmed {
                            flags.add("confirmed")
                        }
                        if image.pending {
                            flags.add("pending")
                        }
                        if image.permanent {
                            flags.add("permanent")
                        }
                        map["flags"] = flags
                        images.add(map)
                    }
                    successCallback([images])
                }
                else {
                    failureCallback([NSError(domain: "", code: 200, userInfo: nil), "failed to read images"])
                }
            }
            else {
                failureCallback([NSError(domain: "", code: 200, userInfo: nil), "no response when reading images"])
            }
        })
    }
    
    @objc
    func upload(_ id: NSString, withData data: NSString, withImage image: NSInteger, withCallback callback: @escaping RCTResponseSenderBlock) -> Void {
        guard let uuid = UUID(uuidString: id as String) else {
            return callback(["failed to parse uuid"])
        }
        guard let bytes = Data(base64Encoded: data as String) else {
            return callback(["failed to parse data"])
        }
        bleTransport = McuMgrBleTransport(uuid)
        imageManager = ImageManager(transporter: bleTransport!)
        self.callback = callback
        imageManager?.upload(data: bytes, delegate: self)
    }
    
    @objc
    func test(_ id: NSString, withHash hash: NSString, withFailureCallback failureCallback: @escaping RCTResponseSenderBlock, withSuccessCallback successCallback: @escaping RCTResponseSenderBlock) -> Void {
        guard let uuid = UUID(uuidString: id as String) else {
            return failureCallback(["failed to parse uuid"])
        }
        let array = hash.components(separatedBy: ",")
        let bytesHash = array.map{UInt8($0)!}
        bleTransport = McuMgrBleTransport(uuid)
        imageManager = ImageManager(transporter: bleTransport!)
        imageManager?.test(hash: bytesHash, callback: { (response, error) in
            if let response = response {
                if response.isSuccess() {
                    successCallback([response])
                }
                else {
                    failureCallback(["failed to test image"])
                }
            }
            else {
                failureCallback(["no response when testing image"])
            }
        })
    }
    
    @objc
    func reset(_ id: NSString, withFailureCallback failureCallback: @escaping RCTResponseSenderBlock, withSuccessCallback successCallback: @escaping RCTResponseSenderBlock) -> Void {
        guard let uuid = UUID(uuidString: id as String) else {
            return failureCallback(["failed to parse uuid"])
        }
        bleTransport = McuMgrBleTransport(uuid)
        mManager = DefaultManager(transporter: bleTransport!)
        mManager?.reset(callback: { (response, error) in
            if let response = response {
                if response.isSuccess() {
                    successCallback([response])
                }
                else {
                    failureCallback(["failed to reset image"])
                }
            }
            else {
                failureCallback(["no response when resetting image"])
            }
        })
    }
    
    @objc
    func confirm(_ id: NSString, withHash hash: NSString, withFailureCallback failureCallback: @escaping RCTResponseSenderBlock, withSuccessCallback successCallback: @escaping RCTResponseSenderBlock) -> Void {
        guard let uuid = UUID(uuidString: id as String) else {
            return failureCallback(["failed to parse uuid"])
        }
        let array = hash.components(separatedBy: ",")
        let bytesHash = array.map{UInt8($0)!}
        bleTransport = McuMgrBleTransport(uuid)
        imageManager = ImageManager(transporter: bleTransport!)
        imageManager?.confirm(hash: bytesHash, callback: { (response, error) in
            if let response = response {
                if response.isSuccess() {
                    successCallback([response])
                }
                else {
                    failureCallback(["failed to confirm image"])
                }
            }
            else {
                failureCallback(["no response when confirming image"])
            }
        })
    }
    
    @objc override func supportedEvents() -> [String] {
        return [
            "onUploadProgress",
        ]
    }
}

extension RNMcuboot: ImageUploadDelegate {
    func uploadProgressDidChange(bytesSent: Int, imageSize: Int, timestamp: Date) {
        let map: NSMutableDictionary = [:]
        map["current"] = bytesSent
        map["total"] = imageSize
        map["timestamp"] = timestamp
        self.sendEvent(withName: "onUploadProgress", body: map)
    }
    
    func uploadDidFail(with error: Error) {
        self.callback!([error])
    }
    
    func uploadDidCancel() {
        self.callback!(["Upload cancelled"])
    }
    
    func uploadDidFinish() {
        self.callback!(["Upload finished"])
    }
}
