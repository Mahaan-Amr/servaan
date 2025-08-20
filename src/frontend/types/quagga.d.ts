declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement;
      constraints: {
        width: { min: number; ideal: number; max: number };
        height: { min: number; ideal: number; max: number };
        facingMode: string;
        deviceId: string;
      };
    };
    locator: {
      patchSize: string;
      halfSample: boolean;
    };
    numOfWorkers: number;
    decoder: {
      readers: string[];
    };
    locate: boolean;
    debug: boolean;
  }

  interface DetectedResult {
    codeResult: {
      code: string;
      format: string;
    };
    line?: any;
    angle?: number;
    pattern?: any;
  }

  interface QuaggaJSStatic {
    init(config: QuaggaConfig, callback: (err?: any) => void): void;
    start(): void;
    stop(): void;
    onDetected(callback: (result: DetectedResult) => void): void;
    onProcessed(callback: (result?: any) => void): void;
    offDetected(): void;
    offProcessed(): void;
  }

  const Quagga: QuaggaJSStatic;
  export default Quagga;
} 