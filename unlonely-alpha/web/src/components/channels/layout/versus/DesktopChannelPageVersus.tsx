import { ApolloError } from "@apollo/client";
import { ChannelStaticQuery } from "../../../../generated/graphql";
import { useEffect, useMemo, useRef } from "react";
import { useChat } from "../../../../hooks/chat/useChat";
import { useChannelContext } from "../../../../hooks/context/useChannel";
import { useUser } from "../../../../hooks/context/useUser";
import { useLivepeerStreamData } from "../../../../hooks/internal/useLivepeerStreamData";
import { useVipBadgeUi } from "../../../../hooks/internal/useVipBadgeUi";
import { Button, Flex, Stack, useToast, Text } from "@chakra-ui/react";
import copy from "copy-to-clipboard";
import { formatApolloError } from "../../../../utils/errorFormatting";
import trailString from "../../../../utils/trailString";
import ChatComponent from "../../../chat/ChatComponent";
import { WavyText } from "../../../general/WavyText";
import ChannelNextHead from "../../../layout/ChannelNextHead";
import Header from "../../../navigation/Header";
import { ChannelWideModals } from "../../ChannelWideModals";
import { DesktopChannelStreamerPerspectiveSimplified } from "../temptoken/DesktopChannelStreamerPerspectiveSimplified";
import { DesktopChannelViewerPerspectiveSimplified } from "../temptoken/DesktopChannelViewerPerspectiveSimplified";
import { VersusTempTokensInterface } from "./VersusTempTokensInterface";
import { useVersusTempTokenContext } from "../../../../hooks/context/useVersusTempToken";
import {
  CHAT_MESSAGE_EVENT,
  InteractionType,
  versusTokenDataInitial,
} from "../../../../constants";
import TempTokenAbi from "../../../../constants/abi/TempTokenV1.json";

export const DesktopChannelPageVersus = ({
  channelSSR,
  channelSSRDataLoading,
  channelSSRDataError,
}: {
  channelSSR: ChannelStaticQuery["getChannelBySlug"];
  channelSSRDataLoading: boolean;
  channelSSRDataError?: ApolloError;
}) => {
  const { walletIsConnected } = useUser();
  const { channel } = useChannelContext();
  const chat = useChat();
  const {
    loading: channelDataLoading,
    error: channelDataError,
    handleChannelStaticData,
    isOwner,
    handleRealTimeChannelDetails,
  } = channel;
  const { gameState, tokenATxs, tokenBTxs } = useVersusTempTokenContext();
  const {
    canPlayToken,
    isGameFinished,
    handleIsGameFinished,
    handleIsGameOngoing,
    handleOwnerMustPermamint,
    handleOwnerMustMakeWinningTokenTradeable,
    handleIsGameFinishedModalOpen,
    handleWinningToken,
    handleLosingToken,
    setTokenA,
    setTokenB,
  } = gameState;
  const { resetTempTokenTxs: resetTempTokenTxsA } = tokenATxs;
  const { resetTempTokenTxs: resetTempTokenTxsB } = tokenBTxs;

  const toast = useToast();
  const { livepeerData, playbackInfo } = useLivepeerStreamData();
  useVipBadgeUi(chat);
  const mountingMessages = useRef(true);
  useEffect(() => {
    if (channelSSR) handleChannelStaticData(channelSSR);
  }, [channelSSR]);

  const canShowInterface = useMemo(() => {
    return (
      !channelDataLoading &&
      !channelDataError &&
      !channelSSRDataError &&
      !channelSSRDataLoading
    );
  }, [
    channelDataLoading,
    channelDataError,
    channelSSRDataError,
    channelSSRDataLoading,
  ]);

  const handleCopy = () => {
    toast({
      title: "copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  useEffect(() => {
    if (chat.mounted) mountingMessages.current = false;
  }, [chat.mounted]);

  useEffect(() => {
    if (chat.receivedMessages.length === 0) return;
    const latestMessage =
      chat.receivedMessages[chat.receivedMessages.length - 1];
    if (
      latestMessage &&
      latestMessage.data.body &&
      latestMessage.name === CHAT_MESSAGE_EVENT &&
      Date.now() - latestMessage.timestamp < 12000
    ) {
      const body = latestMessage.data.body;
      if (
        body.split(":")[0] === InteractionType.CREATE_MULTIPLE_TEMP_TOKENS &&
        Date.now() - latestMessage.timestamp < 12000
      ) {
        const newEndTimestamp = BigInt(body.split(":")[1]);
        const newTokenAddresses = JSON.parse(body.split(":")[2]);
        const newTokenSymbols = JSON.parse(body.split(":")[3]);
        const chainId = Number(body.split(":")[4]);
        const newTokenCreationBlockNumber = BigInt(body.split(":")[5]);
        handleRealTimeChannelDetails({
          isLive: true,
        });

        handleIsGameFinished(false);
        handleIsGameOngoing(true);
        handleOwnerMustPermamint(false);
        handleOwnerMustMakeWinningTokenTradeable(false);
        handleIsGameFinishedModalOpen(false);
        handleWinningToken(versusTokenDataInitial);
        handleLosingToken(versusTokenDataInitial);
        resetTempTokenTxsA();
        resetTempTokenTxsB();
        setTokenA({
          transferredLiquidityOnExpiration: BigInt(0),
          symbol: newTokenSymbols[0],
          address: newTokenAddresses[0],
          totalSupply: BigInt(0),
          isAlwaysTradeable: false,
          highestTotalSupply: BigInt(0),
          contractData: {
            address: newTokenAddresses[0],
            chainId,
            abi: TempTokenAbi,
          },
          creationBlockNumber: newTokenCreationBlockNumber,
          endTimestamp: newEndTimestamp,
        });
        setTokenB({
          transferredLiquidityOnExpiration: BigInt(0),
          symbol: newTokenSymbols[1],
          address: newTokenAddresses[1],
          totalSupply: BigInt(0),
          isAlwaysTradeable: false,
          highestTotalSupply: BigInt(0),
          contractData: {
            address: newTokenAddresses[1],
            chainId,
            abi: TempTokenAbi,
          },
          creationBlockNumber: newTokenCreationBlockNumber,
          endTimestamp: newEndTimestamp,
        });
      }
    }
  }, [chat.receivedMessages]);

  return (
    <>
      {channelSSR && <ChannelNextHead channel={channelSSR} />}{" "}
      <Flex
        h="100vh"
        bg="rgba(5, 0, 31, 1)"
        position={"relative"}
        overflowY={"hidden"}
      >
        {canShowInterface ? (
          <Flex direction="column" width="100%">
            <Header />
            <Stack
              height="100%"
              alignItems={["center", "initial"]}
              direction={["column", "column", "row", "row"]}
              gap="0"
              width="100%"
            >
              <Flex direction="column" width={"100%"} height="100%">
                {isOwner && walletIsConnected ? (
                  <>
                    <ChannelWideModals ablyChannel={chat.channel} />
                    <DesktopChannelStreamerPerspectiveSimplified
                      ablyChannel={chat.channel}
                      livepeerData={livepeerData}
                      playbackData={
                        playbackInfo
                          ? {
                              infra: "livepeer",
                              livepeerPlaybackInfo: playbackInfo,
                            }
                          : {
                              infra: "aws",
                            }
                      }
                      mode={!isGameFinished ? "versus-mode" : ""}
                    />
                  </>
                ) : (
                  <DesktopChannelViewerPerspectiveSimplified
                    playbackData={
                      playbackInfo
                        ? {
                            infra: "livepeer",
                            livepeerPlaybackInfo: playbackInfo,
                          }
                        : {
                            infra: "aws",
                          }
                    }
                    chat={chat}
                    mode={canPlayToken ? "versus-mode" : ""}
                  />
                )}
              </Flex>
              {canPlayToken && (
                <Flex
                  direction="column"
                  minW={["100%", "100%", "500px", "500px"]}
                  maxW={["100%", "100%", "500px", "500px"]}
                  gap="1rem"
                >
                  <VersusTempTokensInterface
                    ablyChannel={chat.channel}
                    customHeight="100%"
                  />
                </Flex>
              )}
              {!canPlayToken && (
                <Flex
                  direction="column"
                  minW={["100%", "100%", "380px", "380px"]}
                  maxW={["100%", "100%", "380px", "380px"]}
                  gap="1rem"
                >
                  <VersusTempTokensInterface
                    ablyChannel={chat.channel}
                    customHeight="30%"
                  />
                  <ChatComponent
                    chat={chat}
                    tokenForTransfer="tempToken"
                    customHeight={"100%"}
                  />
                </Flex>
              )}
            </Stack>
          </Flex>
        ) : (
          <Flex
            alignItems={"center"}
            justifyContent={"center"}
            width="100%"
            height="calc(100vh)"
            fontSize="50px"
          >
            {!channelDataError && !channelSSRDataError ? (
              <WavyText text="loading..." />
            ) : channelSSR === null ? (
              <Text fontFamily="LoRes15">channel does not exist</Text>
            ) : (
              <Flex direction="column" gap="10px" justifyContent="center">
                <Text fontFamily="LoRes15" textAlign={"center"}>
                  server error, please try again later
                </Text>
                {channelDataError && (
                  <Flex justifyContent={"center"} direction="column">
                    <Text textAlign={"center"} fontSize="12px">
                      {trailString(formatApolloError(channelDataError), 25)}
                    </Text>
                    <Button
                      _focus={{}}
                      _active={{}}
                      _hover={{
                        transform: "scale(1.1)",
                      }}
                      onClick={() => {
                        copy(formatApolloError(channelDataError));
                        handleCopy();
                      }}
                      color="white"
                      bg="#e2461f"
                      mx="auto"
                    >
                      copy full error
                    </Button>
                  </Flex>
                )}
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </>
  );
};
