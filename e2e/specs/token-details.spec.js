'use strict';

import { importWalletWithRecoveryPhrase, switchToTenderlyNetwork} from '../viewHelper';
import { Regression } from '../tags';
import WalletView from '../pages/WalletView';
import TokenOverview from '../pages/TokenOverview';
import NetworkListModal from '../pages/modals/NetworkListModal';
import NetworkEducationModal from '../pages/modals/NetworkEducationModal';
import NetworkApprovalModal from '../pages/modals/NetworkApprovalModal';
import NetworkAddedModal from '../pages/modals/NetworkAddedModal';
import NetworkView from '../pages/Drawer/Settings/NetworksView';
import TestHelpers from '../helpers';
import SwapView from '../pages/SwapView'

const MAINNET = 'Ethereum Main Network'
const TEST_NETWORK = 'Goerli Test Network'

describe(Regression('Token Chart Tests'), () => {
  beforeAll(async () => {
    jest.setTimeout(150000);
    await importWalletWithRecoveryPhrase();
  });

  it('should not display the chart when using Goerli test network', async () => {
    await WalletView.tapNetworksButtonOnNavBar();
    await NetworkListModal.isVisible();
    await NetworkListModal.tapTestNetworkSwitch()
    await NetworkListModal.changeNetwork(TEST_NETWORK)
    await NetworkEducationModal.isVisible();
    await NetworkEducationModal.isNetworkNameCorrect(TEST_NETWORK);
    await NetworkEducationModal.tapGotItButton();
    await NetworkEducationModal.isNotVisible();
    await WalletView.tapOnToken("GoerliETH");
    await TokenOverview.isVisible()
    await TokenOverview.checkChartNotVisible()
    await TokenOverview.tapBackButton()
  });

  it.each`
      networkName                     | symbol          | swapTo      | swapToName
      ${'Ethereum Main Network'}      | ${'Ethereum'}   | ${'BTCP'}   | ${'Bitcoin Pro'}
      ${'Avalanche Mainnet C-Chain'}  | ${'AVAX'}       | ${'USDT'}   | ${'TetherToken'}
      ${'Arbitrum One'}               | ${'Ethereum'}   | ${'DAI'}    | ${'Dai Stablecoin'}
      ${'BNB Smart Chain'}            | ${'BNB'}        | ${'MATIC'}  | ${'Matic Token'}
      ${'Optimism'}                   | ${'Ethereum'}   | ${'UNI'}    | ${'Uniswap'}
      ${'Polygon Mainnet'}            | ${'MATIC'}      | ${'WETH'}   | ${'Wrapped Ether'}
  `("should view the '$symbol' chart on '$networkName' and get a swap quote", async ({ networkName, symbol, swapTo, swapToName}) => {

    if (networkName !== MAINNET)
      await swichtToPopularNetwork(networkName)
    else {
      await WalletView.tapNetworksButtonOnNavBar();
      await NetworkListModal.isVisible();
      await NetworkListModal.changeNetwork(MAINNET)
      await NetworkEducationModal.isVisible();
      await NetworkEducationModal.isNetworkNameCorrect(MAINNET);
      await NetworkEducationModal.tapGotItButton();
    }

    await WalletView.tapOnToken(symbol);
    await TokenOverview.isVisible()
    await TokenOverview.checkIfChartIsVisible()
    await TokenOverview.scrollOnScreen()
    await TokenOverview.checkIfReceiveButtonVisible()
    await TokenOverview.checkIfBuyButtonVisible()
    await TokenOverview.checkIfSendButtonVisible()
    await TokenOverview.checkIfSwapButtonVisible()
    await TokenOverview.tapSwapButton()
    await SwapView.getQuote('1', null, null, swapTo, swapToName);
    await TestHelpers.tapByText('Cancel')
    await device.enableSynchronization()
    await TokenOverview.isVisible()
    await TokenOverview.tapBackButton()
  });
})

const  swichtToPopularNetwork = async (networkName) => {
  await WalletView.tapNetworksButtonOnNavBar();
  await NetworkListModal.isVisible();
  await NetworkListModal.tapAddNetworkButton();
  await NetworkView.isRpcViewVisible()
  await NetworkView.tapPopularNetworkByName(networkName);

  await NetworkApprovalModal.isVisible();
  await NetworkApprovalModal.isDisplayNameVisible(networkName);
  await NetworkApprovalModal.tapApproveButton();
  await TestHelpers.delay(1000);

  await NetworkAddedModal.isVisible();
  await NetworkAddedModal.tapSwitchToNetwork();

  await WalletView.isVisible();
  await WalletView.isNetworkNameVisible(networkName);

  await NetworkEducationModal.isVisible();
  await NetworkEducationModal.isNetworkNameCorrect(networkName);
  await NetworkEducationModal.tapGotItButton();
  await NetworkEducationModal.isNotVisible();
  await WalletView.isVisible();
  await WalletView.isConnectedNetwork(networkName);
};

