import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql } from "apollo-server-express";
import {
  typeDefs as scalarTypeDefs,
  resolvers as scalarResolvers,
} from "graphql-scalars";
import { merge } from "lodash";

import { typeDef as userTypeDef } from "./User/userTypeDef";
import { typeDef as likeTypeDef } from "./Like/likeTypeDef";
import { typeDef as videoTypeDef } from "./Video/videoTypeDef";
import { typeDef as taskTypeDef } from "./Task/taskTypeDef";
import { typeDef as poapTypeDef } from "./POAP/poapTypeDef";
import { typeDef as chatTypeDef } from "./Chat/chatTypeDef";
import { typeDef as nfcTypeDef } from "./NFC/NFCTypeDef";
import { typeDef as streamInteractionTypeDef } from "./StreamInteraction/streamInteractionTypeDef";
import { typeDef as channelTypeDef } from "./Channel/channelTypeDef";
import { typeDef as deviceTokenTypeDef } from "./DeviceToken/deviceTokenTypeDef";
import { typeDef as creatorTokenTypeDef } from "./CreatorToken/creatorTokenTypeDef";
import { typeDef as chatCommandTypeDef } from "./ChatCommand/chatCommandTypeDef";
import { typeDef as subscriptionTypeDef } from "./Subscription/SubscriptionTypeDef";
import { typeDef as baseLeaderboardTypeDef } from "./BaseLeaderboard/baseLeaderboardTypeDef";
import { typeDef as gamblableInteractionTypeDef } from "./GamblableInteraction/gamblableInteractionTypeDef";
import { typeDef as vibesTypeDef } from "./Vibes/vibesTypeDef";
import { typeDef as tempTokenTypeDef } from "./TempToken/tempTokenTypeDef";
import { typeDef as packageTypeDef } from "./Package/packageTypeDef";
import { typeDef as roomTypeDef } from "./Room/roomTypeDef";

import { resolvers as likeResolvers } from "./Like/likeResolvers";
import { resolvers as userResolvers } from "./User/userResolvers";
import { resolvers as videoResolvers } from "./Video/videoResolvers";
import { resolvers as taskResolvers } from "./Task/taskResolvers";
import { resolvers as poapResolvers } from "./POAP/poapResolvers";
import { resolvers as chatResolvers } from "./Chat/chatResolvers";
import { resolvers as nfcResolvers } from "./NFC/NFCResolvers";
import { resolvers as streamInteractionResolvers } from "./StreamInteraction/streamInteractionResolvers";
import { resolvers as channelResolvers } from "./Channel/channelResolvers";
import { resolvers as deviceTokenResolvers } from "./DeviceToken/deviceTokenResolvers";
import { resolvers as creatorTokenResolvers } from "./CreatorToken/creatorTokenResolvers";
import { resolvers as chatCommandResolvers } from "./ChatCommand/chatCommandResolvers";
import { resolvers as subscriptionResolvers } from "./Subscription/SubscriptionResolvers";
import { resolvers as baseLeaderboardResolvers } from "./BaseLeaderboard/baseLeaderboardResolvers";
import { resolvers as gamblableInteractionResolvers } from "./GamblableInteraction/gamblableInteractionResolvers";
import { resolvers as vibesResolvers } from "./Vibes/vibesResolvers";
import { resolvers as tempTokenResolvers } from "./TempToken/tempTokenResolvers";
import { resolvers as packageResolvers } from "./Package/packageResolvers";
import { resolvers as roomResolvers } from "./Room/roomResolvers";

const Query = gql`
  enum SortOrder {
    asc
    desc
  }

  enum SortBy {
    score
    createdAt
    totalMints
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

const resolvers = {
  ...scalarResolvers,
};

export default makeExecutableSchema({
  typeDefs: [
    Query,
    ...scalarTypeDefs,
    userTypeDef,
    likeTypeDef,
    videoTypeDef,
    taskTypeDef,
    poapTypeDef,
    chatTypeDef,
    nfcTypeDef,
    streamInteractionTypeDef,
    channelTypeDef,
    deviceTokenTypeDef,
    creatorTokenTypeDef,
    chatCommandTypeDef,
    subscriptionTypeDef,
    baseLeaderboardTypeDef,
    gamblableInteractionTypeDef,
    vibesTypeDef,
    tempTokenTypeDef,
    packageTypeDef,
    roomTypeDef,
  ],
  resolvers: merge(
    resolvers,
    userResolvers,
    likeResolvers,
    videoResolvers,
    taskResolvers,
    poapResolvers,
    chatResolvers,
    nfcResolvers,
    streamInteractionResolvers,
    channelResolvers,
    deviceTokenResolvers,
    creatorTokenResolvers,
    chatCommandResolvers,
    subscriptionResolvers,
    baseLeaderboardResolvers,
    gamblableInteractionResolvers,
    vibesResolvers,
    tempTokenResolvers,
    packageResolvers,
    roomResolvers
  ),
});
