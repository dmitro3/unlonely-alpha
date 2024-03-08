import { gql } from "apollo-server-express";

export const typeDef = gql`
    enum VibesTransactionType {
        BUY
        SELL
    }

    type VibesTransaction {
        id: ID!
        chainId: Int
        transactionHash: String
        blockNumber: BigInt
        transactionType: VibesTransactionType
        traderAddress: String
        streamerAddress: String
        totalVibesSupplyAfterTrade: BigInt
        vibesAmount: BigInt
        weiAmount: BigInt
        protocolWeiFees: BigInt
        streamerWeiFees: BigInt
        createdAt: DateTime!
    }

    type StreamerVibesStat {
        id: ID!
        streamerAddress: String!
        chainId: Int!
        allTimeTotalVibesVolume: BigInt!
        allTimeTotalWeiVolume: BigInt!
        allTimeTotalProtocolWeiFees: BigInt!
        allTimeTotalStreamerWeiFees: BigInt!
        updatedAt: DateTime!
        createdAt: DateTime!
    }

    input DateRange {
        start: DateTime
        end: DateTime
    }

    input GetStreamerVibesStatInput {
        streamerAddress: String!
    }

    input GetVibesTransactionsInput {
        chainId: Int!
        streamerAddress: String!
        dateRange: DateRange
        take: Int
        skip: Int
    }

    input PostVibesTradesInput {
        chainId: Int!
        tokenAddress: String!
    }

    extend type Query {
        getStreamerVibesStat(data: GetStreamerVibesStatInput!): [StreamerVibesStat]
        getVibesTransactions(data: GetVibesTransactionsInput!): [VibesTransaction]
    }

    extend type Mutation {
        postVibesTrades(data: PostVibesTradesInput!): [VibesTransaction]
    }
`;