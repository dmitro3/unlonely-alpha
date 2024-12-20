import {
  Modal,
  ModalOverlay,
  ModalContent,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  Image,
  Tooltip,
  useToast,
  Box,
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { formatUnits, isAddress } from "viem";
import {
  AblyChannelPromise,
  CHAKRA_UI_TX_TOAST_DURATION,
  CHANGE_USER_ROLE_EVENT,
  TOKEN_TRANSFER_EVENT,
} from "../../constants";
import { useCacheContext } from "../../hooks/context/useCache";
import { useChannelContext } from "../../hooks/context/useChannel";
import { useNetworkContext } from "../../hooks/context/useNetwork";
import { useUser } from "../../hooks/context/useUser";
import useUserAgent from "../../hooks/internal/useUserAgent";
import usePostUserRoleForChannel from "../../hooks/server/channel/usePostUserRoleForChannel";
import centerEllipses from "../../utils/centerEllipses";
import {
  filteredInput,
  formatIncompleteNumber,
} from "../../utils/validation/input";
import { useGetUserBalance, useTransfer } from "../../hooks/contracts/useToken";
import Link from "next/link";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import { useTempTokenContext } from "../../hooks/context/useTempToken";
import { bondingCurveBigInt } from "../../utils/contract";
import { SelectedUser } from "../../constants/types/chat";
import { areAddressesEqual } from "../../utils/validation/wallet";

export const ChatUserModal_token = ({
  isOpen,
  channel,
  handleClose,
  targetUser,
}: {
  isOpen: boolean;
  channel: AblyChannelPromise;
  handleClose: () => void;
  targetUser?: SelectedUser;
}) => {
  const { user } = useUser();
  const { isStandalone } = useUserAgent();
  const { channel: c } = useChannelContext();
  const { channelQueryData, channelRoles } = c;
  const { tempToken } = useTempTokenContext();
  const {
    userTempTokenBalance,
    tempTokenTxs,
    gameState,
    currentTempTokenContract,
  } = tempToken;
  const { currentActiveTokenSymbol, currentActiveTokenMinBaseTokenPrice } =
    gameState;
  const { network } = useNetworkContext();
  const { matchingChain, explorerUrl } = network;
  const { ethPriceInUsd } = useCacheContext();

  const [isBanning, setIsBanning] = useState<boolean>(false);
  const [isAppointing, setIsAppointing] = useState<boolean>(false);
  const [isRemovingModerator, setIsRemovingModerator] =
    useState<boolean>(false);
  const [isSendingTokens, setIsSendingTokens] = useState<boolean>(false);
  const [amountToSend, setAmountToSend] = useState<string>("10");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const toast = useToast();

  const { transfer, refetch: refetchTransfer } = useTransfer(
    {
      to: targetUser?.address as `0x${string}`,
      amount: BigInt(amountToSend),
    },
    currentTempTokenContract,
    {
      onWriteSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.hash}`}
                passHref
              >
                transfer tokens pending, click to view
              </Link>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
      },
      onWriteError: (error) => {
        toast({
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              transfer tokens cancelled
            </Box>
          ),
        });
      },
      onTxSuccess: async (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                transfer tokens success, click to view
              </Link>
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
        channel.publish({
          name: TOKEN_TRANSFER_EVENT,
          data: {
            body: JSON.stringify({
              from: user?.address,
              to: targetUser?.address,
              amount: Number(amountToSend),
              symbol: currentActiveTokenSymbol,
            }),
          },
        });
        setAmountToSend("10");
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              transfer tokens error
            </Box>
          ),
          duration: CHAKRA_UI_TX_TOAST_DURATION, // chakra ui toast duration
          isClosable: true,
          position: "bottom", // chakra ui toast position
        });
      },
    }
  );

  const { balance: targetTokensBalance, refetch: refetchTargetTokensBalance } =
    useGetUserBalance(
      targetUser?.address as `0x${string}`,
      currentTempTokenContract
    );

  const { postUserRoleForChannel, loading } = usePostUserRoleForChannel({
    onError: (error) => {
      console.log(error);
    },
  });

  const userIsChannelOwner = useMemo(
    () =>
      areAddressesEqual(
        user?.address ?? "",
        channelQueryData?.owner?.address ?? ""
      ),
    [user, channelQueryData]
  );

  const userIsModerator = useMemo(
    () =>
      channelRoles?.some((m) => m?.address === user?.address && m?.role === 2),
    [user, channelRoles]
  );

  const isNormalUi = useMemo(() => {
    return !isBanning && !isAppointing && !isRemovingModerator;
  }, [isBanning, isAppointing, isRemovingModerator]);

  const previewedBurnProceeds = useMemo(() => {
    return tempTokenTxs.length > 0
      ? Number(
          formatUnits(
            calculateBurnProceeds(
              tempTokenTxs[tempTokenTxs.length - 1].supply,
              BigInt(amountToSend),
              currentActiveTokenMinBaseTokenPrice
            ),
            18
          )
        )
      : 0;
  }, [tempTokenTxs, amountToSend, currentActiveTokenMinBaseTokenPrice]);

  const appoint = async () => {
    await postUserRoleForChannel({
      channelId: channelQueryData?.id,
      userAddress: targetUser?.address,
      role: 2,
    });
    channel.publish({
      name: CHANGE_USER_ROLE_EVENT,
      data: {
        body: JSON.stringify({
          address: targetUser?.address,
          role: 2,
          isAdding: true,
        }),
      },
    });
    handleClose();
  };

  const ban = async () => {
    await postUserRoleForChannel({
      channelId: channelQueryData?.id,
      userAddress: targetUser?.address,
      role: 1,
    });
    channel.publish({
      name: CHANGE_USER_ROLE_EVENT,
      data: {
        body: JSON.stringify({
          address: targetUser?.address,
          role: 1,
          isAdding: true,
        }),
      },
    });
    handleClose();
  };

  const removeAsModerator = async () => {
    await postUserRoleForChannel({
      channelId: channelQueryData?.id,
      userAddress: targetUser?.address,
      role: 2,
    });
    channel.publish({
      name: CHANGE_USER_ROLE_EVENT,
      data: {
        body: JSON.stringify({
          address: targetUser?.address,
          role: 2,
          isAdding: false,
        }),
      },
    });
    handleClose();
  };

  useEffect(() => {
    const init = async () => {
      let calls: any[] = [];
      if (
        isOpen &&
        targetUser !== undefined &&
        isAddress(targetUser.address as `0x${string}`)
      ) {
        calls = calls.concat([refetchTargetTokensBalance()]);
      }
      if (user) {
        calls = calls.concat([refetchTransfer()]);
      }
      try {
        await Promise.all(calls);
      } catch (err) {
        console.log("cannot fetch temp token balance data", err);
      }
    };
    init();
  }, [targetUser, isOpen, user]);

  useEffect(() => {
    const init = async () => {
      if (
        userTempTokenBalance > BigInt(0) &&
        isOpen &&
        targetUser !== undefined &&
        isAddress(targetUser.address as `0x${string}`)
      ) {
        await Promise.all([refetchTargetTokensBalance(), refetchTransfer()]);
      }
    };
    init();
  }, [userTempTokenBalance]);

  const handleInputChange = (event: any) => {
    const input = event.target.value;
    const filtered = filteredInput(input);
    setAmountToSend(filtered);
  };

  useEffect(() => {
    if (!matchingChain) {
      setErrorMessage("wrong network");
    } else if (Number(formatIncompleteNumber(amountToSend)) <= 0) {
      setErrorMessage("enter amount first");
    } else if (Number(amountToSend) > Number(userTempTokenBalance.toString())) {
      setErrorMessage("insufficient tokens");
    } else {
      setErrorMessage("");
    }
  }, [matchingChain, userTempTokenBalance, amountToSend]);

  useEffect(() => {
    if (!isOpen) {
      setIsBanning(false);
      setIsAppointing(false);
      setIsRemovingModerator(false);
      setIsSendingTokens(false);
      setAmountToSend("10");
    }
  }, [isOpen]);

  return (
    <Modal
      isCentered
      isOpen={isOpen && targetUser !== undefined}
      onClose={handleClose}
    >
      <ModalOverlay backgroundColor="#282828e6" />
      {targetUser !== undefined && (
        <ModalContent
          maxW="500px"
          boxShadow="0px 8px 28px #0a061c40"
          padding="12px"
          borderRadius="5px"
          bg="#3A3A3A"
        >
          {isNormalUi && (
            <Flex direction="column" gap="10px">
              <Text
                _hover={{ cursor: "pointer" }}
                fontSize="16px"
                fontWeight="bold"
              >
                {targetUser.username
                  ? targetUser.username
                  : centerEllipses(targetUser.address, 10)}
                :
              </Text>
              <Link
                target="_blank"
                href={`${explorerUrl}/address/${
                  targetUser.address ? targetUser.address : ""
                }`}
                passHref
              >
                <Flex
                  alignItems={"center"}
                  gap="2px"
                  border={"1px #5590ff solid"}
                  borderRadius="15px"
                  justifyContent={"center"}
                >
                  <Text color="#c7dbff" fontSize="13px" noOfLines={1}>
                    {targetUser.address}
                  </Text>
                  <ExternalLinkIcon />
                </Flex>
              </Link>
              {targetUser.FCHandle && (
                <Link
                  target="_blank"
                  href={`https://warpcast.com//${targetUser.FCHandle}`}
                  passHref
                >
                  <Flex
                    alignItems={"center"}
                    gap="2px"
                    border={"1px #7c65c1 solid"}
                    borderRadius="15px"
                    justifyContent={"center"}
                  >
                    <Tooltip label="Farcaster profile">
                      <Image
                        display="inline-block"
                        verticalAlign="middle"
                        src="/images/farcaster_logo.png"
                        width="20px"
                        height="20px"
                        mr="5px"
                      />
                    </Tooltip>
                    <Text color="#c7dbff" fontSize="13px" noOfLines={1}>
                      {targetUser.FCHandle}
                    </Text>
                    <ExternalLinkIcon />
                  </Flex>
                </Link>
              )}
              <>
                {currentActiveTokenSymbol && (
                  <Flex justifyContent={"space-evenly"}>
                    {(isSendingTokens ||
                      targetUser.address === user?.address) && (
                      <Text color="#e5fc92">
                        your ${currentActiveTokenSymbol}:{" "}
                        <Text as="span" color="#e5fc92" fontWeight="bold">
                          {truncateValue(userTempTokenBalance.toString(), 4)}
                        </Text>
                      </Text>
                    )}
                    {targetUser.address !== user?.address && (
                      <Text color="#c6c3fc">
                        their ${currentActiveTokenSymbol}:{" "}
                        <Text as="span" color="#c6c3fc" fontWeight="bold">
                          {truncateValue(targetTokensBalance.toString(), 4)}
                        </Text>
                      </Text>
                    )}
                  </Flex>
                )}
              </>
              <Flex direction="column" gap="10px">
                {targetUser.address !== user?.address &&
                  isAddress(
                    currentTempTokenContract.address as `0x${string}`
                  ) && (
                    <>
                      {!isSendingTokens ? (
                        <Button
                          color="white"
                          mt="20px"
                          bg="#6862e9"
                          _hover={{}}
                          _focus={{}}
                          _active={{}}
                          onClick={() => setIsSendingTokens(true)}
                        >
                          send ${currentActiveTokenSymbol} to user
                        </Button>
                      ) : (
                        <Flex alignItems="center" gap="10px">
                          <Tooltip
                            label={errorMessage}
                            placement="bottom"
                            isOpen={errorMessage !== undefined}
                            bg="red.600"
                          >
                            <Input
                              variant={
                                errorMessage.length > 0 ? "redGlow" : "glow"
                              }
                              textAlign="center"
                              value={amountToSend}
                              onChange={handleInputChange}
                              fontSize={isStandalone ? "16px" : "unset"}
                              placeholder="enter amount to send"
                            />
                          </Tooltip>
                          <Flex direction="column">
                            <Text whiteSpace="nowrap">
                              ~$
                              {truncateValue(
                                previewedBurnProceeds * Number(ethPriceInUsd),
                                4
                              )}
                            </Text>
                            <Text
                              fontSize="10px"
                              color="#c6c3fc"
                              whiteSpace="nowrap"
                            >
                              ~{truncateValue(previewedBurnProceeds, 4)} ETH
                            </Text>
                          </Flex>
                          <Button
                            bg={"#5852a3"}
                            color="white"
                            p={2}
                            _focus={{}}
                            _active={{}}
                            _hover={{
                              bg: "#8884d8",
                            }}
                            isDisabled={errorMessage.length > 0 || !transfer}
                            onClick={transfer}
                          >
                            send
                          </Button>
                        </Flex>
                      )}
                    </>
                  )}
                {userIsChannelOwner &&
                  targetUser.address !== user?.address &&
                  !channelRoles.some(
                    (m) => m?.address === targetUser.address && m?.role === 2
                  ) &&
                  isNormalUi &&
                  !isSendingTokens && (
                    <Button
                      color="white"
                      bg="#074a84"
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={() => setIsAppointing(true)}
                    >
                      appoint user as chat moderator
                    </Button>
                  )}
                {userIsChannelOwner &&
                  targetUser.address !== user?.address &&
                  channelRoles.some(
                    (m) => m?.address === targetUser.address && m?.role === 2
                  ) &&
                  isNormalUi &&
                  !isSendingTokens && (
                    <Button
                      color="white"
                      bg="#dc5d0e"
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={() => setIsRemovingModerator(true)}
                    >
                      remove user as chat moderator
                    </Button>
                  )}
                {(userIsChannelOwner || userIsModerator) &&
                  targetUser.address !== channelQueryData?.owner?.address &&
                  targetUser.address !== user?.address &&
                  isNormalUi &&
                  !isSendingTokens && (
                    <>
                      {!channelRoles?.some(
                        (m) =>
                          m?.address === targetUser.address && m?.role === 2
                      ) ? (
                        <Button
                          color="white"
                          bg="#842007"
                          _hover={{}}
                          _focus={{}}
                          _active={{}}
                          onClick={() => setIsBanning(true)}
                        >
                          ban user from chat
                        </Button>
                      ) : (
                        <Text
                          textAlign={"center"}
                          fontSize="14px"
                          color="#db9719"
                        >
                          Cannot ban this user because they are a moderator,
                          remove their status first
                        </Text>
                      )}
                    </>
                  )}
              </Flex>
            </Flex>
          )}
          {isBanning && (
            <>
              {!loading ? (
                <Flex direction="column" gap="10px">
                  <Text textAlign="center">
                    are you sure you want to ban this user from chatting on your
                    channel and all their chat messages?
                  </Text>
                  <Flex justifyContent={"space-evenly"}>
                    <Button
                      color="white"
                      bg="#b12805"
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={ban}
                    >
                      yes, do it
                    </Button>
                    <Button
                      color="white"
                      opacity={"0.5"}
                      border={"1px solid white"}
                      bg={"transparent"}
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={() => setIsBanning(false)}
                    >
                      maybe not...
                    </Button>
                  </Flex>
                </Flex>
              ) : (
                <Flex justifyContent={"center"}>
                  <Spinner size="xl" />
                </Flex>
              )}
            </>
          )}
          {isAppointing && (
            <>
              {!loading ? (
                <Flex direction="column" gap="10px">
                  <Text textAlign="center">
                    are you sure you want to make this user a chat moderator?
                  </Text>
                  <Text textAlign="center" color="#8ced15">
                    you can always remove their status through the chat
                  </Text>
                  <Flex justifyContent={"space-evenly"}>
                    <Button
                      color="white"
                      bg="#054db1"
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={appoint}
                    >
                      yes, do it
                    </Button>
                    <Button
                      color="white"
                      opacity={"0.5"}
                      border={"1px solid white"}
                      bg={"transparent"}
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={() => setIsAppointing(false)}
                    >
                      maybe not...
                    </Button>
                  </Flex>
                </Flex>
              ) : (
                <Flex justifyContent={"center"}>
                  <Spinner size="xl" />
                </Flex>
              )}
            </>
          )}
          {isRemovingModerator && (
            <>
              {!loading ? (
                <Flex direction="column" gap="10px">
                  <Text textAlign="center">
                    are you sure you want to remove this user as a chat
                    moderator?
                  </Text>
                  <Flex justifyContent={"space-evenly"}>
                    <Button
                      color="white"
                      bg="#054db1"
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={removeAsModerator}
                    >
                      yes, do it
                    </Button>
                    <Button
                      color="white"
                      opacity={"0.5"}
                      border={"1px solid white"}
                      bg={"transparent"}
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={() => setIsRemovingModerator(false)}
                    >
                      maybe not...
                    </Button>
                  </Flex>
                </Flex>
              ) : (
                <Flex justifyContent={"center"}>
                  <Spinner size="xl" />
                </Flex>
              )}
            </>
          )}
        </ModalContent>
      )}
    </Modal>
  );
};

export const calculateBurnProceeds = (
  currentSupply: bigint,
  amountToBurn: bigint,
  minBaseTokenPrice: bigint
): bigint => {
  const newSupply =
    currentSupply - amountToBurn > BigInt(0)
      ? currentSupply - amountToBurn
      : BigInt(0);
  const priceForCurrent = bondingCurveBigInt(currentSupply);
  const priceForPrevious = bondingCurveBigInt(newSupply);
  const newPrice = priceForCurrent - priceForPrevious;

  // returns in wei
  return newPrice + BigInt(amountToBurn) * minBaseTokenPrice;
};
