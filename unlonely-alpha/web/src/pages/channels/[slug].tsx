import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Image,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";
import React, { useCallback, useMemo, useState } from "react";
import { isAddress } from "viem";

import { initializeApollo } from "../../apiClient/client";
import BuyButton from "../../components/arcade/BuyButton";
import CoinButton from "../../components/arcade/CoinButton";
import CustomButton from "../../components/arcade/CustomButton";
import ChannelDesc from "../../components/channels/ChannelDesc";
import ChannelStreamerPerspective from "../../components/channels/ChannelStreamerPerspective";
import ChannelViewerPerspective from "../../components/channels/ChannelViewerPerspective";
import AblyChatComponent from "../../components/chat/ChatComponent";
import { WavyText } from "../../components/general/WavyText";
import AppLayout from "../../components/layout/AppLayout";
import ChannelNextHead from "../../components/layout/ChannelNextHead";
import StandaloneAblyChatComponent from "../../components/mobile/StandAloneChatComponent";
// import PvpTransactionModal from "../../components/transactions/PvpTransactionModal";
import { CHANNEL_DETAIL_QUERY } from "../../constants/queries";
import { ChannelDetailQuery } from "../../generated/graphql";
import {
  ChannelProvider,
  useChannelContext,
} from "../../hooks/context/useChannel";
import { useUser } from "../../hooks/context/useUser";
import useUserAgent from "../../hooks/internal/useUserAgent";
import { useWindowSize } from "../../hooks/internal/useWindowSize";

const ChannelDetail = ({
  channelData,
}: {
  channelData: ChannelDetailQuery;
}) => {
  const { isStandalone } = useUserAgent();

  const channelSSR = useMemo(
    () => channelData?.getChannelBySlug,
    [channelData]
  );

  return (
    <ChannelProvider>
      {!isStandalone ? (
        <DesktopPage channelSSR={channelSSR} />
      ) : (
        <MobilePage channelSSR={channelSSR} />
      )}
    </ChannelProvider>
  );
};

const DesktopPage = ({
  channelSSR,
}: {
  channelSSR: ChannelDetailQuery["getChannelBySlug"];
}) => {
  const { channel, recentStreamInteractions, arcade } = useChannelContext();
  const {
    channelQueryData,
    loading: channelDataLoading,
    error: channelDataError,
  } = channel;
  const { handleCustomModal, handleBuyModal, handleTipModal } = arcade;
  const { loading: recentStreamInteractionsLoading } = recentStreamInteractions;
  const queryLoading = useMemo(
    () => channelDataLoading || recentStreamInteractionsLoading,
    [channelDataLoading, recentStreamInteractionsLoading]
  );

  const [width] = useWindowSize();
  const { userAddress, user } = useUser();

  const isOwner = userAddress === channelQueryData?.owner.address;
  // const isOwner = true;

  const [previewStream, setPreviewStream] = useState<boolean>(false);

  const showArcadeButtons = useBreakpointValue({ md: false, lg: true });

  //used on mobile view
  const [hideChat, setHideChat] = useState<boolean>(false);

  const isHidden = useCallback(
    (isChat: boolean) => {
      //checks if width is <= 48 em (base size) if so checks switch tab is disabled
      return width <= 768 && (isChat ? hideChat : !hideChat);
    },
    [width, hideChat]
  );

  const openChatPopout = () => {
    if (!channelQueryData) return;
    const windowFeatures = "width=400,height=600,menubar=yes,toolbar=yes";
    window.open(
      `${window.location.origin}/mobile/chat/${channelQueryData?.awsId}`,
      "_blank",
      windowFeatures
    );
  };

  return (
    <>
      {channelSSR && <ChannelNextHead channel={channelSSR} />}
      <AppLayout
        title={channelSSR?.name}
        image={channelSSR?.owner?.FCImageUrl}
        pageUrl={`/channels/${channelSSR?.slug}`}
        description={channelSSR?.description}
        isCustomHeader={true}
      >
        {!queryLoading && !channelDataError ? (
          <>
            <Stack direction="column" mt={"1rem"}>
              <Stack
                mx={[0, 8, 4]}
                alignItems={["center", "initial"]}
                mt="10px"
                mb="25px"
                spacing={[4, 8]}
                direction={["column", "column", "row", "row"]}
              >
                <Stack direction="column" width={"100%"}>
                  {isOwner && !previewStream ? (
                    <ChannelStreamerPerspective />
                  ) : (
                    <ChannelViewerPerspective />
                  )}
                  <Grid
                    templateColumns="repeat(3, 1fr)"
                    gap={4}
                    mt="20px"
                    alignItems="baseline"
                  >
                    <GridItem colSpan={showArcadeButtons ? 2 : 3}>
                      <ChannelDesc />
                    </GridItem>
                    {isOwner && (
                      <GridItem>
                        <Flex justifyContent={"center"} gap="10px">
                          <Tooltip
                            label={`${
                              previewStream ? "hide" : "preview"
                            } stream`}
                          >
                            <IconButton
                              onClick={() => setPreviewStream((prev) => !prev)}
                              aria-label="preview"
                              _hover={{}}
                              _active={{}}
                              _focus={{}}
                              icon={
                                <Image
                                  src="/svg/preview-video.svg"
                                  height={12}
                                  style={{
                                    filter: previewStream
                                      ? "grayscale(100%)"
                                      : "none",
                                  }}
                                />
                              }
                            />
                          </Tooltip>
                        </Flex>
                      </GridItem>
                    )}
                    {showArcadeButtons && !isOwner && (
                      <GridItem justifyItems={"center"}>
                        <Box
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          gap={5}
                        >
                          {isAddress(
                            String(channelQueryData?.token?.address)
                          ) &&
                            user &&
                            userAddress && (
                              <>
                                <Grid
                                  templateColumns="repeat(2, 1fr)"
                                  templateRows="repeat(1, 1fr)"
                                  gridGap={4}
                                  alignItems="flex-start"
                                  justifyItems="flex-start"
                                >
                                  <Tooltip label={"make streamer do X"}>
                                    <span>
                                      <CustomButton
                                        callback={() => handleCustomModal(true)}
                                      />
                                    </span>
                                  </Tooltip>
                                  <Tooltip label={"tip the streamer"}>
                                    <span>
                                      <CoinButton
                                        callback={() => handleTipModal(true)}
                                      />
                                    </span>
                                  </Tooltip>
                                </Grid>
                                <BuyButton
                                  tokenName={
                                    channelQueryData?.token?.symbol
                                      ? `$${channelQueryData?.token?.symbol}`
                                      : "token"
                                  }
                                  callback={() => handleBuyModal(true)}
                                />
                              </>
                            )}
                          {(!isAddress(
                            String(channelQueryData?.token?.address)
                          ) ||
                            !user) && (
                            <>
                              <Grid
                                templateColumns="repeat(2, 1fr)"
                                templateRows="repeat(1, 1fr)"
                                gridGap={4}
                                alignItems="flex-start"
                                justifyItems="flex-start"
                              >
                                <Tooltip
                                  label={
                                    !user
                                      ? "connect wallet first"
                                      : "not available"
                                  }
                                >
                                  <span>
                                    <CustomButton />
                                  </span>
                                </Tooltip>
                                <Tooltip
                                  label={
                                    !user
                                      ? "connect wallet first"
                                      : "not available"
                                  }
                                >
                                  <span>
                                    <CoinButton />
                                  </span>
                                </Tooltip>
                              </Grid>
                              <Tooltip
                                label={
                                  !user
                                    ? "connect wallet first"
                                    : "not available"
                                }
                              >
                                <span>
                                  <BuyButton tokenName={"token"} />
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </GridItem>
                    )}
                  </Grid>
                </Stack>
                <Flex
                  hidden={isHidden(true)}
                  borderWidth="1px"
                  borderRadius={"10px"}
                  p="1px"
                  bg={
                    "repeating-linear-gradient(#E2F979 0%, #B0E5CF 34.37%, #BA98D7 66.67%, #D16FCE 100%)"
                  }
                  width="100%"
                  maxW={["768px", "100%", "380px"]}
                  maxH={["500px", "600px", "600px", "700px"]}
                  minH={["500px", "600px", "600px", "700px"]}
                  boxShadow="0px 4px 16px rgba(208, 234, 53, 0.4)"
                >
                  <Container
                    borderRadius={10}
                    background={"#19162F"}
                    centerContent
                    maxW="100%"
                    px="10px"
                  >
                    <AblyChatComponent />
                  </Container>
                </Flex>
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
            {!channelDataError ? (
              <WavyText text="loading..." />
            ) : (
              <Text fontFamily="Neue Pixel Sans">
                server error, please try again later
              </Text>
            )}
          </Flex>
        )}
      </AppLayout>
    </>
  );
};

const MobilePage = ({
  channelSSR,
}: {
  channelSSR: ChannelDetailQuery["getChannelBySlug"];
}) => {
  const { channel, recentStreamInteractions } = useChannelContext();
  const {
    channelQueryData,
    loading: channelDataLoading,
    error: channelDataError,
  } = channel;
  const { loading: recentStreamInteractionsLoading } = recentStreamInteractions;

  const queryLoading = useMemo(
    () => channelDataLoading || recentStreamInteractionsLoading,
    [channelDataLoading, recentStreamInteractionsLoading]
  );

  const { userAddress } = useUser();

  const isOwner = userAddress === channelQueryData?.owner.address;

  const [previewStream, setPreviewStream] = useState<boolean>(false);

  const handleShowPreviewStream = useCallback(() => {
    setPreviewStream((prev) => !prev);
  }, []);

  return (
    <AppLayout
      title={channelSSR?.name}
      image={channelSSR?.owner?.FCImageUrl}
      pageUrl={`/channels/${channelSSR?.slug}`}
      description={channelSSR?.description}
      isCustomHeader={true}
    >
      {!queryLoading && !channelDataError ? (
        <>
          {(previewStream || !isOwner) && <ChannelViewerPerspective mobile />}
          <StandaloneAblyChatComponent
            previewStream={previewStream}
            handleShowPreviewStream={handleShowPreviewStream}
          />
        </>
      ) : (
        <Flex
          alignItems={"center"}
          justifyContent={"center"}
          direction="column"
          width="100%"
          height="100vh"
          fontSize="50px"
        >
          {!channelDataError ? (
            <>
              <Image
                src="/icons/icon-192x192.png"
                borderRadius="10px"
                height="96px"
              />
              <Flex>
                <WavyText text="..." />
              </Flex>
            </>
          ) : (
            <Text fontFamily="Neue Pixel Sans">
              server error, please try again later
            </Text>
          )}
        </Flex>
      )}
    </AppLayout>
  );
};

export default ChannelDetail;

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>
) {
  const { slug } = context.params!;

  const apolloClient = initializeApollo(null, context.req.cookies, true);

  const { data, error } = await apolloClient.query({
    query: CHANNEL_DETAIL_QUERY,
    variables: { slug },
  });

  return { props: { channelData: data } };
}
