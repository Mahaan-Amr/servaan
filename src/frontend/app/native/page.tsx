import { Suspense } from 'react';
import { NativeApp } from '../../components/native/NativeApp';

export default function NativePage() {
  return (
    <Suspense fallback={null}>
      <NativeApp />
    </Suspense>
  );
}
