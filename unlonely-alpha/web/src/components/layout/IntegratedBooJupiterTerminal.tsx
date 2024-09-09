import React, { useCallback, useEffect, useState, memo } from "react";
import { useUnifiedWalletContext, useWallet } from "@jup-ag/wallet-adapter";
import { FormProps } from "../transactions/SolanaJupiterTerminal";
import { Spinner } from "@chakra-ui/react";

interface IntegratedTerminalProps {
  rpcUrl: string;
  formProps: FormProps;
  simulateWalletPassthrough: boolean;
  strictTokenList: boolean;
  defaultExplorer: "Solana Explorer" | "Solscan" | "Solana Beach" | "SolanaFM";
  useUserSlippage: boolean;
}

export const IntegratedTerminal = memo((props: IntegratedTerminalProps) => {
  const {
    rpcUrl,
    formProps,
    simulateWalletPassthrough,
    strictTokenList,
    defaultExplorer,
    useUserSlippage,
  } = props;
  const [isLoaded, setIsLoaded] = useState(false);

  const passthroughWalletContextState = useWallet();
  const { setShowModal } = useUnifiedWalletContext();

  const launchTerminal = useCallback(async () => {
    (window as any)?.Jupiter.init({
      displayMode: "integrated",
      integratedTargetId: "integrated-terminal",
      endpoint: rpcUrl,
      formProps,
      enableWalletPassthrough: simulateWalletPassthrough,
      passthroughWalletContextState: simulateWalletPassthrough
        ? passthroughWalletContextState
        : undefined,
      onRequestConnectWallet: () => setShowModal(true),
      strictTokenList,
      defaultExplorer,
      useUserSlippage,
    });
  }, [
    defaultExplorer,
    formProps,
    passthroughWalletContextState,
    rpcUrl,
    setShowModal,
    simulateWalletPassthrough,
    strictTokenList,
    useUserSlippage,
  ]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined;
    if (!isLoaded || !(window as any)?.Jupiter.init) {
      intervalId = setInterval(() => {
        setIsLoaded(Boolean((window as any)?.Jupiter.init));
      }, 500);
    }

    if (intervalId) {
      return () => clearInterval(intervalId);
    }
  }, [isLoaded]);

  useEffect(() => {
    setTimeout(() => {
      if (isLoaded && Boolean((window as any)?.Jupiter.init)) {
        launchTerminal();
      }
    }, 200);
  }, [isLoaded, launchTerminal]);

  // To make sure passthrough wallet are synced
  useEffect(() => {
    if (!(window as any)?.Jupiter.syncProps) return;
    (window as any)?.Jupiter.syncProps({ passthroughWalletContextState });
  }, [passthroughWalletContextState]);

  return (
    <div>
      {/* Loading state */}
      {!isLoaded && <Spinner />}

      <div
        id="integrated-terminal"
        style={{
          overflow: "auto",
          height: "350px",
          width: "330px",
        }}
      />
    </div>
  );
});
