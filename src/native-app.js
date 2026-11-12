// The iPhone app (ios/, TasKit) plays this same page from baitaldumiah://app/ and listens on
// webkit.messageHandlers.baitaldumiah. On the web that handler never exists, so nothing changes.
export const NATIVE_HANDLER='baitaldumiah';
export function inNativeApp(scope=globalThis){
 try{return Boolean(scope.webkit?.messageHandlers?.[NATIVE_HANDLER])}catch{return false}
}
