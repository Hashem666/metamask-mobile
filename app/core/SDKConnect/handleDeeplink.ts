import AppConstants from '../AppConstants';
import SDKConnect from './SDKConnect';
import DevLogger from './utils/DevLogger';
import { waitForCondition } from './utils/wait.util';

const QRCODE_PARAM_PATTERN = '&t=q';

const handleDeeplink = async ({
  sdkConnect,
  channelId,
  origin,
  url,
  otherPublicKey,
  context,
}: {
  sdkConnect: SDKConnect;
  channelId: string;
  origin: string;
  url: string;
  otherPublicKey: string;
  context: string;
}) => {
  if (!sdkConnect.hasInitialized()) {
    DevLogger.log(
      `handleDeeplink:: sdkConnect not initialized --- waiting for it`,
    );
    await waitForCondition({
      fn: () => sdkConnect.hasInitialized(),
      context: 'deeplink',
      waitTime: 500,
    });
    DevLogger.log(
      `handleDeeplink:: sdkConnect initialized --- continue with deeplink`,
    );
  }

  DevLogger.log(`handleDeeplink:: origin=${origin} url=${url}`);
  // Detect if origin matches qrcode param
  // SDKs should all add the type of intended use in the qrcode so it can be used correctly when scaning with the camera
  // does url contains t=d (deelink) or t=q (qrcode)
  if (origin === AppConstants.DEEPLINKS.ORIGIN_DEEPLINK) {
    // Confirm that the url doesn't contain a qrcode param
    // If it happens, it means the user scaned the qrcode with the camera (outside metamask app)
    if (url.includes(QRCODE_PARAM_PATTERN)) {
      DevLogger.log(
        `handleDeeplink:: url=${url} contains qrcode param --- change origin to qrcode`,
      );
      origin = AppConstants.DEEPLINKS.ORIGIN_QR_CODE;
    }
  }
  DevLogger.log(`handleDeeplink:: url=${url}`);
  const connections = sdkConnect.getConnections();
  const channelExists = connections[channelId] !== undefined;
  // TODO:  or like this? Need to compare...
  // const channelExists = sdkConnect.getApprovedHosts()[params.channelId];

  DevLogger.log(
    `handleDeeplink:: channel=${channelId} exists=${channelExists}`,
  );

  if (channelExists) {
    if (origin === AppConstants.DEEPLINKS.ORIGIN_DEEPLINK) {
      // Automatically re-approve hosts.
      sdkConnect.revalidateChannel({
        channelId,
      });
    }
    sdkConnect.reconnect({
      channelId,
      otherPublicKey,
      context,
      initialConnection: false,
      updateKey: true,
    });
  } else {
    sdkConnect.connectToChannel({
      id: channelId,
      origin,
      otherPublicKey,
    });
  }
};

export default handleDeeplink;
