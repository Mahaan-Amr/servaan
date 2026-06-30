import { sanitizeForDesktopInvoke } from '../../services/desktopBridgeService';

describe('desktop bridge serialization', () => {
  it('removes undefined object fields before Tauri invoke', () => {
    const value = sanitizeForDesktopInvoke({
      setupComplete: true,
      deviceName: 'Servaan Device',
      printerName: undefined,
      nested: {
        keep: 'value',
        drop: undefined
      },
      list: [1, undefined, { keep: true, drop: undefined }]
    });

    expect(value).toEqual({
      setupComplete: true,
      deviceName: 'Servaan Device',
      nested: {
        keep: 'value'
      },
      list: [1, null, { keep: true }]
    });
  });
});
