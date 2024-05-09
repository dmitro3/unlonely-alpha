import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, InteractionType, NULL_ADDRESS } from "../../../../constants";
import { getContractFromNetwork } from "../../../../utils/contract";
import { useNetworkContext } from "../../../context/useNetwork";
import { useLazyQuery } from "@apollo/client";
import { createPublicClient, http, isAddressEqual } from "viem";
import { usePublicClient } from "wagmi";
import { GET_TEMP_TOKENS_QUERY } from "../../../../constants/queries";
import {
  GetTempTokensQuery,
  TempToken,
  TempTokenType,
  TempTokenWithBalance,
} from "../../../../generated/graphql";
import TempTokenAbi from "../../../../constants/abi/TempTokenV1.json";
import { ContractData } from "../../../../constants/types";
import useUpdateTempTokenHasRemainingFundsForCreator from "../../../server/temp-token/useUpdateTempTokenHasRemainingFundsForCreator";
import { useUser } from "../../../context/useUser";
import { base } from "viem/chains";
import {
  UseReadTempTokenTxsType,
  useReadTempTokenTxs,
  useReadTempTokenTxsInitial,
} from "./useReadTempTokenTxs";
import { useReadTempTokenExternalEventListeners } from "./useReadTempTokenExternalEventListeners";
import usePostTempToken from "../../../server/temp-token/usePostTempToken";
import { useRouter } from "next/router";
import { useChannelContext } from "../../../context/useChannel";

export type UseReadTempTokenContextStateType = {
  currentActiveTokenSymbol: string;
  currentActiveTokenAddress: string;
  currentActiveTokenEndTimestamp?: bigint;
  currentActiveTokenTotalSupply: bigint;
  currentActiveTokenHasHitTotalSupplyThreshold: boolean;
  currentActiveTokenTotalSupplyThreshold: bigint;
  currentActiveTokenIsAlwaysTradable: boolean;
  currentActiveTokenHighestTotalSupply: bigint;
  currentActiveTokenCreationBlockNumber: bigint;
  lastInactiveTokenAddress: string;
  lastInactiveTokenBalance: bigint;
  lastInactiveTokenSymbol: string;
  currentTempTokenContract: ContractData;
  isPermanentGameModalOpen: boolean;
  isSuccessGameModalOpen: boolean;
  isFailedGameModalOpen: boolean;
  isPermanentGameState: boolean;
  isSuccessGameState: boolean;
  isFailedGameState: boolean;
  canPlayToken: boolean;
  onMintEvent: (totalSupply: bigint, highestTotalSupply: bigint) => void;
  onBurnEvent: (totalSupply: bigint) => void;
  onReachThresholdEvent: (newEndTimestamp: bigint) => void;
  onDurationIncreaseEvent: (newEndTimestamp: bigint) => void;
  onAlwaysTradeableEvent: () => void;
  onThresholdUpdateEvent: (newThreshold: bigint) => void;
  onSendRemainingFundsToWinnerEvent: (
    tokenAddress: string,
    tokenIsCurrentlyActive: boolean
  ) => void;
  handleIsGamePermanent: (value: boolean) => void;
  handleIsGameSuccess: (value: boolean) => void;
  handleIsGameFailed: (value: boolean) => void;
  handleIsPermanentGameModalOpen: (value: boolean) => void;
  handleIsSuccessGameModalOpen: (value: boolean) => void;
  handleIsFailedGameModalOpen: (value: boolean) => void;
  handleCanPlayToken: (value: boolean) => void;
  handleCurrentActiveTokenEndTimestamp: (value: bigint) => void;
  handleCurrentActiveTokenCreationBlockNumber: (value: bigint) => void;
  handleCurrentActiveTokenAddress: (value: string) => void;
  handleCurrentActiveTokenSymbol: (value: string) => void;
  handleCurrentActiveTokenTotalSupplyThreshold: (value: bigint) => void;
  handleCurrentActiveTokenHasHitTotalSupplyThreshold: (value: boolean) => void;
} & UseReadTempTokenTxsType;

export const useReadTempTokenInitialState: UseReadTempTokenContextStateType = {
  currentActiveTokenSymbol: "",
  currentActiveTokenAddress: NULL_ADDRESS,
  currentActiveTokenEndTimestamp: undefined,
  currentActiveTokenTotalSupply: BigInt(0),
  currentActiveTokenHasHitTotalSupplyThreshold: false,
  currentActiveTokenTotalSupplyThreshold: BigInt(0),
  currentActiveTokenIsAlwaysTradable: false,
  currentActiveTokenHighestTotalSupply: BigInt(0),
  currentActiveTokenCreationBlockNumber: BigInt(0),
  lastInactiveTokenAddress: NULL_ADDRESS,
  lastInactiveTokenBalance: BigInt(0),
  lastInactiveTokenSymbol: "",
  currentTempTokenContract: {
    address: NULL_ADDRESS,
    abi: undefined,
    chainId: 0,
  },
  isPermanentGameModalOpen: false,
  isSuccessGameModalOpen: false,
  isFailedGameModalOpen: false,
  isPermanentGameState: false,
  isSuccessGameState: false,
  isFailedGameState: false,
  canPlayToken: false,
  onMintEvent: () => undefined,
  onBurnEvent: () => undefined,
  onReachThresholdEvent: () => undefined,
  onDurationIncreaseEvent: () => undefined,
  onAlwaysTradeableEvent: () => undefined,
  onThresholdUpdateEvent: () => undefined,
  onSendRemainingFundsToWinnerEvent: () => undefined,
  handleIsGamePermanent: () => undefined,
  handleIsGameSuccess: () => undefined,
  handleIsGameFailed: () => undefined,
  handleIsPermanentGameModalOpen: () => undefined,
  handleIsSuccessGameModalOpen: () => undefined,
  handleIsFailedGameModalOpen: () => undefined,
  handleCanPlayToken: () => undefined,
  handleCurrentActiveTokenEndTimestamp: () => undefined,
  handleCurrentActiveTokenCreationBlockNumber: () => undefined,
  handleCurrentActiveTokenAddress: () => undefined,
  handleCurrentActiveTokenSymbol: () => undefined,
  handleCurrentActiveTokenTotalSupplyThreshold: () => undefined,
  handleCurrentActiveTokenHasHitTotalSupplyThreshold: () => undefined,
  ...useReadTempTokenTxsInitial,
};

export const useReadTempTokenContextState = () => {
  const { userAddress, user } = useUser();
  const router = useRouter();

  const { channel, chat } = useChannelContext();
  const { channelQueryData, isOwner } = channel;
  const { addToChatbot: addToChatbotForTempToken } = chat;
  const { network } = useNetworkContext();
  const { localNetwork } = network;
  const publicClient = usePublicClient();

  // currentActiveTokenAddress is set on mount or by creation event
  const [currentActiveTokenAddress, setCurrentActiveTokenAddress] =
    useState<string>(NULL_ADDRESS);
  const [currentActiveTokenEndTimestamp, setCurrentActiveTokenEndTimestamp] =
    useState<bigint | undefined>(undefined);
  const [currentActiveTokenSymbol, setCurrentActiveTokenSymbol] =
    useState<string>("");
  const [
    currentActiveTokenCreationBlockNumber,
    setCurrentActiveTokenCreationBlockNumber,
  ] = useState<bigint>(BigInt(0));
  const [currentActiveTokenTotalSupply, setCurrentActiveTokenTotalSupply] =
    useState<bigint>(BigInt(0));
  const [
    currentActiveTokenHasHitTotalSupplyThreshold,
    setCurrentActiveTokenHasHitTotalSupplyThreshold,
  ] = useState<boolean>(false);
  const [
    currentActiveTokenTotalSupplyThreshold,
    setCurrentActiveTokenTotalSupplyThreshold,
  ] = useState<bigint>(BigInt(0));
  const [
    currentActiveTokenIsAlwaysTradable,
    setCurrentActiveTokenIsAlwaysTradable,
  ] = useState<boolean>(false);
  const [
    currentActiveTokenHighestTotalSupply,
    setCurrentActiveTokenHighestTotalSupply,
  ] = useState<bigint>(BigInt(0));

  const [lastInactiveTokenAddress, setLastInactiveTokenAddress] =
    useState<string>(NULL_ADDRESS);
  const [lastInactiveTokenBalance, setLastInactiveTokenBalance] =
    useState<bigint>(BigInt(0));
  const [lastInactiveTokenSymbol, setLastInactiveTokenSymbol] =
    useState<string>("");

  const [isPermanentGameModalOpen, setIsPermanentGameModalOpen] =
    useState<boolean>(false); // when the token becomes always tradeable
  const [isSuccessGameModalOpen, setIsSuccessGameModalOpen] =
    useState<boolean>(false); // when the token hits the total supply threshold
  const [isFailedGameModalOpen, setIsFailedGameModalOpen] =
    useState<boolean>(false); // when the token expires via countdown

  const [isPermanentGameState, setIsPermanentGameState] =
    useState<boolean>(false); // when the token becomes always tradeable
  const [isSuccessGameState, setIsGameSuccessState] = useState<boolean>(false); // when the token hits the total supply threshold
  const [isFailedGameState, setIsFailedGameState] = useState<boolean>(false); // when the token expires via countdown
  const [canPlayToken, setCanPlayToken] = useState(false);

  const { postTempToken } = usePostTempToken({});

  const factoryContract = getContractFromNetwork(
    Contract.TEMP_TOKEN_FACTORY_V1,
    localNetwork
  );

  const tempTokenContract: ContractData = useMemo(() => {
    if (currentActiveTokenAddress === NULL_ADDRESS) {
      return {
        address: NULL_ADDRESS,
        abi: undefined,
        chainId: localNetwork.config.chainId,
      };
    }
    return {
      address: currentActiveTokenAddress as `0x${string}`,
      abi: TempTokenAbi,
      chainId: localNetwork.config.chainId,
    };
  }, [currentActiveTokenAddress, localNetwork.config.chainId]);

  const lastInactiveTempTokenContract: ContractData = useMemo(() => {
    if (lastInactiveTokenAddress === NULL_ADDRESS) {
      return {
        address: NULL_ADDRESS,
        abi: undefined,
        chainId: localNetwork.config.chainId,
      };
    }
    return {
      address: lastInactiveTokenAddress as `0x${string}`,
      abi: TempTokenAbi,
      chainId: localNetwork.config.chainId,
    };
  }, [lastInactiveTokenAddress, localNetwork.config.chainId]);

  const baseClient = useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: http(
          "https://base-mainnet.g.alchemy.com/v2/aR93M6MdEC4lgh4VjPXLaMnfBveve1fC"
        ),
      }),
    []
  );

  /**
   * functions to run when specific events are detected, not exposed outside of this hook,
   */
  const onMintEvent = useCallback(
    async (totalSupply: bigint, highestTotalSupply: bigint) => {
      setCurrentActiveTokenTotalSupply(totalSupply);
      setCurrentActiveTokenHighestTotalSupply(highestTotalSupply);
    },
    []
  );

  const onBurnEvent = useCallback(async (totalSupply: bigint) => {
    setCurrentActiveTokenTotalSupply(totalSupply);
  }, []);

  const onReachThresholdEvent = useCallback(async (newEndTimestamp: bigint) => {
    setCurrentActiveTokenHasHitTotalSupplyThreshold(true);
    setCurrentActiveTokenEndTimestamp(newEndTimestamp);
    handleIsGameSuccess(true);
    handleIsSuccessGameModalOpen(true);
  }, []);

  const onDurationIncreaseEvent = useCallback(
    async (newEndTimestamp: bigint) => {
      if (isOwner && router.pathname.startsWith("/channels")) {
        const title = `The $${currentActiveTokenSymbol} token's time has been extended!`;
        addToChatbotForTempToken({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.TEMP_TOKEN_DURATION_INCREASED,
          title,
          description: "",
        });
      }
      setCurrentActiveTokenEndTimestamp(newEndTimestamp);
    },
    [
      isOwner,
      userAddress,
      user,
      currentActiveTokenSymbol,
      addToChatbotForTempToken,
      router.pathname,
    ]
  );

  const onAlwaysTradeableEvent = useCallback(async () => {
    if (isOwner && router.pathname.startsWith("/channels")) {
      const title = `The $${currentActiveTokenSymbol} token is now permanently tradeable!`;
      addToChatbotForTempToken({
        username: user?.username ?? "",
        address: userAddress ?? "",
        taskType: InteractionType.TEMP_TOKEN_BECOMES_ALWAYS_TRADEABLE,
        title,
        description: "",
      });
    }
    setCurrentActiveTokenIsAlwaysTradable(true);
    handleIsGamePermanent(true);
    handleIsPermanentGameModalOpen(true);
  }, [
    isOwner,
    userAddress,
    user,
    currentActiveTokenSymbol,
    addToChatbotForTempToken,
    router.pathname,
  ]);

  const onThresholdUpdateEvent = useCallback(
    async (newThreshold: bigint) => {
      if (isOwner && router.pathname.startsWith("/channels")) {
        const title = `The $${currentActiveTokenSymbol} token's price goal is increased!`;
        addToChatbotForTempToken({
          username: user?.username ?? "",
          address: userAddress ?? "",
          taskType: InteractionType.TEMP_TOKEN_THRESHOLD_INCREASED,
          title,
          description: "",
        });
      }
      setCurrentActiveTokenTotalSupplyThreshold(newThreshold);
      setCurrentActiveTokenHasHitTotalSupplyThreshold(false);
    },
    [
      isOwner,
      userAddress,
      user,
      currentActiveTokenSymbol,
      addToChatbotForTempToken,
      router.pathname,
    ]
  );

  /**
   * function to run when sending remaining funds to winner
   * ideally to be called on an inactive token to reset the state and allow for normal token creation flow
   * but if a current token had just turned inactive and the funds have or have not been sent, what does the ui look like?
   */
  const onSendRemainingFundsToWinnerEvent = useCallback(
    async (tokenAddress: string, tokenIsCurrentlyActive: boolean) => {
      if (
        tokenIsCurrentlyActive &&
        isAddressEqual(
          tokenAddress as `0x${string}`,
          currentActiveTokenAddress as `0x${string}`
        )
      ) {
        setCurrentActiveTokenSymbol("");
        setCurrentActiveTokenAddress(NULL_ADDRESS);
        setCurrentActiveTokenEndTimestamp(undefined);
        setCurrentActiveTokenTotalSupply(BigInt(0));
        setCurrentActiveTokenHasHitTotalSupplyThreshold(false);
        setCurrentActiveTokenTotalSupplyThreshold(BigInt(0));
        setCurrentActiveTokenIsAlwaysTradable(false);
        setCurrentActiveTokenHighestTotalSupply(BigInt(0));
        setCurrentActiveTokenCreationBlockNumber(BigInt(0));
      }
      if (
        !tokenIsCurrentlyActive &&
        isAddressEqual(
          tokenAddress as `0x${string}`,
          lastInactiveTokenAddress as `0x${string}`
        )
      ) {
        setLastInactiveTokenAddress(NULL_ADDRESS);
        setLastInactiveTokenBalance(BigInt(0));
        setLastInactiveTokenSymbol("");
      }
    },
    [currentActiveTokenAddress, lastInactiveTokenAddress]
  );

  const readTempTokenTxs = useReadTempTokenTxs({
    tokenCreationBlockNumber: currentActiveTokenCreationBlockNumber,
    tokenSymbol: currentActiveTokenSymbol,
    baseClient,
    tempTokenContract,
    onMintCallback: onMintEvent,
    onBurnCallback: onBurnEvent,
  });

  useReadTempTokenExternalEventListeners({
    tempTokenContract,
    onReachThresholdCallback: onReachThresholdEvent,
    onDurationIncreaseCallback: onDurationIncreaseEvent,
    onAlwaysTradeableCallback: onAlwaysTradeableEvent,
    onThresholdUpdateCallback: onThresholdUpdateEvent,
    onSendRemainingFundsToWinnerCallback: onSendRemainingFundsToWinnerEvent,
  });

  /**
   * read for channel's temp token data on mount
   */
  const [getTempTokensQuery] = useLazyQuery<GetTempTokensQuery>(
    GET_TEMP_TOKENS_QUERY,
    {
      fetchPolicy: "network-only",
    }
  );

  const { updateTempTokenHasRemainingFundsForCreator } =
    useUpdateTempTokenHasRemainingFundsForCreator({});

  useEffect(() => {
    const init = async () => {
      if (!(Number(channelQueryData?.id ?? "0") > 0)) return;
      try {
        const getTempTokenQueryRes = await getTempTokensQuery({
          variables: {
            data: {
              channelId: Number(channelQueryData?.id ?? "0"),
              chainId: localNetwork.config.chainId,
              tokenType: TempTokenType.SingleMode,
              factoryAddress: factoryContract.address as `0x${string}`,
              fulfillAllNotAnyConditions: true,
            },
          },
        });
        const listOfTokens = getTempTokenQueryRes.data?.getTempTokens;
        const nonNullListOfTokens = listOfTokens?.filter(
          (token): token is TempToken => token !== null
        );
        const activeTokens = nonNullListOfTokens?.filter(
          (token) => token.endUnixTimestamp > Math.floor(Date.now() / 1000)
        );
        const latestActiveToken = activeTokens?.[0];
        if (latestActiveToken) {
          setCurrentActiveTokenCreationBlockNumber(
            BigInt(latestActiveToken.creationBlockNumber)
          );
          setCurrentActiveTokenSymbol(latestActiveToken.symbol);
          const [
            endTimestamp,
            totalSupply,
            highestTotalSupply,
            totalSupplyThreshold,
            isAlwaysTradeable,
            hasHitTotalSupplyThreshold,
          ] = await Promise.all([
            publicClient.readContract({
              address: latestActiveToken.tokenAddress as `0x${string}`,
              abi: TempTokenAbi,
              functionName: "endTimestamp",
            }),
            publicClient.readContract({
              address: latestActiveToken.tokenAddress as `0x${string}`,
              abi: TempTokenAbi,
              functionName: "totalSupply",
            }),
            publicClient.readContract({
              address: latestActiveToken.tokenAddress as `0x${string}`,
              abi: TempTokenAbi,
              functionName: "highestTotalSupply",
            }),
            publicClient.readContract({
              address: latestActiveToken.tokenAddress as `0x${string}`,
              abi: TempTokenAbi,
              functionName: "totalSupplyThreshold",
            }),
            publicClient.readContract({
              address: latestActiveToken.tokenAddress as `0x${string}`,
              abi: TempTokenAbi,
              functionName: "isAlwaysTradeable",
            }),
            publicClient.readContract({
              address: latestActiveToken.tokenAddress as `0x${string}`,
              abi: TempTokenAbi,
              functionName: "hasHitTotalSupplyThreshold",
            }),
          ]);
          console.log(
            "latestActiveToken",
            latestActiveToken,
            endTimestamp,
            totalSupply,
            highestTotalSupply,
            totalSupplyThreshold,
            isAlwaysTradeable,
            hasHitTotalSupplyThreshold
          );
          setCurrentActiveTokenEndTimestamp(BigInt(String(endTimestamp)));
          setCurrentActiveTokenAddress(latestActiveToken.tokenAddress);
          setCurrentActiveTokenTotalSupply(BigInt(String(totalSupply)));
          setCurrentActiveTokenTotalSupplyThreshold(
            BigInt(String(totalSupplyThreshold))
          );
          setCurrentActiveTokenIsAlwaysTradable(Boolean(isAlwaysTradeable));
          setCurrentActiveTokenHasHitTotalSupplyThreshold(
            Boolean(hasHitTotalSupplyThreshold)
          );
          setCurrentActiveTokenHighestTotalSupply(
            BigInt(String(highestTotalSupply))
          );
        }
      } catch (e) {
        console.error("getTempTokensQuery", e);
      }
    };
    init();
  }, [channelQueryData?.id, localNetwork.config.chainId]);

  useEffect(() => {
    const init = async () => {
      if (Number(channelQueryData?.id ?? "0") > 0 && isOwner) {
        const res = await updateTempTokenHasRemainingFundsForCreator({
          channelId: Number(channelQueryData?.id ?? "0"),
          chainId: localNetwork.config.chainId,
          tokenType: TempTokenType.SingleMode,
        });
        const tempTokensWithNonZeroBalances = res?.res;

        const nonNullListOfTokensWithNonZeroBalances =
          tempTokensWithNonZeroBalances?.filter(
            (token): token is TempTokenWithBalance => token !== null
          );
        if (
          nonNullListOfTokensWithNonZeroBalances &&
          nonNullListOfTokensWithNonZeroBalances.length > 0 &&
          isOwner
        ) {
          const lastInactiveTokenWithBalance =
            nonNullListOfTokensWithNonZeroBalances[0];
          if (lastInactiveTokenWithBalance.isAlwaysTradeable) return;
          setLastInactiveTokenAddress(
            lastInactiveTokenWithBalance.tokenAddress
          );
          setLastInactiveTokenSymbol(lastInactiveTokenWithBalance.symbol);
          setLastInactiveTokenBalance(
            BigInt(lastInactiveTokenWithBalance.balance)
          );
        }
      }
    };
    init();
  }, [channelQueryData?.id, localNetwork.config.chainId, isOwner]);

  const handleCanPlayToken = useCallback((value: boolean) => {
    setCanPlayToken(value);
  }, []);

  /**
   * functions to handle the state of the game when game is over
   */

  const handleIsGamePermanent = useCallback((value: boolean) => {
    setIsPermanentGameState(value);
  }, []);

  const handleIsGameSuccess = useCallback((value: boolean) => {
    setIsGameSuccessState(value);
  }, []);

  const handleIsGameFailed = useCallback((value: boolean) => {
    setIsFailedGameState(value);
  }, []);

  /**
   * functions to handle the modals for when game is over
   */

  const handleIsPermanentGameModalOpen = useCallback((value: boolean) => {
    setIsPermanentGameModalOpen(value);
  }, []);

  const handleIsSuccessGameModalOpen = useCallback((value: boolean) => {
    setIsSuccessGameModalOpen(value);
  }, []);

  const handleIsFailedGameModalOpen = useCallback((value: boolean) => {
    setIsFailedGameModalOpen(value);
  }, []);

  const handleCurrentActiveTokenEndTimestamp = useCallback((value: bigint) => {
    setCurrentActiveTokenEndTimestamp(value);
  }, []);

  const handleCurrentActiveTokenCreationBlockNumber = useCallback(
    (value: bigint) => {
      setCurrentActiveTokenCreationBlockNumber(value);
    },
    []
  );

  const handleCurrentActiveTokenAddress = useCallback((value: string) => {
    setCurrentActiveTokenAddress(value);
  }, []);

  const handleCurrentActiveTokenSymbol = useCallback((value: string) => {
    setCurrentActiveTokenSymbol(value);
  }, []);

  const handleCurrentActiveTokenTotalSupplyThreshold = useCallback(
    (value: bigint) => {
      setCurrentActiveTokenTotalSupplyThreshold(value);
    },
    []
  );

  const handleCurrentActiveTokenHasHitTotalSupplyThreshold = useCallback(
    (value: boolean) => {
      setCurrentActiveTokenHasHitTotalSupplyThreshold(value);
    },
    []
  );

  return {
    currentActiveTokenSymbol,
    currentActiveTokenAddress,
    currentActiveTokenEndTimestamp,
    currentActiveTokenTotalSupply,
    currentActiveTokenHasHitTotalSupplyThreshold,
    currentActiveTokenTotalSupplyThreshold,
    currentActiveTokenIsAlwaysTradable,
    currentActiveTokenHighestTotalSupply,
    currentActiveTokenCreationBlockNumber,
    lastInactiveTokenAddress,
    lastInactiveTokenBalance,
    lastInactiveTokenSymbol,
    currentTempTokenContract: tempTokenContract,
    isPermanentGameModalOpen,
    isSuccessGameModalOpen,
    isFailedGameModalOpen,
    isPermanentGameState,
    isSuccessGameState,
    isFailedGameState,
    canPlayToken,
    onMintEvent,
    onBurnEvent,
    onReachThresholdEvent,
    onDurationIncreaseEvent,
    onAlwaysTradeableEvent,
    onThresholdUpdateEvent,
    onSendRemainingFundsToWinnerEvent,
    handleIsGamePermanent,
    handleIsGameSuccess,
    handleIsGameFailed,
    handleIsPermanentGameModalOpen,
    handleIsSuccessGameModalOpen,
    handleIsFailedGameModalOpen,
    handleCanPlayToken,
    handleCurrentActiveTokenEndTimestamp,
    handleCurrentActiveTokenCreationBlockNumber,
    handleCurrentActiveTokenAddress,
    handleCurrentActiveTokenSymbol,
    handleCurrentActiveTokenTotalSupplyThreshold,
    handleCurrentActiveTokenHasHitTotalSupplyThreshold,
    ...readTempTokenTxs,
  };
};
