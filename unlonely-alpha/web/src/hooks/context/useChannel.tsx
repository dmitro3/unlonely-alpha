import { useRouter } from "next/router";
import { createContext, useContext, useMemo, useEffect, useState } from "react";
import {
  CHANNEL_DETAIL_QUERY,
  GET_RECENT_STREAM_INTERACTIONS_BY_CHANNEL_QUERY,
} from "../../constants/queries";
import {
  ChannelDetailQuery,
  GetRecentStreamInteractionsQuery,
} from "../../generated/graphql";
import { ApolloError, useQuery } from "@apollo/client";
import { useBalance } from "wagmi";
import { FetchBalanceResult } from "../../constants/types";
import { useUser } from "./useUser";
// import { InteractionType } from "../../constants";
// import { io, Socket } from "socket.io-client";

export const useChannelContext = () => {
  return useContext(ChannelContext);
};

const ChannelContext = createContext<{
  channel: {
    channelBySlug?: ChannelDetailQuery["getChannelBySlug"];
    data?: ChannelDetailQuery;
    loading: boolean;
    error?: ApolloError;
  };
  recentStreamInteractions: {
    // textOverVideo: string[];
    // socket?: Socket;
    data?: GetRecentStreamInteractionsQuery;
    loading: boolean;
    error?: ApolloError;
  };
  chat: {
    chatChannel?: string;
    presenceChannel?: string;
  };
  token: {
    userTokenBalance?: FetchBalanceResult;
    refetchUserTokenBalance?: () => void;
    ownerTokenBalance?: FetchBalanceResult;
    refetchOwnerTokenBalance?: () => void;
  };
}>({
  channel: {
    channelBySlug: undefined,
    data: undefined,
    loading: true,
    error: undefined,
  },
  recentStreamInteractions: {
    // textOverVideo: [],
    // socket: undefined,
    data: undefined,
    loading: true,
    error: undefined,
  },
  chat: {
    chatChannel: undefined,
    presenceChannel: undefined,
  },
  token: {
    userTokenBalance: undefined,
    refetchUserTokenBalance: () => undefined,
    ownerTokenBalance: undefined,
    refetchOwnerTokenBalance: () => undefined,
  },
});

export const ChannelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  const router = useRouter();
  const { slug } = router.query;

  const {
    loading: channelDataLoading,
    error: channelDataError,
    data: channelData,
  } = useQuery<ChannelDetailQuery>(CHANNEL_DETAIL_QUERY, {
    variables: { slug },
  });

  const {
    data: recentStreamInteractionsData,
    loading: recentStreamInteractionsDataLoading,
    error: recentStreamInteractionsDataError,
  } = useQuery<GetRecentStreamInteractionsQuery>(
    GET_RECENT_STREAM_INTERACTIONS_BY_CHANNEL_QUERY,
    {
      variables: {
        data: {
          channelId: channelData?.getChannelBySlug?.id,
        },
      },
    }
  );

  const channelBySlug = useMemo(
    () => channelData?.getChannelBySlug,
    [channelData]
  );

  const { data: userTokenBalance, refetch: refetchUserTokenBalance } =
    useBalance({
      address: user?.address as `0x${string}`,
      token: channelData?.getChannelBySlug?.token?.address as `0x${string}`,
    });

  const { data: ownerTokenBalance, refetch: refetchOwnerTokenBalance } =
    useBalance({
      address: channelData?.getChannelBySlug?.owner?.address as `0x${string}`,
      token: channelData?.getChannelBySlug?.token?.address as `0x${string}`,
    });

  const [ablyChatChannel, setAblyChatChannel] = useState<string | undefined>(
    undefined
  );
  const [ablyPresenceChannel, setAblyPresenceChannel] = useState<
    string | undefined
  >(undefined);
  // const [socket, setSocket] = useState<Socket | undefined>(undefined);
  // const [textOverVideo, setTextOverVideo] = useState<string[]>([]);

  useEffect(() => {
    if (channelData?.getChannelBySlug && channelData?.getChannelBySlug.awsId) {
      setAblyChatChannel(`${channelData?.getChannelBySlug.awsId}-chat-channel`);
      setAblyPresenceChannel(
        `${channelData?.getChannelBySlug.awsId}-presence-channel`
      );
    }
  }, [channelData]);

  const value = useMemo(
    () => ({
      channel: {
        channelBySlug,
        data: channelData,
        loading: channelDataLoading,
        error: channelDataError,
      },
      recentStreamInteractions: {
        // textOverVideo,
        // socket,
        data: recentStreamInteractionsData,
        loading: recentStreamInteractionsDataLoading,
        error: recentStreamInteractionsDataError,
      },
      chat: {
        chatChannel: ablyChatChannel,
        presenceChannel: ablyPresenceChannel,
      },
      token: {
        userTokenBalance,
        refetchUserTokenBalance,
        ownerTokenBalance,
        refetchOwnerTokenBalance,
      },
    }),
    [
      channelBySlug,
      channelData,
      channelDataLoading,
      channelDataError,
      // textOverVideo,
      // socket,
      recentStreamInteractionsData,
      recentStreamInteractionsDataLoading,
      recentStreamInteractionsDataError,
      ablyChatChannel,
      ablyPresenceChannel,
      userTokenBalance,
      refetchUserTokenBalance,
      ownerTokenBalance,
      refetchOwnerTokenBalance,
    ]
  );

  return (
    <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
  );
};