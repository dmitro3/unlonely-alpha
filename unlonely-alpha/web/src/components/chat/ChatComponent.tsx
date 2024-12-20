import {
  Flex,
  Text,
  Container,
  Image,
  Tooltip,
  Button,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { useState } from "react";
import { HiUserGroup } from "react-icons/hi";
import { MdEvent } from "react-icons/md";
import { AiFillNotification } from "react-icons/ai";

import { ChatReturnType } from "../../hooks/chat/useChat";
import { useChannelContext } from "../../hooks/context/useChannel";
import useUserAgent from "../../hooks/internal/useUserAgent";
import { OuterBorder, BorderType } from "../general/OuterBorder";
import Participants from "../presence/Participants";
import { Chat } from "./Chat";
import {
  CHANNEL_IDS_NO_VIP,
  CHANNEL_SLUGS_CAN_HIDE_PARTICIPANTS,
} from "../../constants";
import { safeIncludes } from "../../utils/safeFunctions";

const ChatComponent = ({
  chat,
  tokenForTransfer,
  customWidth,
  customHeight,
  noTabs,
  tokenGating,
  noClipping,
}: {
  chat: ChatReturnType;
  tokenForTransfer: "vibes" | "tempToken";
  customWidth?: string;
  customHeight?: string;
  noTabs?: boolean;
  tokenGating?: {
    ctaBuyTokens: () => void;
    gateMessage: string;
  };
  noClipping?: boolean;
}) => {
  const { isStandalone } = useUserAgent();
  const [selectedTab, setSelectedTab] = useState<"chat" | "vip">("chat");
  const { chat: chatContext, channel, ui } = useChannelContext();
  const { presenceChannel } = chatContext;
  const { channelQueryData, isOwner } = channel;
  const { handleModeratorModal, handleNotificationsModal } = ui;

  const [showParticipants, setShowParticipants] = useState(true);

  return (
    <Flex
      width={customWidth ?? "100%"}
      height={!isStandalone ? { base: `${customHeight ?? "60vh"}` } : "100%"}
      position={"relative"}
    >
      <OuterBorder type={BorderType.OCEAN} p={"0"}>
        <Container centerContent maxW="100%" h="100%" alignSelf="end" p="0">
          {!noTabs && (
            <Flex width="100%">
              {channelQueryData?.id &&
                !safeIncludes(
                  CHANNEL_IDS_NO_VIP,
                  Number(channelQueryData?.id)
                ) && (
                  <>
                    <OuterBorder
                      cursor={"pointer"}
                      type={BorderType.OCEAN}
                      zIndex={selectedTab === "chat" ? 4 : 2}
                      onClick={() => setSelectedTab("chat")}
                      noborder
                      pb={selectedTab === "chat" ? "0px" : undefined}
                    >
                      <Flex
                        bg={
                          selectedTab === "chat"
                            ? "#1b9d9d"
                            : "rgba(19, 18, 37, 1)"
                        }
                        width="100%"
                        justifyContent={"center"}
                      >
                        <Text
                          fontFamily="LoRes15"
                          fontSize="20px"
                          fontWeight={"bold"}
                        >
                          chat
                        </Text>
                      </Flex>
                    </OuterBorder>
                    <OuterBorder
                      cursor={"pointer"}
                      type={BorderType.OCEAN}
                      zIndex={selectedTab === "vip" ? 4 : 2}
                      onClick={() => setSelectedTab("vip")}
                      noborder
                      pb={selectedTab === "vip" ? "0px" : undefined}
                    >
                      <Flex
                        bg={
                          selectedTab === "vip"
                            ? "#1b9d9d"
                            : "linear-gradient(163deg, rgba(255,255,255,1) 1%, rgba(255,227,143,1) 13%, rgba(255,213,86,1) 14%, rgba(246,190,45,1) 16%, rgba(249,163,32,1) 27%, rgba(231,143,0,1) 28%, #2e1405 30%, #603208 100%)"
                        }
                        width="100%"
                        justifyContent={"center"}
                        alignItems={"center"}
                        gap="5px"
                      >
                        <Text
                          fontFamily="LoRes15"
                          fontSize="20px"
                          fontWeight={"bold"}
                        >
                          vip
                        </Text>
                        <Tooltip
                          label="buy a vip badge to get access to the VIP chat!"
                          shouldWrapChildren
                        >
                          <Image
                            src="/svg/info.svg"
                            width="16px"
                            height="16px"
                          />
                        </Tooltip>
                      </Flex>
                    </OuterBorder>
                  </>
                )}
            </Flex>
          )}
          <OuterBorder
            type={BorderType.OCEAN}
            width={"100%"}
            zIndex={3}
            alignSelf="flex-end"
            noborder
            pt={!noTabs ? "0px" : undefined}
          >
            <Flex bg="rgba(24, 22, 47, 1)" width={"100%"} direction="column">
              <Flex position="relative" justifyContent={"center"}>
                {isOwner && (
                  <Flex left="0" position="absolute" top="1">
                    <Popover trigger="hover" placement="bottom" openDelay={500}>
                      <PopoverTrigger>
                        <IconButton
                          data-tour="s-step-5"
                          _focus={{}}
                          _active={{}}
                          _hover={{
                            transform: "scale(1.2)",
                          }}
                          icon={<MdEvent size={20} color="white" />}
                          bg="transparent"
                          aria-label="add-event"
                          onClick={() => {
                            window.open("https://lu.ma/unlonely", "_blank");
                          }}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        bg="#343dbb"
                        border="none"
                        width="100%"
                        p="2px"
                      >
                        <PopoverArrow bg="#343dbb" />
                        <Text fontSize="12px" textAlign={"center"}>
                          add an event!
                        </Text>
                      </PopoverContent>
                    </Popover>
                    <Popover trigger="hover" placement="bottom" openDelay={500}>
                      <PopoverTrigger>
                        <IconButton
                          _focus={{}}
                          _active={{}}
                          _hover={{
                            transform: "scale(1.2)",
                          }}
                          icon={<AiFillNotification size={20} color="white" />}
                          bg="transparent"
                          aria-label="add-event"
                          onClick={() => handleNotificationsModal(true)}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        bg="#6e9f04"
                        border="none"
                        width="100%"
                        p="2px"
                      >
                        <PopoverArrow bg="#6e9f04" />
                        <Text fontSize="12px" textAlign={"center"}>
                          send notifications!
                        </Text>
                      </PopoverContent>
                    </Popover>
                    <Popover trigger="hover" placement="bottom" openDelay={500}>
                      <PopoverTrigger>
                        <IconButton
                          _focus={{}}
                          _active={{}}
                          _hover={{
                            transform: "scale(1.2)",
                          }}
                          icon={<HiUserGroup size={20} color="white" />}
                          bg="transparent"
                          aria-label="moderators"
                          onClick={() => handleModeratorModal(true)}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        bg="#0a9216"
                        border="none"
                        width="100%"
                        p="2px"
                      >
                        <PopoverArrow bg="#0a9216" />
                        <Text fontSize="12px" textAlign={"center"}>
                          manage moderators!
                        </Text>
                      </PopoverContent>
                    </Popover>
                  </Flex>
                )}
                {presenceChannel && (
                  <Flex
                    justifyContent={"center"}
                    py="0.5rem"
                    gap="5px"
                    alignItems={"center"}
                  >
                    {safeIncludes(
                      CHANNEL_SLUGS_CAN_HIDE_PARTICIPANTS,
                      channelQueryData?.slug as string
                    ) &&
                      isOwner && (
                        <Button
                          onClick={() => setShowParticipants((prev) => !prev)}
                          bg={"#403c7d"}
                          p={2}
                          height={"20px"}
                          _focus={{}}
                          _active={{}}
                          _hover={{
                            bg: "#8884d8",
                          }}
                        >
                          <Text fontSize="14px" color="white">
                            {showParticipants ? "hide" : "show"}
                          </Text>
                        </Button>
                      )}
                    <Participants
                      ablyPresenceChannel={presenceChannel}
                      show={showParticipants}
                    />
                  </Flex>
                )}
              </Flex>
              <Chat
                chat={chat}
                tokenForTransfer={tokenForTransfer}
                tokenGating={tokenGating}
                noClipping={noClipping}
                isVipChat={selectedTab === "vip"}
              />
            </Flex>
          </OuterBorder>
        </Container>
      </OuterBorder>
    </Flex>
  );
};

export default ChatComponent;
