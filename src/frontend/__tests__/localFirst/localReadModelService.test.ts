import { readLocalFirst } from '../../services/localReadModelService';
import {
  getDesktopStoreValue,
  isDesktopApp,
  setDesktopStoreValue
} from '../../services/desktopBridgeService';

jest.mock('../../services/desktopBridgeService', () => ({
  getDesktopStoreValue: jest.fn(),
  isDesktopApp: jest.fn(),
  setDesktopStoreValue: jest.fn()
}));

const getDesktopStoreValueMock = getDesktopStoreValue as jest.Mock;
const isDesktopAppMock = isDesktopApp as jest.Mock;
const setDesktopStoreValueMock = setDesktopStoreValue as jest.Mock;

async function flushBackgroundRefresh(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('local read model service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isDesktopAppMock.mockReturnValue(true);
    getDesktopStoreValueMock.mockResolvedValue({
      key: 'inventory.current',
      value: [{ itemId: 'item-1', current: 4 }],
      updatedAt: '2026-06-27T12:00:00.000Z'
    });
  });

  it('returns cached data without refetching when refresh is disabled', async () => {
    const fetchFresh = jest.fn().mockResolvedValue([{ itemId: 'item-1', current: 5 }]);

    const result = await readLocalFirst('inventory.current', fetchFresh, { refresh: false });

    expect(result).toEqual([{ itemId: 'item-1', current: 4 }]);
    expect(fetchFresh).not.toHaveBeenCalled();
    expect(setDesktopStoreValueMock).not.toHaveBeenCalled();
  });

  it('keeps background refresh enabled for normal cached reads', async () => {
    const fetchFresh = jest.fn().mockResolvedValue([{ itemId: 'item-1', current: 5 }]);

    const result = await readLocalFirst('inventory.current', fetchFresh);
    await flushBackgroundRefresh();

    expect(result).toEqual([{ itemId: 'item-1', current: 4 }]);
    expect(fetchFresh).toHaveBeenCalledTimes(1);
    expect(setDesktopStoreValueMock).toHaveBeenCalledWith(
      'local_read_models',
      'inventory.current',
      expect.objectContaining({
        key: 'inventory.current',
        value: [{ itemId: 'item-1', current: 5 }]
      })
    );
  });
});
