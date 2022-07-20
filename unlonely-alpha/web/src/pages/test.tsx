import { RoomProvider, useMyPresence, useOthers } from "@liveblocks/react";
import { gql, useQuery } from "@apollo/client";
import React, { useState, useCallback, useEffect } from "react";
import {
  Text,
  Flex,
  Grid,
  GridItem,
  Box,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useAccount } from "wagmi";

import { Presence, CursorMode, CursorState, Reaction } from "../types/cursor";
import AppLayout from "../components/layout/AppLayout";
import VideoSort, { VideoAttribute } from "../components/video/VideoSort";
import { getEnsName } from "../utils/ens";
import centerEllipses from "../utils/centerEllipses";
import { VideoCard_VideoFragment } from "../generated/graphql";
import AblyChatComponent from "../components/chat/AblyChataComponent";

const VIDEO_LIST_QUERY = gql`
  query VideoFeed($data: VideoFeedInput!) {
    getVideoFeed(data: $data) {
      id
      title
      thumbnail
      description
      score
      createdAt
      owner {
        username
        address
      }
      liked
      skipped
    }
  }
`;

type Props = {
  videos: VideoCard_VideoFragment[];
  loading: boolean;
};

const Example: React.FunctionComponent<Props> = ({ videos, loading }) => {
  const others = useOthers<Presence>();
  const [{ cursor, message }, updateMyPresence] = useMyPresence<Presence>();
  const [state, setState] = useState<CursorState>({ mode: CursorMode.Hidden });
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [sortVideoAs, setSortVideoAs] = useState<VideoAttribute>("score");
  const [showCursor, setShowCursor] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>();
  const [{ data: accountData }] = useAccount();
  const toast = useToast();

  const setReaction = useCallback((reaction: string) => {
    setState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  const openComment = () => {
    if (state.mode === CursorMode.Chat) {
      updateMyPresence({ message: "" });
      setState({ mode: CursorMode.Hidden });
    } else {
      if (!accountData?.address) {
        toast({
          title: "Sign in first.",
          description: "Please sign into your wallet first.",
          status: "warning",
          duration: 9000,
          isClosable: true,
          position: "top",
        });
      } else {
        setState({ mode: CursorMode.Chat, previousMessage: null, message: "" });
      }
    }
  };

  const toggleHideCursor = () => {
    if (showCursor) setShowCursor(false);
    else setShowCursor(true);
  };

  useEffect(() => {
    const fetchEns = async () => {
      if (accountData?.address) {
        const ens = await getEnsName(accountData.address);
        const username = ens ? ens : centerEllipses(accountData.address, 7);
        setUsername(username);
        updateMyPresence({ username: username });
      }
    };

    fetchEns();
  }, [accountData?.address]);

  return (
    <>
      <Grid gridTemplateColumns={"10% 60% 20% 10%"} minH="calc(100vh - 48px)">
        <GridItem rowSpan={1} colSpan={2}></GridItem>
        <GridItem rowSpan={3} colSpan={1} border="2px" mt="10px" mb="190px">
          <Flex
            justifyContent="center"
            direction="column"
            bg="black"
            pb="10px"
            pt="10px"
          >
            <Box bg="black" margin="auto">
              <Text fontWeight={"bold"} fontSize="20px" color="white">
                The Chat Room!
              </Text>
            </Box>
          </Flex>
          <AblyChatComponent username={username}/>
        </GridItem>
        <GridItem rowSpan={3} colSpan={1}></GridItem>
        <GridItem rowSpan={2} colSpan={1}></GridItem>
        <GridItem rowSpan={1} colSpan={1} mb="20px" mr="20px">
          <Flex
            flexDirection="row"
            justifyContent="center"
            width="100%"
            height={{ base: "80%", sm: "300px", md: "400px", lg: "500px" }}
            mt="10px"
          >
            <iframe
              src="https://player.castr.com/live_4a9cb290032511edba7dd7a3002e508b"
              style={{ aspectRatio: "16/9" }}
              frameBorder="0"
              scrolling="no"
              allow="autoplay"
              allowFullScreen
            />
          </Flex>
        </GridItem>
        <GridItem rowSpan={1} colSpan={1} mr="20px">
          {loading ? (
            <Spinner />
          ) : (
            <Flex
              margin="auto"
              maxW={{ base: "100%", sm: "533px", md: "711px", lg: "889px" }}
              justifyContent="center"
              backgroundColor="rgba(0,0,0,0.2)"
              overflowX="auto"
              maxH="400px"
            >
              <VideoSort videos={videos} sort={sortVideoAs} />
            </Flex>
          )}
        </GridItem>
      </Grid>
    </>
  );
};

export default function Page() {
  const roomId = "unlonely-demo";
  const { data, loading, error } = useQuery(VIDEO_LIST_QUERY, {
    variables: {
      data: {
        searchString: null,
        skip: null,
        limit: null,
        orderBy: null,
      },
    },
    pollInterval: 60000,
  });

  const videos = data?.getVideoFeed;

  return (
    <RoomProvider
      id={roomId}
      initialPresence={() => ({
        cursor: null,
        message: "",
      })}
    >
      <AppLayout error={error}>
        <Example videos={videos} loading={loading} />
      </AppLayout>
    </RoomProvider>
  );
}

export async function getStaticProps() {
  const API_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

  return { props: {} };
}
