#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_REMAP_MODULE(Mcuboot, RNMcuboot, RCTEventEmitter)

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

RCT_EXTERN_METHOD(list:(NSString)id withFailureCallback:(RCTResponseSenderBlock)failureCallback withSuccessCallback:(RCTResponseSenderBlock)successCallback)

RCT_EXTERN_METHOD(upload:(NSString)id withData:(NSString)data withImage:(NSInteger)image withCallback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(test:(NSString)id withHash:(NSString)hash withFailureCallback:(RCTResponseSenderBlock)failureCallback withSuccessCallback:(RCTResponseSenderBlock)successCallback)

RCT_EXTERN_METHOD(reset:(NSString)id withFailureCallback:(RCTResponseSenderBlock)failureCallback withSuccessCallback:(RCTResponseSenderBlock)successCallback)

RCT_EXTERN_METHOD(confirm:(NSString)id withHash:(NSString)hash withFailureCallback:(RCTResponseSenderBlock)failureCallback withSuccessCallback:(RCTResponseSenderBlock)successCallback)

@end
