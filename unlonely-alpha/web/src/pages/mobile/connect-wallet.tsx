import { Box, Flex } from "@chakra-ui/react";
import { useModal } from "connectkit";
import { useEffect } from "react";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";
import NextHead from "../../components/layout/NextHead";
import ConnectWallet from "../../components/navigation/ConnectKit";

const styles = `
  html, body {
    background: transparent !important;
  }

  *, *:before, *:after {
    user-select: none !important;
  }

  div[role="dialog"] {
    --ck-overlay-background: transparent !important;
  }

  .sc-iqcoie.fNQent button {
    display: none !important;
  }

  .enYPqY::before {
    border-radius: 50px !important;
  }

  .mobile-connectkit-button-load-in-transition {
    opacity: 0;
  }
`;

export default function MobileConnectWallet() {
  const { open, setOpen } = useModal();
  const account = useAccount({
    onConnect() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (window.ReactNativeWebView !== undefined) {
        // @ts-ignore
        window.ReactNativeWebView.postMessage("wallet_connected");
      }
    },
    onDisconnect() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (window.ReactNativeWebView !== undefined) {
        // @ts-ignore
        window.ReactNativeWebView.postMessage("wallet_disconnected");
      }
    },
  });
  const { data: ensName, isLoading: isNameLoading } = useEnsName({
    address: account.address,
  });
  const { data: ensAvatar, isLoading: isAvatarLoading } = useEnsAvatar({
    address: account.address,
  });

  useEffect(() => {
    const walletData = {
      address: account.address,
      ensName: ensName,
      ensAvatar: ensAvatar,
    };

    if (walletData.address && !isNameLoading && !isAvatarLoading) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (window.ReactNativeWebView !== undefined) {
        setTimeout(() => {
          // @ts-ignore
          window.ReactNativeWebView.postMessage(JSON.stringify(walletData));
        }, 1000);
      }
    }
  }, [account, ensName, ensAvatar]);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) {
      // @ts-ignore
      if (window.ReactNativeWebView !== undefined) {
        // @ts-ignore
        window.ReactNativeWebView.postMessage("ck_modal_closed");
      }

      setTimeout(() => setOpen(true), 1000);
    }
  }, [open]);

  return (
    <Flex
      flexDirection="column"
      justifyContent="flex-end"
      alignItems="center"
      width="100%"
      height="100svh"
    >
      <NextHead title="Unlonely" image={""} description={""} />
      <style>{styles}</style>
      <div className="mobile-connectkit-button-load-in-transition">
        <Box
          borderRadius="20px"
          bgGradient="linear(to-r, #d16fce, #7655D2, #4173D6, #4ABBDF)"
          padding={2}
        >
          <ConnectWallet />
        </Box>
      </div>
    </Flex>
  );
}
