import React, { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { useClipboard } from "use-clipboard-copy";
import { useAccount } from "wagmi";

import ConnectWallet from "../../components/navigation/ConnectKit";

export default function MobileCoinbase() {
  const [showCloneButton, setShowCloneButton] = useState(false);
  const clipboard = useClipboard({
    copiedTimeout: 10000, // timeout duration in milliseconds
  });

  const cloneSession = () => {
    const localStorageObj = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const value = localStorage.getItem(key);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      localStorageObj[key] = value;
    }

    const jsonString = JSON.stringify(localStorageObj);
    clipboard.copy(jsonString);
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const account = useAccount({
    onConnect() {
      const connected = localStorage.getItem("wagmi.connected");

      if (connected && connected === "true") {
        setShowCloneButton(true);
      }
    },
    onDisconnect() {
      setShowCloneButton(false);
    },
  });

  useEffect(() => {
    const connected = localStorage.getItem("wagmi.connected");

    if (connected && connected === "true") {
      setShowCloneButton(true);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: 20,
      }}
    >
      <ConnectWallet />
      {showCloneButton && (
        <Box marginTop={10}>
          <button
            onClick={cloneSession}
            style={{
              padding: "10px 20px",
              backgroundColor: "white",
              borderRadius: 12,
            }}
          >
            {clipboard.copied ? "✅ copied" : "copy session"}
          </button>
        </Box>
      )}
      <Box marginTop={2}>
        {clipboard.copied ? (
          <p>go back to unlonely mobile to paste</p>
        ) : (
          <p>☝️</p>
        )}
      </Box>
    </div>
  );
}