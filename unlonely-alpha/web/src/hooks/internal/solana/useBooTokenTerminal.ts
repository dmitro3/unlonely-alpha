import { useEffect } from "react";
import {
  useUnifiedWalletContext,
  useUnifiedWallet,
} from "@jup-ag/wallet-adapter";
import {
  FIXED_SOLANA_MINT,
  FormProps,
  WRAPPED_SOL_MINT,
} from "../../../constants";
export const useBooTokenTerminal = (props: {
  rpcUrl: string;
  formProps: FormProps;
  simulateWalletPassthrough: boolean;
  strictTokenList: boolean;
  defaultExplorer: "Solana Explorer" | "Solscan" | "Solana Beach" | "SolanaFM";
  useUserSlippage: boolean;
  txCallback?: (txid: string, swapResult: any) => void;
}) => {
  const {
    rpcUrl,
    simulateWalletPassthrough,
    strictTokenList,
    defaultExplorer,
    useUserSlippage,
    txCallback,
  } = props;

  const passthroughWalletContextState = useUnifiedWallet();
  const { setShowModal } = useUnifiedWalletContext();

  const launchTerminal = (isBuying: boolean) => {
    const commonProps = { fixedInputMint: true, fixedOutputMint: true };
    (window as any)?.Jupiter?.init({
      endpoint: rpcUrl,
      formProps: isBuying
        ? {
            initialInputMint: WRAPPED_SOL_MINT.toString(),
            initialOutputMint: FIXED_SOLANA_MINT.mintAddress,
            ...commonProps,
          }
        : {
            initialInputMint: FIXED_SOLANA_MINT.mintAddress,
            initialOutputMint: WRAPPED_SOL_MINT.toString(),
            ...commonProps,
          },
      enableWalletPassthrough: simulateWalletPassthrough,
      passthroughWalletContextState: simulateWalletPassthrough
        ? passthroughWalletContextState
        : undefined,
      onRequestConnectWallet: () => setShowModal(true),
      onSuccess: ({ txid, swapResult }: { txid: any; swapResult: any }) => {
        txCallback?.(txid, swapResult);
      },
      onSwapError: ({ error }: { error: any }) => {
        console.log("onSwapError", error);
      },
      strictTokenList,
      defaultExplorer,
      useUserSlippage,
    });
  };

  useEffect(() => {
    if (!(window as any)?.Jupiter?.syncProps) return;
    (window as any)?.Jupiter?.syncProps({ passthroughWalletContextState });
  }, [passthroughWalletContextState, props]);

  return {
    launchTerminal,
  };
};
