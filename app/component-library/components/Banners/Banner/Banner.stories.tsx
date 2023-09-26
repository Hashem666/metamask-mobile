/* eslint-disable react/display-name */
// Third party dependencies.
import React from 'react';

// External dependencies.
import { SAMPLE_BANNERALERT_PROPS } from './variants/BannerAlert/BannerAlert.constants';
import { SAMPLE_BANNERTIP_PROPS } from './variants/BannerTip/BannerTip.constants';

// Internal dependencies.
import { BannerVariant } from './Banner.types';
import { default as BannerComponent } from './Banner';

const BannerMeta = {
  title: 'Component Library / Banners',
  component: BannerComponent,
  argTypes: {
    variant: {
      options: Object.values(BannerVariant),
      mapping: Object.values(BannerVariant),
      control: {
        type: 'select',
        labels: Object.keys(BannerVariant),
      },
    },
  },
};
export default BannerMeta;

export const Banner = {
  args: {
    variant: BannerVariant.Alert,
  },
  render: (args: { variant: BannerVariant }) =>
    args.variant === BannerVariant.Alert ? (
      <BannerComponent
        variant={BannerVariant.Alert}
        {...SAMPLE_BANNERALERT_PROPS}
      />
    ) : (
      <BannerComponent
        variant={BannerVariant.Tip}
        {...SAMPLE_BANNERTIP_PROPS}
      />
    ),
};
