import { App } from '@/components/App';
import { HydrationProvider } from '@/components/providers/HydrationProvider';

export default function Home() {
  return (
    <HydrationProvider>
      <App />
    </HydrationProvider>
  );
}
