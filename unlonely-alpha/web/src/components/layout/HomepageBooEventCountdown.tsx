import React, { useState, useEffect } from "react";
import { Flex, Text } from "@chakra-ui/react";
import {
  IFormConfigurator,
  INITIAL_FORM_CONFIG,
} from "../transactions/SolanaJupiterTerminal";
import { getTimeFromMillis } from "../../utils/time";
import { useBooTokenTerminal } from "../../hooks/internal/boo-token/useBooTokenTerminal";
import { useForm } from "react-hook-form";
import { eventStartTime } from "./BooEventWrapper";
import { IntegratedTerminal } from "./IntegratedBooJupiterTerminal";

export const HomePageBooEventTokenCountdown = ({
  rpcUrl,
}: {
  rpcUrl: string;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = eventStartTime - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [eventStartTime]);

  const { watch } = useForm<IFormConfigurator>({
    defaultValues: INITIAL_FORM_CONFIG,
  });

  const watchAllFields = watch();

  const { balance, fetchTokenBalance, launchTerminal } = useBooTokenTerminal({
    rpcUrl,
    ...watchAllFields,
  });

  return (
    <Flex direction="column" alignItems="center">
      <Flex mt={4} direction={"column"} gap={4} width="100%">
        <div
          style={{
            position: "relative" as const,
            width: "100%",
            height: "40vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Flex
            position="absolute"
            direction="column"
            gap={4}
            alignItems="center"
            textAlign="center"
            width="100%"
            pointerEvents="none"
            opacity={0.5}
          >
            <Text fontFamily={"DigitalDisplay"} fontSize="50px">
              AN UNMISSABLE HALLOWEEN SPECIAL IS ARRIVING IN 1243
            </Text>
            <Text fontFamily={"DigitalDisplay"} fontSize="50px">
              {getTimeFromMillis(timeLeft * 1000, true, true, true)}
            </Text>
          </Flex>
          <iframe
            height="100%"
            width="100%"
            id="geckoterminal-embed"
            title="GeckoTerminal Embed"
            src="https://www.geckoterminal.com/solana/pools/DtxxzR77SEsrVhPzSixCdM1dcuANwQsMiNsM5vSPdYL1?embed=1&info=0&swaps=0"
            allow="clipboard-write"
          ></iframe>
        </div>
        <Flex justifyContent={"center"}>
          <IntegratedTerminal
            rpcUrl="https://solana-mainnet.g.alchemy.com/v2/-D7ZPwVOE8mWLx2zsHpYC2dpZDNkhzjf"
            formProps={watchAllFields.formProps}
            simulateWalletPassthrough={watchAllFields.simulateWalletPassthrough}
            strictTokenList={watchAllFields.strictTokenList}
            defaultExplorer={watchAllFields.defaultExplorer}
            useUserSlippage={false}
            height="40vh"
            width="400px"
          />
        </Flex>
      </Flex>
    </Flex>
  );
};
