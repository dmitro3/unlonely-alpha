import {
  Flex,
  Input,
  Button,
  Box,
  useToast,
  Text,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@chakra-ui/react";
import { useState, useMemo, useRef, useEffect } from "react";
import { formatUnits, isAddress } from "viem";
import Link from "next/link";
import { useBalance } from "wagmi";

import {
  CHAKRA_UI_TX_TOAST_DURATION,
  Contract,
  DEFAULT_TOKEN_TRADE_AMOUNT,
  InteractionType,
  NULL_ADDRESS,
} from "../../../constants";
import {
  useGetMintCostAfterFees,
  useMint,
  useBurn,
  useReadPublic,
  useGetBurnProceedsAfterFees,
} from "../../../hooks/contracts/legacy/useVibesToken";
import useDebounce from "../../../hooks/internal/useDebounce";
import centerEllipses from "../../../utils/centerEllipses";
import {
  filteredInput,
  formatIncompleteNumber,
} from "../../../utils/validation/input";
import { useChannelContext } from "../../../hooks/context/useChannel";
import { useNetworkContext } from "../../../hooks/context/useNetwork";
import { useUser } from "../../../hooks/context/useUser";
import {
  getContractFromNetwork,
  returnDecodedTopics,
} from "../../../utils/contract";
import { truncateValue } from "../../../utils/tokenDisplayFormatting";
import useUserAgent from "../../../hooks/internal/useUserAgent";
import { useVibesContext } from "../../../hooks/context/useVibes";
import { safeIncludes } from "../../../utils/safeFunctions";

export const mintErrors: { [key: string]: string } = {
  InsufficientValue:
    "The price you want to buy at has changed, please try again",
  EtherTransferFailed: "An internal transfer of ETH failed, please try again",
};

export const burnErrors: { [key: string]: string } = {
  BurnAmountTooHigh: "You are trying to sell more than what you actually have",
  EtherTransferFailed: "An internal transfer of ETH failed, please try again",
};

const VibesTokenExchange = ({ isFullChart }: { isFullChart?: boolean }) => {
  const { isStandalone } = useUserAgent();
  const { wagmiAddress, user } = useUser();
  const { vibesTokenTxs, userVibesBalance } = useVibesContext();
  const toast = useToast();
  const { network } = useNetworkContext();
  const { matchingChain, localNetwork, explorerUrl } = network;
  const contract = getContractFromNetwork(
    Contract.VIBES_TOKEN_V1,
    localNetwork
  );
  const { chat, channel } = useChannelContext();
  const { channelQueryData } = channel;
  const { addToChatbot } = chat;

  const [amountOfVibes, setAmountOfVibes] = useState<string>(
    String(DEFAULT_TOKEN_TRADE_AMOUNT)
  );
  const debouncedAmountOfVotes = useDebounce(amountOfVibes, 300);
  const amount_votes_bigint = useMemo(
    () => BigInt(debouncedAmountOfVotes as `${number}`),
    [debouncedAmountOfVotes]
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const canAddToChatbot_mint = useRef(false);
  const canAddToChatbot_burn = useRef(false);
  const isFetching = useRef(false);
  const {
    mintCostAfterFees,
    refetch: refetchMintCostAfterFees,
    loading: mintCostAfterFeesLoading,
  } = useGetMintCostAfterFees(amount_votes_bigint, contract);

  const { data: userEthBalance, refetch: refetchUserEthBalance } = useBalance({
    address: isAddress(user?.address as `0x${string}`)
      ? (user?.address as `0x${string}`)
      : NULL_ADDRESS,
  });

  const { protocolFeeDestination, refetch: refetchDest } =
    useReadPublic(contract);

  const {
    burnProceedsAfterFees,
    refetch: refetchBurnProceedsAfterFees,
    loading: burnProceedsAfterFeesLoading,
  } = useGetBurnProceedsAfterFees(amount_votes_bigint, contract);

  const {
    mint,
    refetch: refetchMint,
    isRefetchingMint,
  } = useMint(
    {
      streamer:
        isAddress(channelQueryData?.owner?.address as `0x${string}`) &&
        channelQueryData?.owner?.address
          ? channelQueryData?.owner?.address
          : protocolFeeDestination,
      amount: amount_votes_bigint,
      value: mintCostAfterFees,
    },
    contract,
    {
      onWriteSuccess: (data: any) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.hash}`}
                passHref
              >
                mint pending, click to view
              </Link>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        canAddToChatbot_mint.current = true;
      },
      onWriteError: (error: any) => {
        console.log("mint write error", error);
        toast({
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              mint cancelled
            </Box>
          ),
        });
        canAddToChatbot_mint.current = false;
      },
      onTxSuccess: async (data: any) => {
        if (!canAddToChatbot_mint.current) return;
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                mint success, click to view
              </Link>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        if (channelQueryData) {
          const topics = returnDecodedTopics(data.logs, contract.abi, "Mint");
          if (!topics) {
            canAddToChatbot_mint.current = false;
            return;
          }
          const args: any = topics.args;
          const title = `${
            user?.username ?? centerEllipses(args.account as `0x${string}`, 15)
          } bought ${Number(args.amount as bigint)} $VIBES!`;
          addToChatbot({
            username: user?.username ?? "",
            address: user?.address ?? "",
            taskType: InteractionType.BUY_VIBES,
            title,
            description: JSON.stringify({
              userAddress: user?.address ?? "",
              amount: Number(args.amount as bigint),
            }),
          });
        }
        canAddToChatbot_mint.current = false;
        setAmountOfVibes(String(DEFAULT_TOKEN_TRADE_AMOUNT));
      },
      onTxError: (error: any) => {
        console.log("mint error", error);
        let message =
          "Unknown error, please check the explorer for more details";
        Object.keys(mintErrors).forEach((key) => {
          if (safeIncludes(String(error), key)) {
            message = mintErrors[key];
          }
        });
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" p={2}>
              <Flex direction="column">
                <Text>mint error</Text>
                <Text fontSize="15px">{message}</Text>
              </Flex>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        canAddToChatbot_mint.current = false;
      },
    }
  );

  const {
    burn,
    refetch: refetchBurn,
    isRefetchingBurn,
  } = useBurn(
    {
      streamer:
        isAddress(channelQueryData?.owner?.address as `0x${string}`) &&
        channelQueryData?.owner?.address
          ? channelQueryData?.owner?.address
          : protocolFeeDestination,
      amount: amount_votes_bigint,
    },
    contract,
    {
      onWriteSuccess: (data: any) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.hash}`}
                passHref
              >
                burn pending, click to view
              </Link>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        canAddToChatbot_burn.current = true;
      },
      onWriteError: (error: any) => {
        console.log("burn write error", error);
        toast({
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              burn cancelled
            </Box>
          ),
        });
        canAddToChatbot_burn.current = false;
      },
      onTxSuccess: async (data: any) => {
        if (!canAddToChatbot_burn.current) return;
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                burn success, click to view
              </Link>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        const topics = returnDecodedTopics(data.logs, contract.abi, "Burn");
        if (!topics) {
          canAddToChatbot_burn.current = false;
          return;
        }
        const args: any = topics.args;
        const title = `${
          user?.username ?? centerEllipses(args.account as `0x${string}`, 15)
        } sold ${Number(args.amount as bigint)} $VIBES!`;
        addToChatbot({
          username: user?.username ?? "",
          address: user?.address ?? "",
          taskType: InteractionType.SELL_VIBES,
          title,
          description: JSON.stringify({
            userAddress: user?.address ?? "",
            amount: Number(args.amount as bigint),
          }),
        });
        canAddToChatbot_burn.current = false;
        setAmountOfVibes(String(DEFAULT_TOKEN_TRADE_AMOUNT));
      },
      onTxError: (error: any) => {
        console.log("burn error", error);
        let message =
          "Unknown error, please check the explorer for more details";
        Object.keys(burnErrors).forEach((key) => {
          if (safeIncludes(String(error), key)) {
            message = burnErrors[key];
          }
        });
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" p={2}>
              <Flex direction="column">
                <Text>burn error</Text>
                <Text fontSize="15px">{message}</Text>
              </Flex>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        canAddToChatbot_burn.current = false;
      },
    }
  );

  const handleInputChange = (event: any) => {
    const input = event.target.value;
    const filtered = filteredInput(input);
    setAmountOfVibes(filtered);
  };

  useEffect(() => {
    if (
      vibesTokenTxs.length === 0 ||
      isFetching.current ||
      !contract.address ||
      !user?.address ||
      !wagmiAddress
    )
      return;
    const fetch = async () => {
      isFetching.current = true;
      const startTime = Date.now();
      console.log("vibesTokenInterface, fetching", startTime);
      let endTime = 0;
      try {
        await Promise.all([
          refetchMint(),
          refetchBurn(),
          refetchMintCostAfterFees(),
          refetchBurnProceedsAfterFees(),
          refetchUserEthBalance(),
          refetchDest(),
        ]).then(() => {
          endTime = Date.now();
        });
      } catch (err) {
        endTime = Date.now();
        console.log("vibes fetching error", err);
      }
      console.log("vibesTokenInterface, fetched", endTime);
      const MILLIS = 0;
      const timeToWait =
        endTime >= startTime + MILLIS ? 0 : MILLIS - (endTime - startTime);
      await new Promise((resolve) => {
        setTimeout(resolve, timeToWait);
      });
      isFetching.current = false;
    };
    fetch();
  }, [vibesTokenTxs.length]);

  useEffect(() => {
    if (!matchingChain) {
      setErrorMessage("wrong network");
    } else if (Number(formatIncompleteNumber(amountOfVibes)) <= 0) {
      setErrorMessage("enter amount");
    } else if (
      userEthBalance?.value &&
      mintCostAfterFees > userEthBalance?.value
    ) {
      setErrorMessage("insufficient ETH");
    } else {
      setErrorMessage("");
    }
  }, [matchingChain, amountOfVibes, userEthBalance?.value, mintCostAfterFees]);

  return (
    <Flex direction="column" justifyContent={"flex-end"} gap="10px">
      <Flex position="relative" gap="5px" alignItems={"center"}>
        <Tooltip
          label={errorMessage}
          placement="bottom-start"
          isOpen={errorMessage !== undefined}
          bg="red.600"
        >
          <Input
            variant={errorMessage.length > 0 ? "redGlow" : "glow"}
            textAlign="center"
            value={amountOfVibes}
            onChange={handleInputChange}
            mx="auto"
            p="1"
            fontSize={isStandalone ? "16px" : isFullChart ? "2rem" : "14px"}
          />
        </Tooltip>
        <Popover trigger="hover" placement="top" openDelay={500}>
          <PopoverTrigger>
            <Button
              bg={"#403c7d"}
              color="white"
              p={2}
              height={isFullChart ? "unset" : "20px"}
              _focus={{}}
              _active={{}}
              _hover={{
                bg: "#8884d8",
              }}
              onClick={() => {
                setAmountOfVibes(userVibesBalance.toString());
              }}
            >
              max
            </Button>
          </PopoverTrigger>
          <PopoverContent bg="#6c3daf" border="none" width="100%" p="2px">
            <PopoverArrow bg="#6c3daf" />
            <Text fontSize="12px" textAlign={"center"}>
              click to show max $VIBES u currently own
            </Text>
          </PopoverContent>
        </Popover>
      </Flex>
      <Flex gap="2px" justifyContent={"center"} direction="column">
        <Button
          color="white"
          _focus={{}}
          _hover={{}}
          _active={{}}
          bg="#46a800"
          isDisabled={
            !mint ||
            mintCostAfterFeesLoading ||
            Number(formatIncompleteNumber(amountOfVibes)) <= 0
          }
          onClick={mint}
          p={isFullChart ? "10%" : "0px"}
          w="100%"
        >
          <Flex direction="column">
            <Text fontSize={isFullChart ? "25px" : "unset"}>BUY</Text>
            <Text
              fontSize={isFullChart || isStandalone ? "unset" : "12px"}
              noOfLines={1}
              color="#eeeeee"
            >
              {`(${truncateValue(formatUnits(mintCostAfterFees, 18), 4)} ETH)`}
            </Text>
          </Flex>
        </Button>
        <Button
          color="white"
          _focus={{}}
          _hover={{}}
          _active={{}}
          bg="#fe2815"
          isDisabled={
            !burn ||
            burnProceedsAfterFeesLoading ||
            Number(formatIncompleteNumber(amountOfVibes)) <= 0
          }
          onClick={burn}
          p={isFullChart ? "10%" : undefined}
          w="100%"
        >
          <Flex direction="column">
            <Text fontSize={isFullChart ? "25px" : "unset"}>SELL</Text>
            <Text
              fontSize={isFullChart || isStandalone ? "unset" : "12px"}
              noOfLines={1}
              color="#eeeeee"
            >
              {`(${truncateValue(
                formatUnits(burnProceedsAfterFees, 18),
                4
              )} ETH)`}
            </Text>
          </Flex>
        </Button>
      </Flex>
    </Flex>
  );
};

export default VibesTokenExchange;
