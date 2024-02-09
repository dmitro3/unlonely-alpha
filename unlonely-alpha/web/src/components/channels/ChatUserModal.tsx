import {
  Modal,
  ModalOverlay,
  ModalContent,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  Tooltip,
  useToast,
  Box,
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { formatUnits, isAddress } from "viem";
import { useBalance } from "wagmi";
import { AblyChannelPromise, CHANGE_USER_ROLE_EVENT } from "../../constants";
import { NETWORKS } from "../../constants/networks";
import { useCacheContext } from "../../hooks/context/useCache";
import { useChannelContext } from "../../hooks/context/useChannel";
import { useNetworkContext } from "../../hooks/context/useNetwork";
import { useUser } from "../../hooks/context/useUser";
import useUserAgent from "../../hooks/internal/useUserAgent";
import usePostUserRoleForChannel from "../../hooks/server/usePostUserRoleForChannel";
import centerEllipses from "../../utils/centerEllipses";
import { getContractFromNetwork } from "../../utils/contract";
import {
  filteredInput,
  formatIncompleteNumber,
} from "../../utils/validation/input";
import { useTransfer } from "../../hooks/contracts/useVibesToken";
import Link from "next/link";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { truncateValue } from "../../utils/tokenDisplayFormatting";

export const ChatUserModal = ({
  isOpen,
  channel,
  handleClose,
  targetUser,
}: {
  isOpen: boolean;
  channel: AblyChannelPromise;
  handleClose: () => void;
  targetUser?: { address?: string; username?: string };
}) => {
  const { user } = useUser();
  const { isStandalone } = useUserAgent();
  const { channel: c } = useChannelContext();
  const { channelQueryData, channelRoles } = c;
  const { network } = useNetworkContext();
  const { matchingChain, explorerUrl } = network;
  const { vibesTokenTxs, userVibesBalance, ethPriceInUsd } = useCacheContext();

  const [isBanning, setIsBanning] = useState<boolean>(false);
  const [isAppointing, setIsAppointing] = useState<boolean>(false);
  const [isSendingVibes, setIsSendingVibes] = useState<boolean>(false);
  const [amountOfVibesToSend, setAmountOfVibesToSend] = useState<string>("10");
  const contract = getContractFromNetwork("vibesTokenV1", NETWORKS[0]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const toast = useToast();

  const { transfer, refetch: refetchTransfer } = useTransfer(
    {
      to: targetUser?.address as `0x${string}`,
      amount: BigInt(amountOfVibesToSend),
    },
    contract,
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
                transfer vibes pending, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
      onWriteError: (error) => {
        toast({
          duration: 9000,
          isClosable: true,
          position: "top-right",
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              transfer vibes cancelled
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
                transfer vibes success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setAmountOfVibesToSend("10");
      },
      onTxError: (error) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              transfer vibes error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
    }
  );

  const { data: targetVibesBalance, refetch: refetchTargetVibesBalance } =
    useBalance({
      address: targetUser?.address as `0x${string}`,
      token: contract.address,
      enabled: false,
    });

  const { postUserRoleForChannel, loading } = usePostUserRoleForChannel({
    onError: (error) => {
      console.log(error);
    },
  });

  const userIsChannelOwner = useMemo(
    () => user?.address === channelQueryData?.owner.address,
    [user, channelQueryData]
  );

  const userIsModerator = useMemo(
    () =>
      channelRoles?.some((m) => m?.address === user?.address && m?.role === 2),
    [user, channelRoles]
  );

  const previewedBurnProceeds = useMemo(() => {
    return vibesTokenTxs.length > 0
      ? Number(
          formatUnits(
            BigInt(
              calculateBurnProceeds(
                Number(vibesTokenTxs[vibesTokenTxs.length - 1].supply),
                Number(amountOfVibesToSend)
              )
            ),
            18
          )
        )
      : 0;
  }, [vibesTokenTxs, amountOfVibesToSend]);

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

  useEffect(() => {
    const init = async () => {
      let calls: any[] = [];
      if (
        isOpen &&
        targetUser !== undefined &&
        isAddress(targetUser.address as `0x${string}`)
      ) {
        calls = calls.concat([refetchTargetVibesBalance()]);
      }
      if (user) {
        calls = calls.concat([refetchTransfer()]);
      }
      try {
        await Promise.all(calls);
      } catch (err) {
        console.log("cannot fetch vibes balance data", err);
      }
    };
    init();
  }, [targetUser, isOpen, user]);

  useEffect(() => {
    const init = async () => {
      if (
        userVibesBalance?.value !== undefined &&
        isOpen &&
        targetUser !== undefined &&
        isAddress(targetUser.address as `0x${string}`)
      ) {
        await Promise.all([refetchTargetVibesBalance(), refetchTransfer()]);
      }
    };
    init();
  }, [userVibesBalance?.value]);

  const handleInputChange = (event: any) => {
    const input = event.target.value;
    const filtered = filteredInput(input);
    setAmountOfVibesToSend(filtered);
  };

  useEffect(() => {
    if (!matchingChain) {
      setErrorMessage("wrong network");
    } else if (Number(formatIncompleteNumber(amountOfVibesToSend)) <= 0) {
      setErrorMessage("enter amount first");
    } else if (
      userVibesBalance?.value &&
      Number(amountOfVibesToSend) > Number(userVibesBalance?.value)
    ) {
      setErrorMessage("insufficient $VIBES");
    } else {
      setErrorMessage("");
    }
  }, [matchingChain, userVibesBalance?.value, amountOfVibesToSend]);

  useEffect(() => {
    if (!isOpen) {
      setIsBanning(false);
      setIsAppointing(false);
      setIsSendingVibes(false);
      setAmountOfVibesToSend("10");
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
          {!isBanning && !isAppointing && (
            <>
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
                  <Text color="#c7dbff">{targetUser.address}</Text>
                  <ExternalLinkIcon />
                </Flex>
              </Link>
              <Flex justifyContent={"space-evenly"}>
                {userVibesBalance?.formatted !== undefined &&
                  (isSendingVibes || targetUser.address === user?.address) && (
                    <Text color="#e5fc92">
                      your $VIBES:{" "}
                      <Text as="span" color="#e5fc92" fontWeight="bold">
                        {userVibesBalance?.formatted}
                      </Text>
                    </Text>
                  )}
                {targetUser.address !== user?.address &&
                  targetVibesBalance?.formatted !== undefined && (
                    <Text color="#c6c3fc">
                      their $VIBES:{" "}
                      <Text as="span" color="#c6c3fc" fontWeight="bold">
                        {targetVibesBalance?.formatted}
                      </Text>
                    </Text>
                  )}
              </Flex>
              {targetUser.address !== user?.address && (
                <>
                  {!isSendingVibes ? (
                    <Button
                      color="white"
                      mt="20px"
                      bg="#6862e9"
                      _hover={{}}
                      _focus={{}}
                      _active={{}}
                      onClick={() => setIsSendingVibes(true)}
                    >
                      send $VIBES to user
                    </Button>
                  ) : (
                    <Flex alignItems="center" gap="10px">
                      <Tooltip
                        label={errorMessage}
                        placement="top"
                        isOpen={errorMessage !== undefined}
                        bg="red.600"
                      >
                        <Input
                          variant={errorMessage.length > 0 ? "redGlow" : "glow"}
                          textAlign="center"
                          value={amountOfVibesToSend}
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
                !isAppointing &&
                !isSendingVibes && (
                  <Button
                    color="white"
                    mt="20px"
                    bg="#074a84"
                    _hover={{}}
                    _focus={{}}
                    _active={{}}
                    onClick={() => setIsAppointing(true)}
                  >
                    appoint user as chat moderator
                  </Button>
                )}
              {(userIsChannelOwner || userIsModerator) &&
                targetUser.address !== channelQueryData?.owner.address &&
                targetUser.address !== user?.address &&
                !isBanning &&
                !isSendingVibes && (
                  <>
                    {!channelRoles?.some(
                      (m) => m?.address === targetUser.address && m?.role === 2
                    ) ? (
                      <Button
                        color="white"
                        mt="20px"
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
                        remove their status on your dashboard first
                      </Text>
                    )}
                  </>
                )}
            </>
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
                    you can always remove their status through your dashboard
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
        </ModalContent>
      )}
    </Modal>
  );
};

const calculateBurnProceeds = (currentSupply: number, amountToBurn: number) => {
  const newSupply = Math.max(currentSupply - amountToBurn, 0);
  const priceForCurrent = Math.floor(
    (currentSupply * (currentSupply + 1) * (2 * currentSupply + 1)) / 6
  );
  const priceForPrevious = Math.floor(
    (newSupply * (newSupply + 1) * (2 * newSupply + 1)) / 6
  );
  const newPrice = priceForCurrent - priceForPrevious;

  // returns in wei
  return newPrice;
};