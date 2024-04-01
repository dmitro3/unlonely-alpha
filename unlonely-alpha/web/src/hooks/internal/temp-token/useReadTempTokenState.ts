import { useEffect, useState } from "react";
import { Contract, NULL_ADDRESS } from "../../../constants";
import { getContractFromNetwork } from "../../../utils/contract";
import { useNetworkContext } from "../../context/useNetwork";
import { useLazyQuery } from "@apollo/client";
import { Log } from "viem";
import { useContractEvent, usePublicClient } from "wagmi";
import { GET_TEMP_TOKENS_QUERY } from "../../../constants/queries";
import { GetTempTokensQuery } from "../../../generated/graphql";
import { UseChannelDetailsType } from "../useChannelDetails";
import TempTokenAbi from "../../../constants/abi/TempTokenV1.json";

export type UseReadTempTokenStateType = {
  currentActiveTokenSymbol: string;
  currentActiveTokenAddress: string;
  currentActiveTokenEndTimestamp: bigint;
};

export const useReadTempTokenInitialState: UseReadTempTokenStateType = {
  currentActiveTokenSymbol: "",
  currentActiveTokenAddress: NULL_ADDRESS,
  currentActiveTokenEndTimestamp: BigInt(0),
};

export const useReadTempTokenState = (  channelDetails: UseChannelDetailsType
    ): UseReadTempTokenStateType => {
    const { network } = useNetworkContext();
    const { localNetwork } = network;
    const publicClient = usePublicClient();

    const [currentActiveTokenAddress, setCurrentActiveTokenAddress] =
    useState<string>(NULL_ADDRESS);
  const [currentActiveTokenEndTimestamp, setCurrentActiveTokenEndTimestamp] =
    useState<bigint>(BigInt(0));
  const [currentActiveTokenSymbol, setCurrentActiveTokenSymbol] = useState<string>("");

    const factoryContract = getContractFromNetwork(
        Contract.TEMP_TOKEN_FACTORY_V1,
        localNetwork
      );
    
    const [incomingTempTokenCreatedLogs, setIncomingTempTokenCreatedLogs] = useState<Log[]>([]);

    useContractEvent({
        address: factoryContract.address,
        abi: factoryContract.abi,
        eventName: "TempTokenCreated",
        listener(logs) {
          console.log("detected TempTokenCreated event", logs);
          const init = async () => {
            setIncomingTempTokenCreatedLogs(logs);
          };
          init();
        },
      });
    
      useEffect(() => {
        if (incomingTempTokenCreatedLogs) handleTempTokenCreatedUpdate(incomingTempTokenCreatedLogs);
      }, [incomingTempTokenCreatedLogs]);
    
      const handleTempTokenCreatedUpdate = async (logs: Log[]) => {
        if (logs.length === 0) return;
        const filteredLogsByOwner = logs.filter(
          (log: any) =>
            (log.args.owner as `0x${string}`) ===
            channelDetails.channelQueryData?.owner.address
        );
        const sortedLogs = filteredLogsByOwner.sort(
          (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
        );
        if (sortedLogs.length === 0) return;
        const latestLog: any = sortedLogs[sortedLogs.length - 1];
        const newEndTimestamp = latestLog?.args.endTimestamp as bigint;
        const newTokenAddress = latestLog?.args.tokenAddress as `0x${string}`;
        const newTokenSymbol = latestLog?.args.symbol as string;
    
        setCurrentActiveTokenEndTimestamp(newEndTimestamp);
        setCurrentActiveTokenAddress(newTokenAddress);
        setCurrentActiveTokenSymbol(newTokenSymbol);
      };
    
      const [getTempTokensQuery] = useLazyQuery<GetTempTokensQuery>(
        GET_TEMP_TOKENS_QUERY,
        {
          fetchPolicy: "network-only",
        }
      );

      useEffect(() => {
        const init = async () => {
          if (!(Number(channelDetails.channelQueryData?.id ?? "0") > 0)) return;
          try {
            const res = await getTempTokensQuery({
              variables: {
                data: {
                  channelId: Number(channelDetails.channelQueryData?.id ?? "0"),
                  chainId: localNetwork.config.chainId,
                  onlyActiveTokens: true,
                  fulfillAllNotAnyConditions: true,
                },
              },
            });
            const listOfActiveTokens = res.data?.getTempTokens;
            const latestActiveToken = listOfActiveTokens?.[0];
            if (latestActiveToken) {
              setCurrentActiveTokenSymbol(latestActiveToken.symbol);
              const endTimestamp = await publicClient.readContract({
                address: latestActiveToken.tokenAddress as `0x${string}`,
                abi: TempTokenAbi,
                functionName: "endTimestamp"
            })
              setCurrentActiveTokenEndTimestamp(
                BigInt(String(endTimestamp))
              );
              setCurrentActiveTokenAddress(latestActiveToken.tokenAddress);
            }
          } catch (e) {
            console.error("getTempTokensQuery", e);
          }
        };
        init();
      }, [channelDetails.channelQueryData?.id, localNetwork.config.chainId]);

    return {
        currentActiveTokenSymbol,
        currentActiveTokenAddress,
        currentActiveTokenEndTimestamp,
    };
}