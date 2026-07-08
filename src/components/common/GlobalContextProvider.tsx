'use client';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
type Props = {
  children: ReactNode;
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
  },
});

function GlobalContextProvider({ children }: Props) {
  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <ToastProvider placement="top-center" />
        </ThemeProvider>
      </QueryClientProvider>
    </HeroUIProvider>
  );
}

export default GlobalContextProvider;
