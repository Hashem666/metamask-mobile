/* eslint-disable @typescript-eslint/no-shadow */
import {
  AccountTrackerController,
  AccountTrackerState,
  AssetsContractController,
  CurrencyRateController,
  CurrencyRateState,
  CurrencyRateStateChange,
  GetCurrencyRateState,
  GetTokenListState,
  NftController,
  NftDetectionController,
  NftState,
  TokenBalancesController,
  TokenBalancesState,
  TokenDetectionController,
  TokenListController,
  TokenListState,
  TokenListStateChange,
  TokenRatesController,
  TokenRatesState,
  TokensController,
  TokensState,
} from '@metamask/assets-controllers';
import { AppState } from 'react-native';
import {
  AddressBookController,
  AddressBookState,
} from '@metamask/address-book-controller';
import { BaseState, ControllerMessenger } from '@metamask/base-controller';
import { ComposableController } from '@metamask/composable-controller';
import {
  KeyringController,
  SignTypedDataVersion,
  KeyringControllerState,
  KeyringControllerActions,
  KeyringControllerEvents,
} from '@metamask/keyring-controller';
import {
  NetworkController,
  NetworkControllerActions,
  NetworkControllerEvents,
  NetworkState,
  NetworkStatus,
} from '@metamask/network-controller';
import {
  PhishingController,
  PhishingState,
} from '@metamask/phishing-controller';
import {
  PreferencesController,
  PreferencesState,
} from '@metamask/preferences-controller';
import {
  TransactionController,
  TransactionState,
} from '@metamask/transaction-controller';
import {
  GasFeeController,
  GasFeeState,
  GasFeeStateChange,
  GetGasFeeState,
} from '@metamask/gas-fee-controller';
import {
  AcceptOptions,
  ApprovalController,
  ApprovalControllerActions,
  ApprovalControllerEvents,
  ApprovalControllerState,
} from '@metamask/approval-controller';
import {
  PermissionController,
  PermissionControllerActions,
  PermissionControllerEvents,
  PermissionControllerState,
} from '@metamask/permission-controller';
import SwapsController, { swapsUtils } from '@metamask/swaps-controller';
import {
  SnapController,
  SnapControllerState,
} from '@metamask/snaps-controllers';
import {
  SubjectMetadataController,
  SubjectMetadataControllerState,
} from '@metamask/subject-metadata-controller';
import { PPOMController } from '@metamask/ppom-validator';
import { MetaMaskKeyring as QRHardwareKeyring } from '@keystonehq/metamask-airgapped-keyring';
import {
  LoggingController,
  LoggingControllerState,
  LoggingControllerActions,
} from '@metamask/logging-controller';
import Encryptor from './Encryptor';
import {
  isMainnetByChainId,
  getDecimalChainId,
  fetchEstimatedMultiLayerL1Fee,
} from '../util/networks';
import AppConstants from './AppConstants';
import { store } from '../store';
import {
  renderFromTokenMinimalUnit,
  balanceToFiatNumber,
  weiToFiatNumber,
  toHexadecimal,
  addHexPrefix,
} from '../util/number';
import NotificationManager from './NotificationManager';
import Logger from '../util/Logger';
import { EndowmentPermissions } from '../constants/permissions';
import { SNAP_BLOCKLIST, checkSnapsBlockList } from '../util/snaps';
import { isZero } from '../util/lodash';
import { MetaMetricsEvents } from './Analytics';
import AnalyticsV2 from '../util/analyticsV2';
import {
  SnapBridge,
  WebviewExecutionService,
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
  detectSnapLocation,
  fetchFunction,
} from './Snaps';
import { getRpcMethodMiddleware } from './RPCMethods/RPCMethodMiddleware';
import { isBlockaidFeatureEnabled } from '../util/blockaid';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from './Permissions/specifications.js';
import { backupVault } from './BackupVault';
import {
  SignatureController,
  SignatureControllerActions,
  SignatureControllerEvents,
} from '@metamask/signature-controller';
import { hasProperty, Json } from '@metamask/utils';
// TODO: Export this type from the package directly
import { SwapsState } from '@metamask/swaps-controller/dist/SwapsController';
import { ethErrors } from 'eth-rpc-errors';

import { PPOM, ppomInit } from '../lib/ppom/PPOMView';
import RNFSStorageBackend from '../lib/ppom/rnfs-storage-backend';

const NON_EMPTY = 'NON_EMPTY';

const encryptor = new Encryptor();
let currentChainId: any;

type GlobalActions =
  | ApprovalControllerActions
  | GetCurrencyRateState
  | GetGasFeeState
  | GetTokenListState
  | NetworkControllerActions
  | PermissionControllerActions
  | SignatureControllerActions
  | KeyringControllerActions
  | LoggingControllerActions;
type GlobalEvents =
  | ApprovalControllerEvents
  | CurrencyRateStateChange
  | GasFeeStateChange
  | TokenListStateChange
  | NetworkControllerEvents
  | PermissionControllerEvents
  | SignatureControllerEvents
  | KeyringControllerEvents;

type PermissionsByRpcMethod = ReturnType<typeof getPermissionSpecifications>;
type Permissions = PermissionsByRpcMethod[keyof PermissionsByRpcMethod];

export interface EngineState {
  AccountTrackerController: AccountTrackerState;
  AddressBookController: AddressBookState;
  AssetsContractController: BaseState;
  NftController: NftState;
  TokenListController: TokenListState;
  CurrencyRateController: CurrencyRateState;
  KeyringController: KeyringControllerState;
  NetworkController: NetworkState;
  PreferencesController: PreferencesState;
  PhishingController: PhishingState;
  TokenBalancesController: TokenBalancesState;
  TokenRatesController: TokenRatesState;
  TransactionController: TransactionState;
  SwapsController: SwapsState;
  GasFeeController: GasFeeState;
  TokensController: TokensState;
  TokenDetectionController: BaseState;
  NftDetectionController: BaseState;
  SnapController: SnapControllerState;
  PermissionController: PermissionControllerState<Permissions>;
  SubjectMetadataController: SubjectMetadataControllerState;
  ApprovalController: ApprovalControllerState;
  LoggingController: LoggingControllerState;
}

/**
 * Core controller responsible for composing other metamask controllers together
 * and exposing convenience methods for common wallet operations.
 */
class Engine {
  /**
   * The global Engine singleton
   */
  static instance: Engine | null;
  /**
   * A collection of all controller instances
   */
  context:
    | {
        AccountTrackerController: AccountTrackerController;
        AddressBookController: AddressBookController;
        ApprovalController: ApprovalController;
        AssetsContractController: AssetsContractController;
        CurrencyRateController: CurrencyRateController;
        GasFeeController: GasFeeController;
        KeyringController: KeyringController;
        LoggingController: LoggingController;
        NetworkController: NetworkController;
        NftController: NftController;
        NftDetectionController: NftDetectionController;
        // TODO: Fix permission types
        PermissionController: PermissionController<any, any>;
        PhishingController: PhishingController;
        PreferencesController: PreferencesController;
        PPOMController?: PPOMController;
        TokenBalancesController: TokenBalancesController;
        TokenListController: TokenListController;
        TokenDetectionController: TokenDetectionController;
        TokenRatesController: TokenRatesController;
        TokensController: TokensController;
        TransactionController: TransactionController;
        SignatureController: SignatureController;
        SwapsController: SwapsController;
      }
    | any;
  /**
   * The global controller messenger.
   */
  controllerMessenger: ControllerMessenger<GlobalActions, GlobalEvents>;
  /**
   * ComposableController reference containing all child controllers
   */
  datamodel: any;

  /**
   * Object containing the info for the latest incoming tx block
   * for each address and network
   */
  lastIncomingTxBlockInfo: any;

  /**
   * Creates a CoreController instance
   */
  // eslint-disable-next-line @typescript-eslint/default-param-last
  constructor(
    initialState: Partial<EngineState> = {},
    initialKeyringState?: KeyringControllerState | null,
  ) {
    this.controllerMessenger = new ControllerMessenger();

    const approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
      }),
      showApprovalRequest: () => undefined,
      typesExcludedFromRateLimiting: [
        // TODO: Replace with ApprovalType enum from @metamask/controller-utils when breaking change is fixed
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'transaction',
        'wallet_watchAsset',
      ],
    });

    const preferencesController = new PreferencesController(
      {},
      {
        ipfsGateway: AppConstants.IPFS_DEFAULT_GATEWAY_URL,
        useTokenDetection:
          initialState?.PreferencesController?.useTokenDetection ?? true,
        // TODO: Use previous value when preferences UI is available
        useNftDetection: false,
        displayNftMedia: true,
      },
    );

    const networkControllerOpts = {
      infuraProjectId: process.env.MM_INFURA_PROJECT_ID || NON_EMPTY,
      state: initialState.NetworkController,
      messenger: this.controllerMessenger.getRestricted({
        name: 'NetworkController',
        allowedEvents: [],
        allowedActions: [],
      }),
      // Metrics event tracking is handled in this repository instead
      // TODO: Use events for controller metric events
      trackMetaMetricsEvent: () => {
        // noop
      },
    };
    // @ts-expect-error Error might be caused by base controller version mismatch
    const networkController = new NetworkController(networkControllerOpts);
    networkController.initializeProvider();

    const assetsContractController = new AssetsContractController({
      onPreferencesStateChange: (listener) =>
        preferencesController.subscribe(listener),
      onNetworkStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
          listener,
        ),
    });

    const nftController = new NftController(
      {
        onPreferencesStateChange: (listener) =>
          preferencesController.subscribe(listener),
        onNetworkStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            AppConstants.NETWORK_STATE_CHANGE_EVENT,
            listener,
          ),
        getERC721AssetName: assetsContractController.getERC721AssetName.bind(
          assetsContractController,
        ),
        getERC721AssetSymbol:
          assetsContractController.getERC721AssetSymbol.bind(
            assetsContractController,
          ),
        getERC721TokenURI: assetsContractController.getERC721TokenURI.bind(
          assetsContractController,
        ),
        getERC721OwnerOf: assetsContractController.getERC721OwnerOf.bind(
          assetsContractController,
        ),
        getERC1155BalanceOf: assetsContractController.getERC1155BalanceOf.bind(
          assetsContractController,
        ),
        getERC1155TokenURI: assetsContractController.getERC1155TokenURI.bind(
          assetsContractController,
        ),
      },
      {
        // @ts-expect-error NftController constructor config type is wrong
        useIPFSSubdomains: false,
        chainId: networkController.state.providerConfig.chainId,
      },
    );
    const tokensController = new TokensController({
      onPreferencesStateChange: (listener) =>
        preferencesController.subscribe(listener),
      onNetworkStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
          listener,
        ),
      config: {
        provider: networkController.getProviderAndBlockTracker().provider,
        chainId: networkController.state.providerConfig.chainId,
      },
      // @ts-expect-error Error might be caused by base controller version mismatch
      messenger: this.controllerMessenger.getRestricted({
        name: 'TokensController',
        allowedActions: [`${approvalController.name}:addRequest`],
      }),
      // @ts-expect-error This is added in a patch, but types weren't updated
      getERC20TokenName: assetsContractController.getERC20TokenName.bind(
        assetsContractController,
      ),
    });

    const tokenListController = new TokenListController({
      chainId: networkController.state.providerConfig.chainId,
      onNetworkStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
          listener,
        ),
      // @ts-expect-error Error might be caused by base controller version mismatch
      messenger: this.controllerMessenger.getRestricted({
        name: 'TokenListController',
        allowedEvents: ['NetworkController:providerConfigChange'],
      }),
    });
    const currencyRateController = new CurrencyRateController({
      // @ts-expect-error Error might be caused by base controller version mismatch
      messenger: this.controllerMessenger.getRestricted({
        name: 'CurrencyRateController',
      }),
      state: initialState.CurrencyRateController,
    });
    currencyRateController.start();

    const gasFeeController = new GasFeeController({
      // @ts-expect-error Error might be caused by base controller version mismatch
      messenger: this.controllerMessenger.getRestricted({
        name: 'GasFeeController',
      }),
      getProvider: () =>
        networkController.getProviderAndBlockTracker().provider,
      onNetworkStateChange: (listener) =>
        this.controllerMessenger.subscribe(
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
          listener,
        ),
      getCurrentNetworkEIP1559Compatibility: async () =>
        await networkController.getEIP1559Compatibility(),
      // @ts-expect-error Incompatible string types, fixed in upcoming version
      getChainId: () => networkController.state.providerConfig.chainId,
      getCurrentNetworkLegacyGasAPICompatibility: () => {
        const chainId = networkController.state.providerConfig.chainId;
        return (
          isMainnetByChainId(chainId) ||
          chainId === swapsUtils.BSC_CHAIN_ID ||
          chainId === swapsUtils.POLYGON_CHAIN_ID
        );
      },
      clientId: AppConstants.SWAPS.CLIENT_ID,
      legacyAPIEndpoint:
        'https://gas-api.metaswap.codefi.network/networks/<chain_id>/gasPrices',
      EIP1559APIEndpoint:
        'https://gas-api.metaswap.codefi.network/networks/<chain_id>/suggestedGasFees',
    });

    const phishingController = new PhishingController();
    phishingController.maybeUpdateState();

    const getIdentities = () => {
      const identities = preferencesController.state.identities;
      const lowerCasedIdentities: PreferencesState['identities'] = {};
      Object.keys(identities).forEach((key) => {
        lowerCasedIdentities[key.toLowerCase()] = identities[key];
      });
      return lowerCasedIdentities;
    };

    const qrKeyringBuilder = () => new QRHardwareKeyring();
    qrKeyringBuilder.type = QRHardwareKeyring.type;

    const keyringController = new KeyringController({
      removeIdentity: preferencesController.removeIdentity.bind(
        preferencesController,
      ),
      syncIdentities: preferencesController.syncIdentities.bind(
        preferencesController,
      ),
      updateIdentities: preferencesController.updateIdentities.bind(
        preferencesController,
      ),
      setSelectedAddress: preferencesController.setSelectedAddress.bind(
        preferencesController,
      ),
      setAccountLabel: preferencesController.setAccountLabel.bind(
        preferencesController,
      ),
      encryptor,
      messenger: this.controllerMessenger.getRestricted({
        name: 'KeyringController',
        allowedEvents: [
          'KeyringController:lock',
          'KeyringController:unlock',
          'KeyringController:stateChange',
          'KeyringController:accountRemoved',
        ],
        allowedActions: ['KeyringController:getState'],
      }),
      state: initialKeyringState || initialState.KeyringController,
      keyringBuilders: [qrKeyringBuilder],
    });

    /**
     * Gets the mnemonic of the user's primary keyring.
     */
    const getPrimaryKeyringMnemonic = async () => {
      try {
        const mnemonic = await keyringController.exportMnemonic();
        if (mnemonic) {
          return mnemonic;
        }
        throw new Error('No mnemonic found');
      } catch (error) {
        console.error(error);
      }
    };

    const getAppState = () => {
      const state = AppState.currentState;
      return state === 'active';
    };

    const getAppKeyForSubject = async (subject, requestedAccount) => {
      let account;

      if (requestedAccount) {
        account = requestedAccount;
      } else {
        [account] = await keyringController.getAccounts();
      }
      const appKey = await keyringController.exportAppKeyForAddress(
        account,
        subject,
      );
      return appKey;
    };

    const getSnapPermissionSpecifications = () => ({
      ...buildSnapEndowmentSpecifications(),
      ...buildSnapRestrictedMethodSpecifications({
        clearSnapState: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:clearSnapState',
        ),
        getMnemonic: getPrimaryKeyringMnemonic.bind(this),
        getUnlockPromise: getAppState.bind(this),
        getSnap: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:get',
        ),
        handleSnapRpcRequest: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:handleRequest',
        ),
        getSnapState: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:getSnapState',
        ),
        updateSnapState: this.controllerMessenger.call.bind(
          this.controllerMessenger,
          'SnapController:updateSnapState',
        ),
        showConfirmation: (origin, confirmationData) =>
          approvalController.addAndShowApprovalRequest({
            origin,
            type: 'snapConfirmation',
            requestData: confirmationData,
          }),
        showDialog: (origin, type, content, placeholder) =>
          approvalController.addAndShowApprovalRequest({
            origin,
            type,
            requestData: { content, placeholder },
          }),
        showInAppNotification: (origin, args) => {
          // eslint-disable-next-line no-console
          console.log(
            'Snaps/ showInAppNotification called with args: ',
            args,
            ' and origin: ',
            origin,
          );
        },
      }),
    });

    const permissionController = new PermissionController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'PermissionController',
        allowedActions: [
          `${approvalController.name}:addRequest`,
          `${approvalController.name}:hasRequest`,
          `${approvalController.name}:acceptRequest`,
          `${approvalController.name}:rejectRequest`,
        ],
      }),
      state: initialState.PermissionController,
      caveatSpecifications: getCaveatSpecifications({ getIdentities }),
      // @ts-expect-error Inferred permission specification type is incorrect, fix after migrating to TypeScript
      permissionSpecifications: {
        ...getPermissionSpecifications({
          getAllAccounts: () => keyringController.getAccounts(),
        }),
        ...getSnapPermissionSpecifications(),
      },
      unrestrictedMethods,
    });

    const subjectMetadataController = new SubjectMetadataController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'SubjectMetadataController',
        allowedActions: [`${permissionController.name}:hasPermissions`],
      }),
      state: initialState.SubjectMetadataController || {},
      subjectCacheLimit: 100,
    });

    this.setupSnapProvider = (snapId, connectionStream) => {
      // eslint-disable-next-line no-console
      console.log(
        '[ENGINE LOG] Engine+setupSnapProvider: Setup stream for Snap',
        snapId,
      );
      // TO DO:
      // Develop a simpler getRpcMethodMiddleware object for SnapBridge
      // Consider developing an abstract class to derived custom implementations for each use case
      const bridge = new SnapBridge({
        snapId,
        connectionStream,
        getRPCMethodMiddleware: ({ hostname, getProviderState }) =>
          getRpcMethodMiddleware({
            hostname,
            getProviderState,
            navigation: null,
            getApprovedHosts: () => null,
            setApprovedHosts: () => null,
            approveHost: () => null,
            // Mock URL
            url: 'https://www.google.com',
            title: 'Snap',
            icon: null,
            isHomepage: false,
            fromHomepage: false,
            toggleUrlModal: () => null,
            wizardScrollAdjusted: () => null,
            tabId: false,
            isWalletConnect: true,
          }),
      });

      bridge.setupProviderConnection();
    };

    this.snapExecutionService = new WebviewExecutionService({
      // iframeUrl: new URL(
      //   'https://metamask.github.io/iframe-execution-environment/0.11.0',
      // ),
      messenger: this.controllerMessenger.getRestricted({
        name: 'ExecutionService',
      }),
      setupSnapProvider: this.setupSnapProvider.bind(this),
    });

    const snapControllerMessenger = this.controllerMessenger.getRestricted({
      name: 'SnapController',
      allowedEvents: [
        'ExecutionService:unhandledError',
        'ExecutionService:outboundRequest',
        'ExecutionService:outboundResponse',
      ],
      allowedActions: [
        `${approvalController.name}:addRequest`,
        `${permissionController.name}:getEndowments`,
        `${permissionController.name}:getPermissions`,
        `${permissionController.name}:hasPermission`,
        `${permissionController.name}:hasPermissions`,
        `${permissionController.name}:requestPermissions`,
        `${permissionController.name}:revokeAllPermissions`,
        `${permissionController.name}:revokePermissions`,
        `${permissionController.name}:revokePermissionForAllSubjects`,
        `${permissionController.name}:grantPermissions`,
        `${subjectMetadataController.name}:getSubjectMetadata`,
        'ExecutionService:executeSnap',
        'ExecutionService:getRpcRequestHandler',
        'ExecutionService:terminateSnap',
        'ExecutionService:terminateAllSnaps',
        'ExecutionService:handleRpcRequest',
      ],
    });

    const snapController = new SnapController({
      environmentEndowmentPermissions: Object.values(EndowmentPermissions),
      featureFlags: { dappsCanUpdateSnaps: true },
      // TO DO
      getAppKey: async (subject, appKeyType) =>
        getAppKeyForSubject(`${appKeyType}:${subject}`),
      checkBlockList: async (snapsToCheck) =>
        checkSnapsBlockList(snapsToCheck, SNAP_BLOCKLIST),
      state: initialState.snapController || {},
      messenger: snapControllerMessenger,
      // TO DO
      closeAllConnections: () =>
        // eslint-disable-next-line no-console
        console.log(
          'TO DO: Create method to close all connections (Closes all connections for the given origin, and removes the references)',
        ),
      detectSnapLocation: (location, options) =>
        detectSnapLocation(location, { ...options, fetch: fetchFunction }),
    });

    const controllers = [
      keyringController,
      new AccountTrackerController({
        onPreferencesStateChange: (listener) =>
          preferencesController.subscribe(listener),
        getIdentities: () => preferencesController.state.identities,
        // @ts-expect-error This is added in a patch, but types weren't updated
        getSelectedAddress: () => preferencesController.state.selectedAddress,
        getMultiAccountBalancesEnabled: () =>
          preferencesController.state.isMultiAccountBalancesEnabled,
      }),
      new AddressBookController(),
      assetsContractController,
      nftController,
      tokensController,
      tokenListController,
      new TokenDetectionController({
        onPreferencesStateChange: (listener) =>
          preferencesController.subscribe(listener),
        onNetworkStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            AppConstants.NETWORK_STATE_CHANGE_EVENT,
            listener,
          ),
        onTokenListStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            `${tokenListController.name}:stateChange`,
            listener,
          ),
        addDetectedTokens: async (tokens) => {
          // Track detected tokens event
          AnalyticsV2.trackEvent(MetaMetricsEvents.TOKEN_DETECTED, {
            token_standard: 'ERC20',
            asset_type: 'token',
            chain_id: getDecimalChainId(
              networkController.state.providerConfig.chainId,
            ),
          });
          tokensController.addDetectedTokens(tokens);
        },
        // @ts-expect-error This is added in a patch, but types weren't updated
        updateTokensName: (tokenList) =>
          // @ts-expect-error This is added in a patch, but types weren't updated
          tokensController.updateTokensName(tokenList),
        getTokensState: () => tokensController.state,
        getTokenListState: () => tokenListController.state,
        getNetworkState: () => networkController.state,
        getPreferencesState: () => preferencesController.state,
        getBalancesInSingleCall:
          assetsContractController.getBalancesInSingleCall.bind(
            assetsContractController,
          ),
      }),
      new NftDetectionController({
        onNftsStateChange: (listener) => nftController.subscribe(listener),
        onPreferencesStateChange: (listener) =>
          preferencesController.subscribe(listener),
        onNetworkStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            AppConstants.NETWORK_STATE_CHANGE_EVENT,
            listener,
          ),
        getOpenSeaApiKey: () => nftController.openSeaApiKey,
        addNft: nftController.addNft.bind(nftController),
        getNftState: () => nftController.state,
      }),
      currencyRateController,
      networkController,
      phishingController,
      preferencesController,
      new TokenBalancesController(
        {
          onTokensStateChange: (listener) =>
            tokensController.subscribe(listener),
          getSelectedAddress: () => preferencesController.state.selectedAddress,
          getERC20BalanceOf: assetsContractController.getERC20BalanceOf.bind(
            assetsContractController,
          ),
        },
        { interval: 10000 },
      ),
      new TokenRatesController(
        {
          onTokensStateChange: (listener) =>
            tokensController.subscribe(listener),
          onCurrencyRateStateChange: (listener) =>
            this.controllerMessenger.subscribe(
              `${currencyRateController.name}:stateChange`,
              listener,
            ),
          onNetworkStateChange: (listener) =>
            this.controllerMessenger.subscribe(
              AppConstants.NETWORK_STATE_CHANGE_EVENT,
              listener,
            ),
        },
        {
          chainId: networkController.state.providerConfig.chainId,
        },
      ),
      new TransactionController({
        blockTracker:
          networkController.getProviderAndBlockTracker().blockTracker,
        getNetworkState: () => networkController.state,
        getSelectedAddress: () => preferencesController.state.selectedAddress,
        incomingTransactions: {
          apiKey: process.env.MM_ETHERSCAN_KEY,
          isEnabled: () => {
            const currentHexChainId = addHexPrefix(
              toHexadecimal(networkController.state.providerConfig.chainId),
            );

            return Boolean(
              preferencesController?.state?.showIncomingTransactions?.[
                currentHexChainId
              ],
            );
          },
          updateTransactions: true,
        },
        // @ts-expect-error Error might be caused by base controller version mismatch
        messenger: this.controllerMessenger.getRestricted({
          name: 'TransactionController',
          allowedActions: [`${approvalController.name}:addRequest`],
        }),
        onNetworkStateChange: (listener) =>
          this.controllerMessenger.subscribe(
            AppConstants.NETWORK_STATE_CHANGE_EVENT,
            listener,
          ),
        provider: networkController.getProviderAndBlockTracker().provider,
      }),
      new SwapsController(
        {
          // @ts-expect-error TODO: Resolve mismatch between gas fee and swaps controller types
          fetchGasFeeEstimates: () => gasFeeController.fetchGasFeeEstimates(),
          // @ts-expect-error TODO: Resolve mismatch between gas fee and swaps controller types
          fetchEstimatedMultiLayerL1Fee,
        },
        {
          clientId: AppConstants.SWAPS.CLIENT_ID,
          fetchAggregatorMetadataThreshold:
            AppConstants.SWAPS.CACHE_AGGREGATOR_METADATA_THRESHOLD,
          fetchTokensThreshold: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
          fetchTopAssetsThreshold:
            AppConstants.SWAPS.CACHE_TOP_ASSETS_THRESHOLD,
          supportedChainIds: [
            swapsUtils.ETH_CHAIN_ID,
            swapsUtils.BSC_CHAIN_ID,
            swapsUtils.SWAPS_TESTNET_CHAIN_ID,
            swapsUtils.POLYGON_CHAIN_ID,
            swapsUtils.AVALANCHE_CHAIN_ID,
            swapsUtils.ARBITRUM_CHAIN_ID,
            swapsUtils.OPTIMISM_CHAIN_ID,
            swapsUtils.ZKSYNC_ERA_CHAIN_ID,
            swapsUtils.LINEA_CHAIN_ID,
          ],
        },
      ),
      gasFeeController,
      approvalController,
      permissionController,
      new SignatureController({
        messenger: this.controllerMessenger.getRestricted({
          name: 'SignatureController',
          allowedActions: [`${approvalController.name}:addRequest`],
        }),
        isEthSignEnabled: () =>
          Boolean(
            preferencesController.state?.disabledRpcMethodPreferences?.eth_sign,
          ),
        getAllState: () => store.getState(),
        getCurrentChainId: () =>
          toHexadecimal(networkController.state.providerConfig.chainId),
        keyringController: {
          signMessage: keyringController.signMessage.bind(keyringController),
          signPersonalMessage:
            keyringController.signPersonalMessage.bind(keyringController),
          signTypedMessage: (msgParams, { version }) =>
            keyringController.signTypedMessage(
              msgParams,
              version as SignTypedDataVersion,
            ),
        },
      }),
      new LoggingController({
        messenger: this.controllerMessenger.getRestricted({
          name: 'LoggingController',
        }),
        state: initialState.LoggingController,
      }),
      snapController,
      subjectMetadataController,
    ];

    if (isBlockaidFeatureEnabled()) {
      try {
        const ppomController = new PPOMController({
          chainId: addHexPrefix(networkController.state.providerConfig.chainId),
          blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
          cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
          messenger: this.controllerMessenger.getRestricted({
            name: 'PPOMController',
          }),
          onNetworkChange: (listener) =>
            this.controllerMessenger.subscribe(
              AppConstants.NETWORK_STATE_CHANGE_EVENT,
              listener,
            ),
          onPreferencesChange: (listener) =>
            preferencesController.subscribe(listener),
          provider: networkController.getProviderAndBlockTracker().provider,
          ppomProvider: {
            PPOM,
            ppomInit,
          },
          storageBackend: new RNFSStorageBackend('PPOMDB'),
          securityAlertsEnabled: true,
        });
        controllers.push(ppomController as any);
      } catch (e) {
        Logger.log(`Error initializing PPOMController: ${e}`);
        return;
      }
    }

    // set initial state
    // TODO: Pass initial state into each controller constructor instead
    // This is being set post-construction for now to ensure it's functionally equivalent with
    // how the `ComponsedController` used to set initial state.
    //
    // The check for `controller.subscribe !== undefined` is to filter out BaseControllerV2
    // controllers. They should be initialized via the constructor instead.
    for (const controller of controllers) {
      if (
        hasProperty(initialState, controller.name) &&
        controller.subscribe !== undefined
      ) {
        // The following type error can be addressed by passing initial state into controller constructors instead
        // @ts-expect-error No type-level guarantee that the correct state is being applied to the correct controller here.
        controller.update(initialState[controller.name]);
      }
    }

    this.datamodel = new ComposableController(
      // @ts-expect-error The ComposableController needs to be updated to support BaseControllerV2
      controllers,
      this.controllerMessenger,
    );
    this.context = controllers.reduce<Partial<typeof this.context>>(
      (context, controller) => ({
        ...context,
        [controller.name]: controller,
      }),
      {},
    ) as typeof this.context;

    const {
      NftController: nfts,
      KeyringController: keyring,
      TransactionController: transaction,
    } = this.context;

    if (process.env.MM_OPENSEA_KEY) {
      nfts.setApiKey(process.env.MM_OPENSEA_KEY);
    }

    transaction.configure({ sign: keyring.signTransaction.bind(keyring) });

    transaction.hub.on('incomingTransactionBlock', (blockNumber: number) => {
      NotificationManager.gotIncomingTransaction(blockNumber);
    });

    this.controllerMessenger.subscribe(
      AppConstants.NETWORK_STATE_CHANGE_EVENT,
      (state: NetworkState) => {
        if (
          state.networkStatus === NetworkStatus.Available &&
          state.providerConfig.chainId !== currentChainId
        ) {
          // We should add a state or event emitter saying the provider changed
          setTimeout(() => {
            this.configureControllersOnNetworkChange();
            currentChainId = state.providerConfig.chainId;
          }, 500);
        }
      },
    );

    this.configureControllersOnNetworkChange();
    this.startPolling();
    this.handleVaultBackup();

    Engine.instance = this;
  }

  handleVaultBackup() {
    this.controllerMessenger.subscribe(
      AppConstants.KEYRING_STATE_CHANGE_EVENT,
      (state: KeyringControllerState) =>
        backupVault(state)
          .then((result) => {
            if (result.success) {
              Logger.log('Engine', 'Vault back up successful');
            } else {
              Logger.log('Engine', 'Vault backup failed', result.error);
            }
          })
          .catch((error) => {
            Logger.error(error, 'Engine Vault backup failed');
          }),
    );
  }

  startPolling() {
    const {
      NftDetectionController,
      TokenDetectionController,
      TokenListController,
      TransactionController,
    } = this.context;

    TokenListController.start();
    NftDetectionController.start();
    TokenDetectionController.start();
    TransactionController.startIncomingTransactionPolling();
  }

  configureControllersOnNetworkChange() {
    const {
      AccountTrackerController,
      AssetsContractController,
      TokenDetectionController,
      NftDetectionController,
      NetworkController,
      TransactionController,
      SwapsController,
    } = this.context;
    const { provider } = NetworkController.getProviderAndBlockTracker();

    provider.sendAsync = provider.sendAsync.bind(provider);
    AccountTrackerController.configure({ provider });
    AssetsContractController.configure({ provider });

    SwapsController.configure({
      provider,
      chainId: NetworkController.state?.providerConfig?.chainId,
      pollCountLimit: AppConstants.SWAPS.POLL_COUNT_LIMIT,
    });
    TransactionController.hub.emit('networkChange');
    TokenDetectionController.detectTokens();
    NftDetectionController.detectNfts();
    AccountTrackerController.refresh();
  }

  getTotalFiatAccountBalance = () => {
    const {
      CurrencyRateController,
      PreferencesController,
      AccountTrackerController,
      TokenBalancesController,
      TokenRatesController,
      TokensController,
    } = this.context;
    const { selectedAddress } = PreferencesController.state;
    const { currentCurrency } = CurrencyRateController.state;
    const conversionRate =
      CurrencyRateController.state.conversionRate === null
        ? 0
        : CurrencyRateController.state.conversionRate;
    const { accounts } = AccountTrackerController.state;
    const { tokens } = TokensController.state;
    let ethFiat = 0;
    let tokenFiat = 0;
    const decimalsToShow = (currentCurrency === 'usd' && 2) || undefined;
    if (accounts[selectedAddress]) {
      ethFiat = weiToFiatNumber(
        accounts[selectedAddress].balance,
        conversionRate,
        decimalsToShow,
      );
    }
    if (tokens.length > 0) {
      const { contractBalances: tokenBalances } = TokenBalancesController.state;
      const { contractExchangeRates: tokenExchangeRates } =
        TokenRatesController.state;
      tokens.forEach(
        (item: { address: string; balance?: string; decimals: number }) => {
          const exchangeRate =
            item.address in tokenExchangeRates
              ? tokenExchangeRates[item.address]
              : undefined;
          const tokenBalance =
            item.balance ||
            (item.address in tokenBalances
              ? renderFromTokenMinimalUnit(
                  tokenBalances[item.address],
                  item.decimals,
                )
              : undefined);
          const tokenBalanceFiat = balanceToFiatNumber(
            // TODO: Fix this by handling or eliminating the undefined case
            // @ts-expect-error This variable can be `undefined`, which would break here.
            tokenBalance,
            conversionRate,
            exchangeRate,
            decimalsToShow,
          );
          tokenFiat += tokenBalanceFiat;
        },
      );
    }

    const total = ethFiat + tokenFiat;
    return total;
  };

  /**
   * Returns true or false whether the user has funds or not
   */
  hasFunds = () => {
    try {
      const {
        engine: { backgroundState },
      } = store.getState();
      // TODO: Check `allNfts[currentChainId]` property instead
      // @ts-expect-error This property does not exist
      const nfts = backgroundState.NftController.nfts;
      const tokens = backgroundState.TokensController.tokens;
      const tokenBalances =
        backgroundState.TokenBalancesController.contractBalances;

      let tokenFound = false;
      tokens.forEach((token: { address: string | number }) => {
        if (
          tokenBalances[token.address] &&
          !isZero(tokenBalances[token.address])
        ) {
          tokenFound = true;
        }
      });

      const fiatBalance = this.getTotalFiatAccountBalance() || 0;

      return fiatBalance > 0 || tokenFound || nfts.length > 0;
    } catch (e) {
      Logger.log('Error while getting user funds', e);
    }
  };

  resetState = async () => {
    // Whenever we are gonna start a new wallet
    // either imported or created, we need to
    // get rid of the old data from state
    const {
      TransactionController,
      TokensController,
      NftController,
      TokenBalancesController,
      TokenRatesController,
      PermissionController,
      LoggingController,
    } = this.context;

    // Remove all permissions.
    PermissionController?.clearState?.();

    //Clear assets info
    TokensController.update({
      allTokens: {},
      ignoredTokens: [],
      tokens: [],
    });
    NftController.update({
      allNftContracts: {},
      allNfts: {},
      ignoredNfts: [],
    });

    TokensController.update({
      allTokens: {},
      allIgnoredTokens: {},
      ignoredTokens: [],
      tokens: [],
    });

    TokenBalancesController.update({ contractBalances: {} });
    TokenRatesController.update({ contractExchangeRates: {} });

    TransactionController.update({
      methodData: {},
      transactions: [],
      lastFetchedBlockNumbers: {},
    });

    LoggingController.clear();
  };

  removeAllListeners() {
    this.controllerMessenger.clearSubscriptions();
  }

  async destroyEngineInstance() {
    this.removeAllListeners();
    await this.resetState();
    Engine.instance = null;
  }

  rejectPendingApproval(
    id: string,
    reason: Error = ethErrors.provider.userRejectedRequest(),
    opts: { ignoreMissing?: boolean; logErrors?: boolean } = {},
  ) {
    const { ApprovalController } = this.context;

    if (opts.ignoreMissing && !ApprovalController.has({ id })) {
      return;
    }

    try {
      ApprovalController.reject(id, reason);
    } catch (error: any) {
      if (opts.logErrors !== false) {
        Logger.error(
          error,
          'Reject while rejecting pending connection request',
        );
      }
    }
  }

  async acceptPendingApproval(
    id: string,
    requestData?: Record<string, Json>,
    opts: AcceptOptions & { handleErrors?: boolean } = {
      waitForResult: false,
      deleteAfterResult: false,
      handleErrors: true,
    },
  ) {
    const { ApprovalController } = this.context;

    try {
      return await ApprovalController.accept(id, requestData, {
        waitForResult: opts.waitForResult,
        deleteAfterResult: opts.deleteAfterResult,
      });
    } catch (err) {
      if (opts.handleErrors === false) {
        throw err;
      }
    }
  }
}

/**
 * Assert that the given Engine instance has been initialized
 *
 * @param instance - Either an Engine instance, or null
 */
function assertEngineExists(
  instance: Engine | null,
): asserts instance is Engine {
  if (!instance) {
    throw new Error('Engine does not exist');
  }
}

let instance: Engine | null;

export default {
  get context() {
    assertEngineExists(instance);
    return instance.context;
  },
  get controllerMessenger() {
    assertEngineExists(instance);
    return instance.controllerMessenger;
  },
  get state() {
    assertEngineExists(instance);
    const {
      AccountTrackerController,
      AddressBookController,
      AssetsContractController,
      NftController,
      TokenListController,
      CurrencyRateController,
      KeyringController,
      NetworkController,
      PreferencesController,
      PhishingController,
      PPOMController,
      TokenBalancesController,
      TokenRatesController,
      TransactionController,
      SwapsController,
      GasFeeController,
      TokensController,
      TokenDetectionController,
      NftDetectionController,
      SnapController,
      PermissionController,
      SubjectMetadataController,
      ApprovalController,
      LoggingController,
    } = instance.datamodel.state;

    // normalize `null` currencyRate to `0`
    // TODO: handle `null` currencyRate by hiding fiat values instead
    const modifiedCurrencyRateControllerState = {
      ...CurrencyRateController,
      conversionRate:
        CurrencyRateController.conversionRate === null
          ? 0
          : CurrencyRateController.conversionRate,
    };

    return {
      AccountTrackerController,
      AddressBookController,
      AssetsContractController,
      NftController,
      TokenListController,
      CurrencyRateController: modifiedCurrencyRateControllerState,
      KeyringController,
      NetworkController,
      PhishingController,
      PPOMController,
      PreferencesController,
      TokenBalancesController,
      TokenRatesController,
      TokensController,
      TransactionController,
      SwapsController,
      GasFeeController,
      TokenDetectionController,
      NftDetectionController,
      SnapController,
      PermissionController,
      SubjectMetadataController,
      ApprovalController,
      LoggingController,
    };
  },
  get datamodel() {
    assertEngineExists(instance);
    return instance.datamodel;
  },
  getTotalFiatAccountBalance() {
    assertEngineExists(instance);
    return instance.getTotalFiatAccountBalance();
  },
  hasFunds() {
    assertEngineExists(instance);
    return instance.hasFunds();
  },
  resetState() {
    assertEngineExists(instance);
    return instance.resetState();
  },
  destroyEngine() {
    instance?.destroyEngineInstance();
    instance = null;
  },
  init(state: Record<string, never> | undefined, keyringState = null) {
    instance = Engine.instance || new Engine(state, keyringState);
    Object.freeze(instance);
    return instance;
  },
  acceptPendingApproval: async (
    id: string,
    requestData?: Record<string, Json>,
    opts?: AcceptOptions & { handleErrors?: boolean },
  ) => instance?.acceptPendingApproval(id, requestData, opts),
  rejectPendingApproval: (
    id: string,
    reason: Error,
    opts: {
      ignoreMissing?: boolean;
      logErrors?: boolean;
    } = {},
  ) => instance?.rejectPendingApproval(id, reason, opts),
};
