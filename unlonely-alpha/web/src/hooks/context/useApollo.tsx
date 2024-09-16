import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useApollo } from "../../apiClient/client";
import { ApolloProvider as ApolloClientProvider } from "@apollo/client";

export const useApolloContext = () => {
  return useContext(ApolloContext);
};

const ApolloContext = createContext<{
  handleLatestVerifiedAddress: (address: string) => void;
}>({
  handleLatestVerifiedAddress: () => undefined,
});

export const ApolloProvider = ({
  pageProps,
  children,
}: {
  pageProps: any;
  children: React.ReactNode;
}) => {
  const [latestVerifiedAddress, setLatestVerifiedAddress] = useState<
    string | null
  >(null);

  const apolloClient = useMemo(
    () =>
      useApollo(
        pageProps ? pageProps.initialApolloState : null,
        latestVerifiedAddress
      ),
    [pageProps, latestVerifiedAddress]
  );

  const handleLatestVerifiedAddress = useCallback((address: string) => {
    setLatestVerifiedAddress(address);
  }, []);

  const value = useMemo(
    () => ({ handleLatestVerifiedAddress, latestVerifiedAddress }),
    [handleLatestVerifiedAddress, latestVerifiedAddress]
  );

  return (
    <ApolloContext.Provider value={value}>
      <ApolloClientProvider client={apolloClient}>
        {children}
      </ApolloClientProvider>
    </ApolloContext.Provider>
  );
};
