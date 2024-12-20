import { ApolloError } from "@apollo/client";
import { Flex, Button, Stack, Text, useToast } from "@chakra-ui/react";
import Link from "next/link";
import { useEffect } from "react";
import { ChannelStaticQuery } from "../../../generated/graphql";
import { useChat } from "../../../hooks/chat/useChat";
import { useChannelContext } from "../../../hooks/context/useChannel";
import { streamerTourSteps } from "../../../pages/_app";
import ChatComponent from "../../chat/ChatComponent";
import VibesTokenInterface from "../vibes/VibesTokenInterface";
import { WavyText } from "../../general/WavyText";
import AppLayout from "../../layout/AppLayout";
import ChannelNextHead from "../../layout/ChannelNextHead";
import { TransactionModalTemplate } from "../../transactions/TransactionModalTemplate";
import ChannelDesc from "../ChannelDesc";
import ChannelStreamerPerspective from "./ChannelStreamerPerspective";
import { ChannelWideModals } from "../ChannelWideModals";
import copy from "copy-to-clipboard";
import trailString from "../../../utils/trailString";
import { useVipBadgeUi } from "../../../hooks/internal/useVipBadgeUi";
import { useLivepeerStreamData } from "../../../hooks/internal/useLivepeerStreamData";
import { formatApolloError } from "../../../utils/errorFormatting";
import StreamComponent from "../../stream/StreamComponent";

export const DesktopPage = ({
  channelSSR,
  channelSSRDataLoading,
  channelSSRDataError,
}: {
  channelSSR: ChannelStaticQuery["getChannelBySlug"];
  channelSSRDataLoading: boolean;
  channelSSRDataError?: ApolloError;
}) => {
  const { channel, ui, chat: c } = useChannelContext();
  const chat = useChat({ chatBot: c.chatBot });
  const {
    error: channelDataError,
    handleChannelStaticData,
    isOwner,
    channelQueryData,
  } = channel;
  const {
    welcomeStreamerModal,
    handleWelcomeStreamerModal,
    handleStartedWelcomeTour,
    handleIsTourOpen,
    handleSetTourSteps,
  } = ui;
  const toast = useToast();
  const { livepeerData, playbackInfo, checkedForLivepeerPlaybackInfo } =
    useLivepeerStreamData({
      livepeerStreamId: channelQueryData?.livepeerStreamId ?? undefined,
      livepeerPlaybackId: channelQueryData?.livepeerPlaybackId ?? undefined,
    });
  useVipBadgeUi(chat);

  useEffect(() => {
    if (channelSSR) handleChannelStaticData(channelSSR);
  }, [channelSSR]);

  const handleCopy = () => {
    toast({
      title: "copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <>
      {channelSSR && <ChannelNextHead channel={channelSSR} />}
      <TransactionModalTemplate
        title={
          welcomeStreamerModal === "welcome"
            ? "Welcome streamer!"
            : "You are ready to start streaming!"
        }
        isOpen={welcomeStreamerModal !== "off"}
        handleClose={() => handleWelcomeStreamerModal("off")}
        cannotClose={welcomeStreamerModal === "welcome"}
        hideFooter
      >
        {welcomeStreamerModal === "welcome" && (
          <Flex direction="column" gap="10px">
            <Text fontSize={"1rem"} textAlign="center">
              You can now start your stream and interact with your viewers
            </Text>
            <Text textAlign="center">
              We've also prepared a small guide for how to use this page!
            </Text>
            <Button
              bg="#cd34e8"
              color={"white"}
              _focus={{}}
              _hover={{
                transform: "scale(1.05)",
              }}
              _active={{}}
              onClick={() => {
                handleWelcomeStreamerModal("off");
                handleSetTourSteps?.(streamerTourSteps);
                handleIsTourOpen(true);
                handleStartedWelcomeTour(true);
              }}
            >
              Start tour
            </Button>
          </Flex>
        )}
        {welcomeStreamerModal === "bye" && (
          <Flex direction="column" gap="10px">
            <Text fontSize={"1rem"} textAlign="center">
              check out the rest of our features{" "}
              <Link href="https://bit.ly/unlonelyFAQs" target="_blank">
                <Text as="span" textDecoration={"underline"} color="#3cd8ff">
                  here
                </Text>
              </Link>
            </Text>
            <Button
              onClick={() => {
                handleWelcomeStreamerModal("off");
                handleStartedWelcomeTour(false);
              }}
              color="white"
              bg={"#0767ac"}
              _focus={{}}
              _hover={{
                transform: "scale(1.05)",
              }}
              _active={{}}
            >
              close
            </Button>
          </Flex>
        )}
      </TransactionModalTemplate>
      <AppLayout
        title={channelSSR?.name}
        image={channelSSR?.owner?.FCImageUrl}
        pageUrl={`/channels/${channelSSR?.slug}`}
        description={channelSSR?.description}
        isCustomHeader={true}
      >
        {!channelDataError && !channelSSRDataError && !channelSSRDataLoading ? (
          <>
            <Stack
              mx={[0, 8, 4]}
              alignItems={["center", "initial"]}
              spacing={[4, "1rem"]}
              direction={["column", "column", "row", "row"]}
            >
              <Stack direction="column" width={"100%"}>
                {isOwner ? (
                  <>
                    <ChannelWideModals ablyChannel={chat.channel} />
                    {checkedForLivepeerPlaybackInfo && (
                      <ChannelStreamerPerspective
                        ablyChannel={chat.channel}
                        livepeerData={livepeerData}
                        playbackData={
                          playbackInfo
                            ? {
                                infra: "livepeer",
                                livepeerPlaybackInfo: playbackInfo,
                              }
                            : { infra: "aws" }
                        }
                      />
                    )}
                  </>
                ) : (
                  <Stack direction="column" width={"100%"} position={"unset"}>
                    <Flex width={"100%"} position="relative">
                      {checkedForLivepeerPlaybackInfo && (
                        <StreamComponent
                          playbackData={
                            playbackInfo
                              ? {
                                  infra: "livepeer",
                                  livepeerPlaybackInfo: playbackInfo,
                                }
                              : { infra: "aws" }
                          }
                        />
                      )}
                    </Flex>
                  </Stack>
                )}
                <Flex
                  gap={4}
                  mt="0 !important"
                  justifyContent={"space-between"}
                >
                  <ChannelDesc />
                </Flex>
              </Stack>
              <Stack
                direction="column"
                minW={["100%", "100%", "380px", "380px"]}
                maxW={["100%", "100%", "380px", "380px"]}
                gap="1rem"
              >
                <Flex
                  minH="20vh"
                  gap="5px"
                  justifyContent={"space-between"}
                  bg="#131323"
                  p="5px"
                >
                  <VibesTokenInterface ablyChannel={chat.channel} />
                </Flex>
                <ChatComponent chat={chat} tokenForTransfer="vibes" />
              </Stack>
            </Stack>
          </>
        ) : (
          <Flex
            alignItems={"center"}
            justifyContent={"center"}
            width="100%"
            height="calc(100vh - 64px)"
            fontSize="50px"
          >
            {!channelDataError && !channelSSRDataError ? (
              <WavyText text="loading..." />
            ) : channelSSR === null ? (
              <Text fontFamily="LoRes15">channel does not exist</Text>
            ) : (
              <Flex direction="column" gap="10px" justifyContent="center">
                <Text fontFamily="LoRes15" textAlign={"center"} fontSize="50px">
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
      </AppLayout>
    </>
  );
};
