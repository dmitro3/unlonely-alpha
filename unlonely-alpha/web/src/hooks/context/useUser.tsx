import { gql } from "@apollo/client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useEnsName } from "wagmi";
import { useQuery } from "@apollo/client";
import { usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { Box, Button, Flex, Text } from "@chakra-ui/react";

import { User } from "../../generated/graphql";
import centerEllipses from "../../utils/centerEllipses";
import { TransactionModalTemplate } from "../../components/transactions/TransactionModalTemplate";
import usePostSubscription from "../server/usePostSubscription";
import useUserAgent from "../internal/useUserAgent";
/* eslint-disable */
const GET_USER_QUERY = gql`
  query getUser($data: GetUserInput!) {
    getUser(data: $data) {
      address
      username
      signature
      bio
      powerUserLvl
      videoSavantLvl
      nfcRank
      FCImageUrl
      isFCUser
      isLensUser
      lensHandle
      lensImageUrl
      channel {
        slug
      }
    }
  }
`;

export const useUser = () => {
  return useContext(UserContext);
};

const UserContext = createContext<{
  user?: User;
  username?: string;
  userAddress?: `0x${string}`;
  walletIsConnected: boolean;
  loginMethod?: string;
  initialNotificationsGranted: boolean;
}>({
  user: undefined,
  username: undefined,
  userAddress: undefined,
  walletIsConnected: false,
  loginMethod: undefined,
  initialNotificationsGranted: false,
});

export const UserProvider = ({
  children,
}: {
  children: JSX.Element[] | JSX.Element;
}) => {
  const { isStandalone } = useUserAgent();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>();
  const { ready, authenticated, user: privyUser, logout, login } = usePrivy();
  const { wallet: activeWallet } = usePrivyWagmi();
  const [differentWallet, setDifferentWallet] = useState(false);
  const [showTurnOnNotifications, setShowTurnOnNotificationsModal] = useState<
    "off" | "start" | "loading" | "granted" | "denied"
  >("off");
  const [initialNotificationsGranted, setInitialNotificationsGranted] =
    useState(false);

  const { postSubscription } = usePostSubscription({
    onError: () => {
      console.error("Failed to save subscription to server.");
    },
  });

  const loginMethod = useMemo(() => {
    const wallet = privyUser?.linkedAccounts?.find(
      (account): account is WalletWithMetadata =>
        account.type === "wallet" && "walletClientType" in account
    );
    if (!wallet) return undefined;
    return wallet.walletClientType;
  }, [privyUser]);

  const address = useMemo(
    () => privyUser?.wallet?.address,
    [privyUser?.wallet?.address]
  );

  // ignore console log build error for now
  //
  const { data } = useQuery(GET_USER_QUERY, {
    variables: { data: { address } },
  });

  const { data: ensData } = useEnsName({
    address: address as `0x${string}`,
  });

  const walletIsConnected = useMemo(() => {
    const auth =
      authenticated && activeWallet !== undefined && user !== undefined;
    const matchingWallet = activeWallet?.address === address;
    return auth && matchingWallet;
  }, [authenticated, activeWallet, user, address]);

  const handleMobileNotifications = async () => {
    if ("serviceWorker" in navigator && "Notification" in window) {
      try {
        setShowTurnOnNotificationsModal("loading");
        const registration = await navigator.serviceWorker.register(
          "/serviceworker.js",
          {
            scope: "/",
          }
        );

        if (Notification.permission === "default") {
          // add 1 second delay to make sure service worker is ready
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const result = await window.Notification.requestPermission();
          if (result === "granted") {
            console.log("Notification permission granted");
            await registration.showNotification("Welcome to Unlonely", {
              body: "Excited to have you here!",
            });

            // Here's where you send the subscription to your server
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
            const subscriptionJSON = subscription.toJSON();
            if (subscriptionJSON) {
              postSubscription({
                endpoint: subscriptionJSON.endpoint,
                expirationTime: null,
                p256dh: subscriptionJSON.keys?.p256dh,
                auth: subscriptionJSON.keys?.auth,
              });
            } else {
              console.error("Failed to get subscription from service worker.");
            }
          }
          if (result === "granted" || result === "denied") {
            setShowTurnOnNotificationsModal(result);
          }
        }
        // If permission is "denied", you can handle it as needed. For example, showing some UI/UX elements guiding the user on how to enable notifications from browser settings.
        // If permission is "granted", it means the user has already enabled notifications.
        else if (Notification.permission === "denied") {
          // tslint:disable-next-line:no-console
          console.log("Notification permission denied");
          setShowTurnOnNotificationsModal("denied");
        } else if (Notification.permission === "granted") {
          // tslint:disable-next-line:no-console
          console.log("Notification permission granted");
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
          console.log("subscription", subscription);
          const subscriptionJSON = subscription.toJSON();
          if (subscriptionJSON) {
            console.log("subscriptionJSON", subscriptionJSON);
            postSubscription({
              endpoint: subscriptionJSON.endpoint,
              expirationTime: null,
              p256dh: subscriptionJSON.keys?.p256dh,
              auth: subscriptionJSON.keys?.auth,
            });
          } else {
            console.error("Failed to get subscription from service worker.");
          }
          setShowTurnOnNotificationsModal("granted");
          console.log("calling setInitialNotificationsGranted(true)");
          setInitialNotificationsGranted(true);
        }
      } catch (error) {
        console.error(
          "Error registering service worker or requesting permission:",
          error
        );
        console.log("error", error);
        setShowTurnOnNotificationsModal("off");
      } finally {
        setTimeout(() => {
          setShowTurnOnNotificationsModal("off");
          login();
        }, 2000);
      }
    }
  };

  useEffect(() => {
    const fetchEns = async () => {
      if (address) {
        const username = ensData ?? centerEllipses(address, 9);
        setUsername(username);
      }
    };

    fetchEns();
  }, [address, ensData]);

  useEffect(() => {
    setUser(data?.getUser);
  }, [data]);

  useEffect(() => {
    const f = async () => {
      if (
        user?.address &&
        activeWallet?.address &&
        activeWallet?.address !== user?.address
      ) {
        setDifferentWallet(true);
      } else {
        setDifferentWallet(false);
      }
    };
    f();
  }, [activeWallet, user]);

  useEffect(() => {
    if (!ready || !isStandalone) return;
    if ("Notification" in window && Notification.permission === "default") {
      setShowTurnOnNotificationsModal("start");
    } else {
      if (!authenticated) login();
    }
  }, [isStandalone, ready, authenticated]);

  const value = useMemo(
    () => ({
      user,
      username,
      userAddress: address as `0x${string}`,
      walletIsConnected,
      loginMethod,
      initialNotificationsGranted,
    }),
    [
      user,
      username,
      address,
      walletIsConnected,
      loginMethod,
      showTurnOnNotifications,
      initialNotificationsGranted,
    ]
  );

  return (
    <UserContext.Provider value={value}>
      <TransactionModalTemplate
        title={
          showTurnOnNotifications === "start" ||
          showTurnOnNotifications === "loading"
            ? "turning on notifications"
            : ""
        }
        confirmButton=""
        isOpen={showTurnOnNotifications !== "off"}
        handleClose={() => setShowTurnOnNotificationsModal("off")}
        canSend={true}
        onSend={handleMobileNotifications}
        isModalLoading={showTurnOnNotifications === "loading"}
        hideFooter
        cannotClose
        loadingText="setting up notifications on your device"
        size="sm"
        blur
      >
        {showTurnOnNotifications === "start" && (
          <Flex direction="column" gap="16px">
            <Text textAlign={"center"} fontSize="15px" color="#BABABA">
              We recommend turning on notifications so you know when livestreams
              start!
            </Text>
            <Button
              bg="#257ce0"
              _hover={{}}
              _focus={{}}
              _active={{}}
              width="100%"
              onClick={handleMobileNotifications}
            >
              get started
            </Button>
          </Flex>
        )}
        {showTurnOnNotifications === "granted" && (
          <Flex direction="column" gap="16px">
            <Text textAlign={"center"} fontSize="15px">
              You're all set up to receive notifications!
            </Text>
          </Flex>
        )}
        {showTurnOnNotifications === "denied" && (
          <Flex direction="column" gap="16px">
            <Text textAlign={"center"} fontSize="15px">
              Ok! You can enable notifications in your profile later!
            </Text>
          </Flex>
        )}
      </TransactionModalTemplate>
      <TransactionModalTemplate
        confirmButton="logout"
        title="did you change wallet accounts?"
        isOpen={differentWallet}
        handleClose={() => setDifferentWallet(false)}
        canSend={true}
        onSend={logout}
        isModalLoading={false}
        size="sm"
        blur
      >
        <Flex direction={"column"} gap="16px">
          <Text textAlign={"center"} fontSize="15px" color="#BABABA">
            our app thinks you're using two different wallet addresses, this can
            occur when you change wallet accounts while logged in
          </Text>
          <Box
            borderColor="#909090"
            borderWidth="1px"
            borderStyle="solid"
            p="5px"
            borderRadius="5px"
          >
            <Text textAlign={"center"} fontSize={"12px"} color="#22b66e">
              logged in as {user?.address}
            </Text>
            <Text textAlign={"center"} fontSize={"12px"} color="#85c71b">
              connected {activeWallet?.address}
            </Text>
          </Box>
          <Text textAlign={"center"} fontSize="20px">
            to resolve, switch back to the original wallet account or logout
          </Text>
        </Flex>
      </TransactionModalTemplate>
      {children}
    </UserContext.Provider>
  );
};
