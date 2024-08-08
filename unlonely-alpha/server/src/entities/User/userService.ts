import axios from "axios";
import { User } from "@prisma/client";

import { Context } from "../../context";
import { lensClient, LENS_GET_DEFAULT_PROFILE } from "../../utils/lens/client";
import { fetchSocial } from "../../utils/identityResolver";

export const getLeaderboard = (ctx: Context) => {
  return ctx.prisma.user.findMany({
    orderBy: [
      {
        reputation: "desc",
      },
    ],
  });
};

export interface IGetUserTokenHoldingInput {
  tokenAddress: string;
  userAddress: string;
}

export const getUserTokenHolding = async (
  data: IGetUserTokenHoldingInput,
  ctx: Context
) => {
  // Get all the token holdings for the provided token
  const tokenHoldings = await ctx.prisma.userCreatorToken.findMany({
    where: {
      tokenAddress: data.tokenAddress,
    },
    orderBy: {
      quantity: "desc",
    },
  });

  // Find the index of the user in the sorted list of token holdings
  const userRanking = tokenHoldings.findIndex(
    (holding) => holding.userAddress === data.userAddress
  );

  // The 'findIndex' function returns -1 if it does not find the user in the list,
  // so we need to account for this
  return userRanking;
};

export interface IGetUserInput {
  address: string;
}

export const getUser = async (data: IGetUserInput, ctx: Context) => {
  const user = await ctx.prisma.user.findUnique({
    where: { address: data.address },
    select: {
      address: true,
      username: true,
      bio: true,
      powerUserLvl: true,
      videoSavantLvl: true,
      nfcRank: true,
      reputation: true,
      isFCUser: true,
      FCImageUrl: true,
      isLensUser: true,
      lensHandle: true,
      lensImageUrl: true,
      createdAt: true,
      updatedAt: true,
      signature: true,
      sigTimestamp: true,
      notificationsTokens: true,
      notificationsLive: true,
      notificationsNFCs: true,
      channel: {
        select: {
          slug: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const getUserChannelContract1155Mapping = async (
  data: IGetUserInput,
  ctx: Context
) => {
  const user = await ctx.prisma.user.findUnique({
    where: { address: data.address },
    select: {
      channelContract1155Mapping: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.channelContract1155Mapping;
}

export interface IUpdateUserChannelContract1155MappingInput {
  channelId: number;
  contract1155ChainId: number;
  contract1155Address: string;
  userAddress: string;
}

export const updateUserChannelContract1155Mapping = async (
  data: IUpdateUserChannelContract1155MappingInput,
  ctx: Context
) => {
  // Fetch the current user data to get the existing mapping
  const user = await ctx.prisma.user.findUnique({
    where: { address: data.userAddress },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Parse the current mapping
  const currentMapping: any = user.channelContract1155Mapping || {};

  // Update the mapping
  currentMapping[String(data.channelId)] = {
    contract1155Address: data.contract1155Address,
    contract1155ChainId: data.contract1155ChainId,
  };

  // Update the user with the new mapping
  return ctx.prisma.user.update({
    where: { address: data.userAddress },
    data: {
      channelContract1155Mapping: currentMapping,
    },
  });
};

export const getAllUsers = (ctx: Context) => {
  return ctx.prisma.user.findMany();
};

// get all users with notificationsToken legnth > 0, then add that users address, notificationsLive notificationsNFCs to deviveToken table
export const migrateAllUsersWithNotificationsToken = async (ctx: Context) => {
  console.log(ctx);
  const users = await ctx.prisma.user.findMany({
    where: {
      notificationsTokens: {
        not: "",
      },
    },
  });

  for (let i = 0; i < users.length; i++) {
    // Parse the string as an array
    const tokensArray = JSON.parse(users[i].notificationsTokens);

    // Filter out null values
    const nonNullTokens = tokensArray.filter((token: any) => token !== null);

    // If there are any non-null tokens, create the deviceToken
    if (nonNullTokens.length > 0) {
      const token = nonNullTokens[0]; // Assuming only one non-null token, extract it

      // Check if the deviceToken with the same token value already exists
      const existingDeviceToken = await ctx.prisma.deviceToken.findFirst({
        where: {
          token: token,
        },
      });

      // If the deviceToken does not exist, create a new one
      if (!existingDeviceToken) {
        await ctx.prisma.deviceToken.create({
          data: {
            address: users[i].address,
            token: token,
            notificationsLive: users[i].notificationsLive,
            notificationsNFCs: users[i].notificationsNFCs,
          },
        });
        console.log("added user", users[i].username, token);
      } else {
        console.log(
          "skipped user",
          users[i].username,
          token,
          "as the token already exists"
        );
      }
    }
  }
};

export const getAllUsersWithChannel = (ctx: Context) => {
  return ctx.prisma.user.findMany({
    where: {
      channel: {
        some: {},
      },
    },
    include: {
      channel: true,
    },
  });
};

export const updateAllUsers = async (ctx: Context) => {
  // where FCimageurl is null

  const users = await ctx.prisma.user.findMany({
    where: {
      FCImageUrl: "",
    },
  });
  // for loop through userse
  for (let i = 0; i < users.length; i++) {
    // call the api https://searchcaster.xyz/api/profiles?connected_address=${users[i].address}
    // fetch using axios
    const response = await axios.get(
      `https://searchcaster.xyz/api/profiles?connected_address=${users[i].address}`
    );
    console.log(users[i].address, users[i].username);
    console.log(response);

    // // if data array is not empty
    if (response.data.length > 0) {
      console.log(response.data[0].body);
      // update user with FCImageUrl and isFCUser to true
      await ctx.prisma.user.update({
        where: {
          address: users[i].address,
        },
        data: {
          FCImageUrl: response.data[0].body.avatarUrl,
          isFCUser: true,
        },
      });
      console.log(
        "updated user",
        users[i].address,
        response.data[0].body.avatarUrl
      );
    }
    const { data } = await lensClient.query({
      query: LENS_GET_DEFAULT_PROFILE,
      variables: {
        ethereumAddress: users[i].address,
      },
    });

    if (data && data.defaultProfile) {
      console.log(data.defaultProfile.picture === null);
      try {
        await ctx.prisma.user.update({
          where: {
            address: users[i].address,
          },
          data: {
            lensHandle: data.defaultProfile.handle,
            lensImageUrl:
              data.defaultProfile.picture === null
                ? null
                : data.defaultProfile.picture.original.url,
            isLensUser: true,
          },
        });
        console.log(
          "updated user",
          users[i].address,
          data.defaultProfile.handle,
          data.defaultProfile.picture.original.url
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
};

export interface IUpdateUserInput {
  address: string;
}

export const updateUser = async (data: IUpdateUserInput, ctx: Context) => {
  const socials = await fetchSocial(data.address, "ethereum");
  return ctx.prisma.user.update({
    where: {
      address: data.address,
    },
    data: socials,
  });
};

export interface IUpdateUserNotificationsInput {
  notificationsTokens: string;
  notificationsLive: boolean;
  notificationsNFCs: boolean;
}

export const updateUserNotifications = async (
  data: IUpdateUserNotificationsInput,
  user: User,
  ctx: Context
) => {
  return ctx.prisma.user.update({
    where: {
      address: user.address,
    },
    data: {
      notificationsTokens: data.notificationsTokens,
      notificationsLive: data.notificationsLive,
      notificationsNFCs: data.notificationsNFCs,
    },
  });
};
