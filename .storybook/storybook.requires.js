/* do not change this file, it is auto generated by storybook. */

import {
  configure,
  addDecorator,
  addParameters,
  addArgsEnhancer,
  clearDecorators,
} from "@storybook/react-native";

global.STORIES = [
  {
    titlePrefix: "",
    directory: "./app/component-library/components/Cards/Card",
    files: "**/*.stories.?(ts|tsx|js|jsx)",
    importPathMatcher:
      "^\\.[\\\\/](?:app\\/component-library\\/components\\/Cards\\/Card(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.stories\\.(?:ts|tsx|js|jsx)?)$",
  },
  {
    titlePrefix: "",
    directory:
      "./app/component-library/components/Banners/Banner/variants/BannerAlert",
    files: "**/*.stories.?(ts|tsx|js|jsx)",
    importPathMatcher:
      "^\\.[\\\\/](?:app\\/component-library\\/components\\/Banners\\/Banner\\/variants\\/BannerAlert(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.stories\\.(?:ts|tsx|js|jsx)?)$",
  },
  {
    titlePrefix: "",
    directory: "./app/component-library/components/Modals",
    files: "**/*.stories.?(ts|tsx|js|jsx)",
    importPathMatcher:
      "^\\.[\\\\/](?:app\\/component-library\\/components\\/Modals(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.stories\\.(?:ts|tsx|js|jsx)?)$",
  },
];

import "@storybook/addon-ondevice-controls/register";

import { decorators, parameters } from "./preview";

if (decorators) {
  if (__DEV__) {
    // stops the warning from showing on every HMR
    require("react-native").LogBox.ignoreLogs([
      "`clearDecorators` is deprecated and will be removed in Storybook 7.0",
    ]);
  }
  // workaround for global decorators getting infinitely applied on HMR, see https://github.com/storybookjs/react-native/issues/185
  clearDecorators();
  decorators.forEach((decorator) => addDecorator(decorator));
}

if (parameters) {
  addParameters(parameters);
}

const getStories = () => {
  return {
    "./app/component-library/components/Cards/Card/Card.stories.tsx": require("../app/component-library/components/Cards/Card/Card.stories.tsx"),
    "./app/component-library/components/Banners/Banner/variants/BannerAlert/BannerAlert.stories.tsx": require("../app/component-library/components/Banners/Banner/variants/BannerAlert/BannerAlert.stories.tsx"),
    "./app/component-library/components/Modals/ModalConfirmation/ModalConfirmation.stories.tsx": require("../app/component-library/components/Modals/ModalConfirmation/ModalConfirmation.stories.tsx"),
    "./app/component-library/components/Modals/ModalMandatory/ModalMandatory.stories.tsx": require("../app/component-library/components/Modals/ModalMandatory/ModalMandatory.stories.tsx"),
  };
};

configure(getStories, module, false);
