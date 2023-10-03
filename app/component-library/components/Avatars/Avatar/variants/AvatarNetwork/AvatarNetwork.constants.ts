/* eslint-disable import/prefer-default-export */

// Third party dependencies.
import { ImageSourcePropType } from 'react-native';

// External dependencies.
import { AvatarSize } from '../../Avatar.types';

// Internal dependencies.
import { AvatarNetworkProps } from './AvatarNetwork.types';

// Defaults
export const DEFAULT_AVATARNETWORK_SIZE = AvatarSize.Md;
export const DEFAULT_AVATARNETWORK_ERROR_TEXT = '?';

// Test IDs
export const AVATARNETWORK_IMAGE_TESTID = 'network-avatar-image';

// Sample consts
const SAMPLE_AVATARNETWORK_IMAGESOURCE_REMOTE: ImageSourcePropType = {
  uri: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880',
};

/* eslint-disable-next-line */
export const SAMPLE_AVATARNETWORK_IMAGESOURCE_LOCAL: ImageSourcePropType = require('../../../../../../images/ethereum.png');

export const SAMPLE_AVATARNETWORK_PROPS: AvatarNetworkProps = {
  size: DEFAULT_AVATARNETWORK_SIZE,
  name: 'Ethereum',
  imageSource: SAMPLE_AVATARNETWORK_IMAGESOURCE_REMOTE,
};
