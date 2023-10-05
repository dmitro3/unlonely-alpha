import { gql } from "apollo-server-express";

export const typeDef = gql`
  type NFC implements Likable {
    id: ID!
    title: String
    videoLink: String
    videoThumbnail: String
    openseaLink: String
    score: Int!
    liked: Boolean
    disliked: Boolean
    owner: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ClipOutput {
    url: String
    thumbnail: String
    errorMessage: String
  }

  type ClipNFCOutput implements Likable {
    id: ID!
    title: String
    videoLink: String
    videoThumbnail: String
    openseaLink: String
    score: Int!
    liked: Boolean
    disliked: Boolean
    owner: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    url: String
    thumbnail: String
    errorMessage: String
  }

  input NFCFeedInput {
    limit: Int
    offset: Int
    orderBy: SortBy
  }

  input PostNFCInput {
    title: String!
    videoLink: String!
    videoThumbnail: String!
    openseaLink: String!
  }

  input UpdateNFCInput {
    id: ID!
    title: String!
    videoLink: String!
    videoThumbnail: String!
    openseaLink: String!
  }

  input CreateClipInput {
    title: String!
    channelArn: String!
  }

  extend type Query {
    getNFCFeed(data: NFCFeedInput): [NFC]
    getNFC(id: ID!): NFC
  }

  extend type Mutation {
    createClip(data: CreateClipInput): ClipNFCOutput
    postNFC(data: PostNFCInput!): NFC
    updateNFC(data: UpdateNFCInput!): NFC
    openseaNFCScript: String
    updateOpenseaLink: NFC
  }
`;
