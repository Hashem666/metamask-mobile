import React from 'react';

import BackupAlert from '.';
import renderWithProvider from '../../../util/test/renderWithProvider';
import Engine from '../../../core/Engine';

const mockEngine = Engine;

const initialState = {
  user: {
    seedphraseBackedUp: false,
    passwordSet: false,
    backUpSeedphraseVisible: true,
  },
  wizard: {
    step: 0,
  },
};
const mockNavigation = {
  navigate: jest.fn(),
  dangerouslyGetState: jest.fn(() => ({ routes: [{ name: 'WalletView' }] })),
};
jest.mock('../../../core/Engine', () => ({
  init: () => mockEngine.init({}),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest
    .fn()
    .mockImplementation((callback) => callback(initialState)),
}));

describe('BackupAlert', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <BackupAlert navigation={mockNavigation} onDismiss={() => null} />,
      {
        state: initialState,
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
