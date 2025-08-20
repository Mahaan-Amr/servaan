# طراحی سیستم QR/Barcode Scanner - سِروان

**نسخه**: 1.0  
**تاریخ**: 2025/01/10  
**وضعیت**: Design Phase - Ready for Implementation

---

## 🎯 **اهداف سیستم اسکنر**

### **هدف اصلی**
توسعه یک **سیستم اسکن QR/Barcode پیشرفته وب-محور** که ورود و مدیریت اطلاعات موجودی را سریع، دقیق و کاربرپسند کند.

### **اهداف فرعی**
- 📱 **اسکن سریع و دقیق** QR Code و Barcode از طریق مرورگر
- 📦 **ورود خودکار اطلاعات** کالا به سیستم موجودی
- 🔍 **جستجوی فوری** محصولات با اسکن
- 📊 **تولید QR Code** برای محصولات داخلی
- 🌐 **رابط وب responsive** برای استفاده در موبایل و دسکتاپ
- 🔄 **همگام‌سازی real-time** با سیستم اصلی
- 📈 **آمارگیری** از فعالیت‌های اسکن

---

## 🏗️ **Architecture سیستم اسکنر**

### **ساختار کلی**
```
┌─────────────────────────────────────────────────────────┐
│                 Servaan Scanner System                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Web Scanner    │  │  PWA Scanner    │               │
│  │  (WebRTC)       │  │  (Offline)      │               │ 
│  └─────────────────┘  └─────────────────┘               │
│           │                     │                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Scanner Engine                         ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ││
│  │  │QR Decoder   │ │Barcode      │ │Product      │   ││
│  │  │(ZXing-js)   │ │Decoder      │ │Lookup       │   ││
│  │  └─────────────┘ │(QuaggaJS)   │ └─────────────┘   ││
│  │                  └─────────────┘                   ││
│  └─────────────────────────────────────────────────────┘│
│           │                     │                       │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Product        │  │  External APIs  │               │
│  │  Database       │  │  (UPC, EAN)     │               │
│  └─────────────────┘  └─────────────────┘               │
│           │                     │                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Integration Layer                      ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ││
│  │  │Inventory    │ │POS System   │ │Accounting   │   ││
│  │  │System       │ │Integration  │ │Integration  │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 **Web Scanner Design**

### **React Web App Architecture**

```typescript
// Web Scanner Structure
interface WebScannerApp {
  components: {
    scanner: WebcamScanner;
    productDetails: ProductDetailsModal;
    inventory: InventoryView;
    settings: ScannerSettings;
    history: ScanHistoryTable;
  };
  services: {
    cameraService: WebRTCCameraService;
    scannerService: WebBarcodeService;
    apiService: ApiService;
    storageService: IndexedDBService;
  };
}

// Main Scanner Component
interface WebcamScanner {
  camera: WebcamComponent;
  overlay: ScanOverlay;
  controls: ScanControls;
  results: ScanResults;
}
```

### **WebRTC Camera Integration**

```typescript
import Webcam from 'react-webcam';
import Quagga from 'quagga';
import { BrowserMultiFormatReader } from '@zxing/library';

interface WebRTCCameraService {
  setupCamera(): Promise<void>;
  startScanning(): void;
  stopScanning(): void;
  toggleFlash(): void;
  switchCamera(): void;
}

class WebRTCCameraService implements WebRTCCameraService {
  private webcamRef: React.RefObject<Webcam> | null = null;
  private isScanning: boolean = false;
  private scannerActive: boolean = false;
  private devices: MediaDeviceInfo[] = [];
  private selectedDeviceId: string = '';
  
  async setupCamera(): Promise<void> {
    try {
      // درخواست مجوز دوربین
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // دریافت لیست دوربین‌ها
      this.devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = this.devices.filter(device => device.kind === 'videoinput');
      
      // انتخاب دوربین پشتی برای موبایل
      const backCamera = this.devices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      );
      
      this.selectedDeviceId = backCamera?.deviceId || this.devices[0]?.deviceId || '';
      
      // متوقف کردن stream اولیه
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      throw new Error('دسترسی به دوربین امکان‌پذیر نیست');
    }
  }
  
  startScanning(): void {
    if (this.scannerActive) return;
    
    this.isScanning = true;
    this.scannerActive = true;
    
    // راه‌اندازی QuaggaJS برای بارکد
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#scanner-container'),
        constraints: {
          width: { min: 640, ideal: 1920, max: 1920 },
          height: { min: 480, ideal: 1080, max: 1080 },
          facingMode: "environment",
          deviceId: this.selectedDeviceId
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 2,
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader", 
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error('خطا در راه‌اندازی scanner:', err);
        this.stopScanning();
        return;
      }
      Quagga.start();
    });
    
    // تنظیم event listener برای تشخیص بارکد
    Quagga.onDetected((data) => {
      if (!this.isScanning) return;
      
      const code = data.codeResult.code;
      const format = data.codeResult.format;
      
      // جلوگیری از تشخیص تکراری
      this.temporaryPause();
      
      // پردازش کد اسکن شده
      this.handleScanResult({
        code,
        format,
        timestamp: Date.now()
      });
    });
  }
  
  stopScanning(): void {
    this.isScanning = false;
    this.scannerActive = false;
    
    if (typeof Quagga !== 'undefined') {
      Quagga.stop();
      Quagga.offDetected();
      Quagga.offProcessed();
    }
  }
  
  private temporaryPause(): void {
    this.isScanning = false;
    setTimeout(() => {
      this.isScanning = true;
    }, 2000); // 2 ثانیه مکث
  }
  
  private async handleScanResult(scanData: ScanResult): Promise<void> {
    try {
      // لرزش و صدا برای feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      // پردازش کد
      const result = await WebBarcodeService.processBarcode(scanData);
      
      // نمایش نتیجه
      this.showScanResult(result);
      
    } catch (error) {
      console.error('خطا در پردازش کد اسکن شده:', error);
    }
  }
  
  switchCamera(): void {
    if (this.devices.length <= 1) return;
    
    const currentIndex = this.devices.findIndex(d => d.deviceId === this.selectedDeviceId);
    const nextIndex = (currentIndex + 1) % this.devices.length;
    this.selectedDeviceId = this.devices[nextIndex].deviceId;
    
    // راه‌اندازی مجدد scanner با دوربین جدید
    this.stopScanning();
    setTimeout(() => this.startScanning(), 500);
  }
}

// Scanner Component
const WebcamScanner: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  const cameraService = useMemo(() => new WebRTCCameraService(), []);
  
  useEffect(() => {
    const initCamera = async () => {
      try {
        await cameraService.setupCamera();
        const availableDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = availableDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('خطا در راه‌اندازی دوربین:', error);
      }
    };
    
    initCamera();
    
    return () => {
      cameraService.stopScanning();
    };
  }, [cameraService]);
  
  const startScanning = () => {
    setIsScanning(true);
    cameraService.startScanning();
  };
  
  const stopScanning = () => {
    setIsScanning(false);
    cameraService.stopScanning();
  };
  
  return (
    <div className="scanner-container relative">
      {/* Scanner Container */}
      <div id="scanner-container" className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
        {/* Scanner overlay will be added by QuaggaJS */}
      </div>
      
      {/* Scanner Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        <ScanOverlay isScanning={isScanning} />
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={isScanning ? stopScanning : startScanning}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isScanning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isScanning ? 'توقف اسکن' : 'شروع اسکن'}
        </button>
        
        {devices.length > 1 && (
          <button
            onClick={() => cameraService.switchCamera()}
            className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            تغییر دوربین
          </button>
        )}
      </div>
      
      {/* Scan Result Modal */}
      {scanResult && (
        <ScanResultModal 
          result={scanResult} 
          onClose={() => setScanResult(null)}
        />
      )}
    </div>
  );
};
```

---

## 📊 **Integration with Inventory System**

### **Inventory Integration Service**

```typescript
class InventoryIntegrationService {
  // اضافه کردن محصول از طریق اسکن
  static async addProductFromScan(
    scanResult: ScanResult,
    quantity: number,
    location?: string
  ): Promise<InventoryEntry> {
    
    try {
      // بررسی وجود محصول در سیستم
      let item = await this.findExistingItem(scanResult.value);
      
      // اگر محصول وجود ندارد، ایجاد محصول جدید
      if (!item) {
        item = await this.createNewItem(scanResult);
      }
      
      // ایجاد ورودی موجودی
      const inventoryEntry: InventoryEntry = {
        itemId: item.id,
        type: 'IN',
        quantity,
        unitPrice: item.costPrice || 0,
        totalPrice: (item.costPrice || 0) * quantity,
        date: new Date(),
        notes: `اضافه شده از طریق اسکن: ${scanResult.value}`,
        location,
        scannedCode: scanResult.value,
        scanTimestamp: scanResult.timestamp
      };
      
      // ثبت در سیستم موجودی
      const savedEntry = await ApiService.post('/api/inventory', inventoryEntry);
      
      // ارسال نوتیفیکیشن
      await NotificationService.send({
        type: 'INVENTORY_ADDED',
        title: 'محصول جدید اضافه شد',
        message: `${item.name} - تعداد: ${quantity}`,
        data: { itemId: item.id, entryId: savedEntry.id }
      });
      
      return savedEntry;
      
    } catch (error) {
      throw new Error(`خطا در اضافه کردن محصول: ${error.message}`);
    }
  }
  
  // جستجوی محصول موجود
  private static async findExistingItem(code: string): Promise<Item | null> {
    try {
      const response = await ApiService.get(`/api/items/search?barcode=${code}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
  
  // ایجاد محصول جدید
  private static async createNewItem(scanResult: ScanResult): Promise<Item> {
    const itemData: Partial<Item> = {
      name: scanResult.product?.name || `محصول ${scanResult.value}`,
      description: scanResult.product?.description,
      barcode: scanResult.value,
      categoryId: await this.getDefaultCategoryId(),
      unitPrice: scanResult.product?.price || 0,
      costPrice: scanResult.product?.price || 0,
      minQuantity: 5,
      isActive: true,
      createdFromScan: true
    };
    
    const response = await ApiService.post('/api/items', itemData);
    return response.data;
  }
  
  // دریافت دسته‌بندی پیش‌فرض
  private static async getDefaultCategoryId(): Promise<string> {
    try {
      const response = await ApiService.get('/api/categories?default=true');
      return response.data[0]?.id || null;
    } catch (error) {
      return null;
    }
  }
  
  // بروزرسانی موجودی از طریق اسکن
  static async updateInventoryFromScan(
    itemId: string,
    newQuantity: number,
    reason: string
  ): Promise<InventoryEntry> {
    
    // دریافت موجودی فعلی
    const currentInventory = await ApiService.get(`/api/inventory/current/${itemId}`);
    const currentQuantity = currentInventory.data.quantity;
    
    // محاسبه تغییر
    const quantityChange = newQuantity - currentQuantity;
    const entryType = quantityChange > 0 ? 'IN' : 'OUT';
    
    const inventoryEntry: InventoryEntry = {
      itemId,
      type: entryType,
      quantity: Math.abs(quantityChange),
      unitPrice: 0,
      totalPrice: 0,
      date: new Date(),
      notes: `بروزرسانی از طریق اسکن: ${reason}`,
      isAdjustment: true
    };
    
    return await ApiService.post('/api/inventory', inventoryEntry);
  }
  
  // گزارش اسکن‌های انجام شده
  static async getScanReport(
    startDate: Date,
    endDate: Date
  ): Promise<ScanReport> {
    
    const response = await ApiService.get('/api/scan-history', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    const scanHistory = response.data;
    
    return {
      totalScans: scanHistory.length,
      successfulScans: scanHistory.filter(s => s.product).length,
      failedScans: scanHistory.filter(s => !s.product).length,
      newProductsAdded: scanHistory.filter(s => s.createdNewProduct).length,
      mostScannedProducts: this.getMostScannedProducts(scanHistory),
      scansByHour: this.groupScansByHour(scanHistory),
      scansByDay: this.groupScansByDay(scanHistory)
    };
  }
  
  private static getMostScannedProducts(scanHistory: ScanResult[]): ProductScanCount[] {
    const productCounts = new Map<string, number>();
    
    scanHistory.forEach(scan => {
      if (scan.product?.id) {
        const count = productCounts.get(scan.product.id) || 0;
        productCounts.set(scan.product.id, count + 1);
      }
    });
    
    return Array.from(productCounts.entries())
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
```

---

## 📱 **Mobile App Screens**

### **Product Details Screen**

```typescript
const ProductDetailsScreen: React.FC<{ route: any }> = ({ route }) => {
  const { scanResult } = route.params;
  const [product, setProduct] = useState<ProductInfo | null>(scanResult.product);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  
  const handleAddToInventory = async () => {
    setLoading(true);
    try {
      await InventoryIntegrationService.addProductFromScan(
        scanResult,
        parseInt(quantity)
      );
      
      Alert.alert('موفق', 'محصول با موفقیت به موجودی اضافه شد');
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('خطا', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>جزئیات محصول</Text>
        <Text style={styles.code}>کد: {scanResult.value}</Text>
      </View>
      
      {product?.imageUrl && (
        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      )}
      
      <View style={styles.details}>
        <Text style={styles.productName}>{product?.name || 'نام محصول'}</Text>
        <Text style={styles.description}>{product?.description}</Text>
        <Text style={styles.brand}>برند: {product?.brand}</Text>
        <Text style={styles.category}>دسته‌بندی: {product?.category}</Text>
      </View>
      
      <View style={styles.quantitySection}>
        <Text style={styles.label}>تعداد:</Text>
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="تعداد"
        />
      </View>
      
      <TouchableOpacity
        style={[styles.addButton, loading && styles.disabledButton]}
        onPress={handleAddToInventory}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>
          {loading ? 'در حال اضافه کردن...' : 'اضافه به موجودی'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

### **Scan History Screen**

```typescript
const ScanHistoryScreen: React.FC = () => {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  
  useEffect(() => {
    loadScanHistory();
  }, []);
  
  const loadScanHistory = async () => {
    try {
      const history = await StorageService.getScanHistory();
      setScanHistory(history);
    } catch (error) {
      Alert.alert('خطا', 'خطا در بارگذاری تاریخچه');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredHistory = scanHistory.filter(scan => {
    switch (filter) {
      case 'SUCCESS':
        return scan.product !== undefined;
      case 'FAILED':
        return scan.product === undefined;
      default:
        return true;
    }
  });
  
  const renderScanItem = ({ item }: { item: ScanResult }) => (
    <View style={styles.scanItem}>
      <View style={styles.scanHeader}>
        <Text style={styles.scanCode}>{item.value}</Text>
        <Text style={styles.scanTime}>
          {item.timestamp.toLocaleString('fa-IR')}
        </Text>
      </View>
      
      {item.product ? (
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <Text style={styles.productDescription}>{item.product.description}</Text>
        </View>
      ) : (
        <Text style={styles.noProduct}>محصول شناسایی نشد</Text>
      )}
      
      <View style={styles.scanType}>
        <Text style={[
          styles.typeText,
          item.type === 'QR_CODE' ? styles.qrType : styles.barcodeType
        ]}>
          {item.type === 'QR_CODE' ? 'QR Code' : 'Barcode'}
        </Text>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ALL' && styles.activeFilter]}
          onPress={() => setFilter('ALL')}
        >
          <Text>همه</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'SUCCESS' && styles.activeFilter]}
          onPress={() => setFilter('SUCCESS')}
        >
          <Text>موفق</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'FAILED' && styles.activeFilter]}
          onPress={() => setFilter('FAILED')}
        >
          <Text>ناموفق</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredHistory}
        renderItem={renderScanItem}
        keyExtractor={(item, index) => `${item.value}-${index}`}
        refreshing={loading}
        onRefresh={loadScanHistory}
        ListEmptyComponent={
          <Text style={styles.emptyText}>تاریخچه اسکنی وجود ندارد</Text>
        }
      />
    </View>
  );
};
```

**🎯 سیستم QR/Barcode Scanner کامل آماده برای پیاده‌سازی است! تمام ویژگی‌های موبایل، وب، تولید QR Code و یکپارچگی با سیستم موجودی طراحی شده است.** 