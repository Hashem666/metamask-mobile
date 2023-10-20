import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { SellOrder } from '@consensys/on-ramp-sdk/dist/API';
import { FiatOrder } from '../../../../../../reducers/fiatOrders';
import Routes from '../../../../../../constants/navigation/Routes';
import { renderScreen } from '../../../../../../util/test/renderWithProvider';
import initialBackgroundState from '../../../../../../util/test/initial-background-state.json';

import SendTransaction from './SendTransaction';
import Engine from '../../../../../../core/Engine';

type DeepPartial<BaseType> = {
  [key in keyof BaseType]?: DeepPartial<BaseType[key]>;
};

const mockOrder = {
  id: 'test-id-1',
  provider: 'AGGREGATOR',
  createdAt: 1673886669608,
  amount: 0,
  fee: 9,
  cryptoAmount: '0.012361263',
  cryptoFee: 9,
  currency: 'USD',
  currencySymbol: '$',
  cryptocurrency: 'ETH',
  state: 'CREATED',
  account: '0x1234',
  network: '1',
  excludeFromPurchases: false,
  orderType: 'SELL',
  errorCount: 0,
  lastTimeFetched: 1673886669600,
  data: {
    id: 'test-id-1',
    providerOrderId: 'test-id-1',
    canBeUpdated: false,
    idHasExpired: false,
    success: false,
    isOnlyLink: false,
    paymentMethod: {
      id: '/payments/instant-bank-transfer',
      paymentType: 'bank-transfer',
      name: 'Instant Bank Transfer',
      score: 5,
      icons: [
        {
          type: 'materialCommunityIcons',
          name: 'bank',
        },
      ],
      logo: {
        light: [
          'https://on-ramp.metafi-dev.codefi.network/assets/ACHBankTransfer-regular@3x.png',
        ],
        dark: [
          'https://on-ramp.metafi-dev.codefi.network/assets/ACHBankTransfer@3x.png',
        ],
      },
      delay: [0, 0],
      amountTier: [3, 3],
      supportedCurrency: ['/currencies/fiat/usd'],
      translation: 'ACH',
    },
    provider: {
      id: '/providers/test-staging',
      name: 'Test (Staging)',
      description: 'Per Test: test provider',
      hqAddress: '1234 Test St, Test, TS 12345',
      links: [
        {
          name: 'Homepage',
          url: 'https://test.provider/',
        },
        {
          name: 'Terms of service',
          url: 'https://test.provider/terms',
        },
      ],
      logos: {
        light:
          'https://on-ramp.dev-api.cx.metamask.io/assets/providers/test_light.png',
        dark: 'https://on-ramp.dev-api.cx.metamask.io/assets/providers/test_dark.png',
        height: 24,
        width: 65,
      },
    },
    createdAt: 1673886669608,
    fiatAmount: 0,
    totalFeesFiat: 9,
    cryptoAmount: '0.012361263',
    cryptoCurrency: {
      id: '/currencies/crypto/1/eth',
      idv2: '/currencies/crypto/1/0x0000000000000000000000000000000000000000',
      network: {
        active: true,
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        shortName: 'Ethereum',
      },
      logo: 'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
    },
    fiatCurrency: {
      symbol: 'USD',
      denomSymbol: '$',
      decimals: 2,
    },
    network: '1',
    status: 'CREATED',
    orderType: 'SELL',
    walletAddress: '0x1234',
    txHash: undefined,
    excludeFromPurchases: false,
    depositWallet: '0x34256',
  } as DeepPartial<SellOrder>,
} as FiatOrder;

const mockOrder2 = {
  id: 'test-id-2',
  provider: 'AGGREGATOR',
  createdAt: 1673886669608,
  amount: 0,
  fee: 9,
  cryptoAmount: '0.0123456',
  cryptoFee: 9,
  currency: 'USD',
  currencySymbol: '$',
  cryptocurrency: 'USDC',
  state: 'CREATED',
  account: '0x1234',
  network: '1',
  excludeFromPurchases: false,
  orderType: 'SELL',
  errorCount: 0,
  lastTimeFetched: 1673886669600,
  data: {
    id: 'test-id-2',
    providerOrderId: 'test-id-2',
    canBeUpdated: false,
    idHasExpired: false,
    success: false,
    isOnlyLink: false,
    paymentMethod: {
      id: '/payments/instant-bank-transfer',
      paymentType: 'bank-transfer',
      name: 'Instant Bank Transfer',
      score: 5,
      icons: [
        {
          type: 'materialCommunityIcons',
          name: 'bank',
        },
      ],
      logo: {
        light: [
          'https://on-ramp.metafi-dev.codefi.network/assets/ACHBankTransfer-regular@3x.png',
        ],
        dark: [
          'https://on-ramp.metafi-dev.codefi.network/assets/ACHBankTransfer@3x.png',
        ],
      },
      delay: [0, 0],
      amountTier: [3, 3],
      supportedCurrency: ['/currencies/fiat/usd'],
      translation: 'ACH',
    },
    provider: {
      id: '/providers/test-staging',
      name: 'Test (Staging)',
      description: 'Per Test: test provider',
      hqAddress: '1234 Test St, Test, TS 12345',
      links: [
        {
          name: 'Homepage',
          url: 'https://test.provider/',
        },
        {
          name: 'Terms of service',
          url: 'https://test.provider/terms',
        },
      ],
      logos: {
        light:
          'https://on-ramp.dev-api.cx.metamask.io/assets/providers/test_light.png',
        dark: 'https://on-ramp.dev-api.cx.metamask.io/assets/providers/test_dark.png',
        height: 24,
        width: 65,
      },
    },
    createdAt: 1673886669608,
    fiatAmount: 0,
    totalFeesFiat: 9,
    cryptoAmount: '0.012361263',
    cryptoCurrency: {
      id: '/currencies/crypto/1/usdc',
      idv2: '/currencies/crypto/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      network: {
        active: true,
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        shortName: 'Ethereum',
      },
      logo: 'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/usdc.png',
      decimals: 18,
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: 'USDC',
      name: 'USD Coin',
    },
    fiatCurrency: {
      symbol: 'USD',
      denomSymbol: '$',
      decimals: 2,
    },
    network: '1',
    status: 'CREATED',
    orderType: 'SELL',
    walletAddress: '0x1234',
    txHash: undefined,
    excludeFromPurchases: false,
    depositWallet: '0x34256',
  } as DeepPartial<SellOrder>,
} as FiatOrder;

const mockedOrders = [mockOrder, mockOrder2];

function render(Component: React.ComponentType, orders = mockedOrders) {
  return renderScreen(
    Component,
    {
      name: Routes.RAMP.SEND_TRANSACTION,
    },
    {
      state: {
        engine: {
          backgroundState: initialBackgroundState,
        },
        fiatOrders: {
          orders,
        },
      },
    },
  );
}

const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockPop = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: mockSetOptions.mockImplementation(
        actualReactNavigation.useNavigation().setOptions,
      ),
      goBack: mockGoBack,
      reset: mockReset,
      dangerouslyGetParent: () => ({
        pop: mockPop,
      }),
    }),
  };
});

let mockUseParamsValues: {
  orderId?: string;
} = {
  orderId: 'test-id-1',
};

jest.mock('../../../../../../util/navigation/navUtils', () => ({
  ...jest.requireActual('../../../../../../util/navigation/navUtils'),
  useParams: jest.fn(() => mockUseParamsValues),
}));

jest.mock('../../../../../../core/Engine', () => ({
  context: {
    TransactionController: {
      addTransaction: jest.fn(),
    },
  },
}));

describe('SendTransaction View', () => {
  afterEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    mockSetOptions.mockClear();
    mockReset.mockClear();
    mockPop.mockClear();
    Engine.context.TransactionController.addTransaction.mockClear();
  });

  beforeEach(() => {
    mockUseParamsValues = {
      orderId: 'test-id-1',
    };
  });

  it('calls setOptions when rendering', async () => {
    render(SendTransaction);
    expect(mockSetOptions).toBeCalledTimes(1);
  });

  it('renders correctly', async () => {
    render(SendTransaction);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it('renders correctly for token', async () => {
    mockUseParamsValues = { orderId: 'test-id-2' };
    render(SendTransaction);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it('calls TransactionController.addTransaction for native coin when clicking on send button', async () => {
    render(SendTransaction);
    const sendButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.press(sendButton);
    expect(Engine.context.TransactionController.addTransaction).toBeCalledTimes(
      1,
    );
    expect(Engine.context.TransactionController.addTransaction.mock.calls)
      .toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "chainId": 1,
            "from": "0x1234",
            "to": "0x34256",
            "value": "0x2bea80d2171600",
          },
        ],
      ]
    `);
  });

  it('calls TransactionController.addTransaction for erc20 when clicking on send button', async () => {
    mockUseParamsValues = { orderId: 'test-id-2' };
    render(SendTransaction);
    const sendButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.press(sendButton);
    expect(Engine.context.TransactionController.addTransaction).toBeCalledTimes(
      1,
    );
    expect(Engine.context.TransactionController.addTransaction.mock.calls)
      .toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "data": "0xa9059cbb0000000000000000000000000000000000000000000000000000000000034256000000000000000000000000000000000000000000000000002bea80d2171600",
            "from": "0x1234",
            "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "value": "0x0",
          },
        ],
      ]
    `);
  });
});
