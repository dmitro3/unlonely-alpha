import {
  AddIcon,
  ChevronDownIcon,
  MinusIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";
import {
  Flex,
  Box,
  Text,
  Container,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  IconButton,
  Button,
  Input,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, CSSProperties, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";

import { ADD_REACTION_EVENT, InteractionType } from "../../constants";
import {
  ChatReturnType,
  useChat as useChatV2,
  useChatBox,
} from "../../hooks/chat/useChatV2";
import { useChannelContext } from "../../hooks/context/useChannel";
import { useNetworkContext } from "../../hooks/context/useNetwork";
import useUserAgent from "../../hooks/internal/useUserAgent";
import { getContractFromNetwork } from "../../utils/contract";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import { filteredInput } from "../../utils/validation/input";
import { OuterBorder, BorderType } from "../general/OuterBorder";
import ChatForm from "./ChatForm";
import MessageList from "./MessageList";

const holders = [
  { name: "test1", quantity: 500 },
  { name: "test2", quantity: 400 },
  { name: "test3", quantity: 300 },
  { name: "test4", quantity: 200 },
  { name: "test5", quantity: 100 },
  { name: "test6", quantity: 50 },
  { name: "test7", quantity: 40 },
  { name: "test8", quantity: 30 },
  { name: "test9", quantity: 20 },
  { name: "test10", quantity: 10 },
  { name: "test11", quantity: 5 },
  { name: "test12", quantity: 4 },
  { name: "test13", quantity: 3 },
  { name: "test14", quantity: 2 },
  { name: "test15", quantity: 1 },
];

const ChatComponent = () => {
  const { isStandalone } = useUserAgent();
  const [selectedTab, setSelectedTab] = useState<"chat" | "trade" | "vip">(
    "chat"
  );

  const chat = useChatV2();

  const [leaderboardIsCollapsed, setLeaderboardIsCollapsed] = useState(true);

  return (
    <Flex
      height={!isStandalone ? { base: "80vh" } : "100%"}
      position={"relative"}
    >
      <OuterBorder type={BorderType.OCEAN} p={"0"}>
        <Container centerContent maxW="100%" h="100%" alignSelf="end" p="0">
          <Flex width="100%">
            <OuterBorder
              type={BorderType.OCEAN}
              zIndex={selectedTab === "chat" ? 4 : 2}
              onClick={() => setSelectedTab("chat")}
              noborder
              pb={selectedTab === "chat" ? "0px" : undefined}
            >
              <Flex
                bg={
                  selectedTab === "chat"
                    ? "rgba(24, 22, 47, 1)"
                    : "rgba(19, 18, 37, 1)"
                }
                py="0.3rem"
                width="100%"
                justifyContent={"center"}
              >
                <Text>CHAT</Text>
              </Flex>
            </OuterBorder>
            <OuterBorder
              type={BorderType.OCEAN}
              zIndex={selectedTab === "trade" ? 4 : 2}
              onClick={() => setSelectedTab("trade")}
              noborder
              pb={selectedTab === "trade" ? "0px" : undefined}
            >
              <Flex
                bg={
                  selectedTab === "trade"
                    ? "rgba(24, 22, 47, 1)"
                    : "rgba(19, 18, 37, 1)"
                }
                py="0.3rem"
                width="100%"
                justifyContent={"center"}
              >
                <Text>VOTE</Text>
              </Flex>
            </OuterBorder>
            <OuterBorder
              type={BorderType.OCEAN}
              zIndex={selectedTab === "vip" ? 4 : 2}
              onClick={() => setSelectedTab("vip")}
              noborder
              pb={selectedTab === "vip" ? "0px" : undefined}
            >
              <Flex
                bg={
                  selectedTab === "vip"
                    ? "rgba(24, 22, 47, 1)"
                    : "rgba(19, 18, 37, 1)"
                }
                py="0.3rem"
                width="100%"
                justifyContent={"center"}
              >
                <Text>VIP</Text>
              </Flex>
            </OuterBorder>
          </Flex>
          <OuterBorder
            type={BorderType.OCEAN}
            width={"100%"}
            zIndex={3}
            alignSelf="flex-end"
            noborder
            pt="0px"
          >
            <Flex
              bg="rgba(24, 22, 47, 1)"
              p={"1rem"}
              width={"100%"}
              direction="column"
            >
              <Flex borderRadius={"5px"} p="1px" zIndex={3} mb="75px">
                <Flex
                  direction="column"
                  position="absolute"
                  style={{ backdropFilter: "blur(6px)" }}
                  // width={"100%"}
                  left={"10px"}
                  right={"10px"}
                >
                  <Text
                    fontSize={"20px"}
                    textAlign={"center"}
                    fontFamily={"LoRes15"}
                  >
                    LEADERBOARD
                  </Text>
                  <IconButton
                    aria-label="show leaderboard"
                    _hover={{}}
                    _active={{}}
                    _focus={{}}
                    bg="transparent"
                    icon={<ChevronDownIcon />}
                    onClick={() => {
                      setLeaderboardIsCollapsed(!leaderboardIsCollapsed);
                    }}
                    position="absolute"
                    right="-10px"
                    top="-10px"
                    transform={!leaderboardIsCollapsed ? "rotate(180deg)" : ""}
                  />
                  {leaderboardIsCollapsed && (
                    <Box
                      position="absolute"
                      bg={"linear-gradient(to bottom, transparent 75%, black)"}
                      width="100%"
                      height="100%"
                      pointerEvents={"none"}
                    />
                  )}
                  {/* {channelQueryData?.token?.symbol && (
                    <Text
                      color={"#B6B6B6"}
                      fontSize={"14px"}
                      fontWeight="400"
                      textAlign={"center"}
                    >
                      {`who owns the most $${channelQueryData?.token?.symbol}?`}
                    </Text>
                  )} */}
                  {/* {holdersLoading && (
                    <Flex justifyContent={"center"} p="20px">
                      <Spinner />
                    </Flex>
                  )} */}
                  {/* {!holdersLoading && holders.length > 0 && ( */}
                  <TableContainer
                    overflowY={leaderboardIsCollapsed ? "hidden" : "auto"}
                    maxHeight={leaderboardIsCollapsed ? "45px" : "150px"}
                    transition={"max-height 0.2s ease-in-out"}
                  >
                    <Table variant="unstyled" size="xs">
                      {/* <Thead>
                        <Tr>
                          <Th
                            textTransform={"lowercase"}
                            fontSize={"20px"}
                            textAlign="center"
                          >
                            rank
                          </Th>
                          <Th
                            textTransform={"lowercase"}
                            fontSize={"20px"}
                            textAlign="center"
                          >
                            name
                          </Th>
                          <Th
                            textTransform={"lowercase"}
                            fontSize={"20px"}
                            textAlign="center"
                            isNumeric
                          >
                            amount
                          </Th>
                        </Tr>
                      </Thead> */}
                      <Tbody>
                        {holders.map((holder, index) => (
                          <Tr>
                            <Td fontSize={"20px"} p="4px" textAlign="center">
                              <Text fontSize="14px">{index + 1}</Text>
                            </Td>
                            <Td fontSize={"20px"} p="4px" textAlign="center">
                              <Text fontSize="14px">{holder.name}</Text>
                            </Td>
                            <Td
                              fontSize={"20px"}
                              p="4px"
                              textAlign="center"
                              isNumeric
                            >
                              <Text fontSize="14px">
                                {truncateValue(holder.quantity, 2)}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {/* )} */}
                  {/* {!holdersLoading && holders.length === 0 && (
                    <Text textAlign={"center"} p="20px">
                      no holders found
                    </Text>
                  )} */}
                </Flex>
              </Flex>
              {selectedTab === "chat" && <Chat chat={chat} />}
              {selectedTab === "trade" && <Trade chat={chat} />}
              {selectedTab === "vip" && <Chat chat={chat} isVipChat />}
            </Flex>
          </OuterBorder>
        </Container>
      </OuterBorder>
    </Flex>
  );
};

const Trade = ({ chat }: { chat: ChatReturnType }) => {
  const { network } = useNetworkContext();
  const { matchingChain, localNetwork, explorerUrl } = network;

  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [isYay, setIsYay] = useState<boolean>(true);
  const [amountOfVotes, setAmountOfVotes] = useState<string>("0");

  const amount_bigint = useMemo(
    () => BigInt(amountOfVotes as `${number}`),
    [amountOfVotes]
  );

  const contract = getContractFromNetwork("unlonelySharesV2", localNetwork);

  const handleInputChange = (event: any) => {
    const input = event.target.value;
    const filtered = filteredInput(input);
    setAmountOfVotes(filtered);
  };

  const tradeMessages = useMemo(() => {
    const tradeMessages = chat.receivedMessages.filter(
      (m) =>
        m.data.body?.split(":")[0] === InteractionType.BUY_VOTES ||
        m.data.body?.split(":")[0] === InteractionType.SELL_VOTES
    );
    const tradeData = tradeMessages.map((m) => {
      const splitMessage = m.data.body?.split(":");
      return {
        taskType: splitMessage?.[0],
        trader: splitMessage?.[1],
        amount: splitMessage?.[2],
        isYay: splitMessage?.[3],
      };
    });
    return tradeData;
  }, [chat.receivedMessages]);

  return (
    <>
      <Flex
        direction="column"
        overflowX="auto"
        height="100%"
        width="100%"
        mt="8px"
        position="relative"
      >
        <Virtuoso
          followOutput={"auto"}
          style={{
            height: "100%",
            overflowY: "scroll",
          }}
          className="hide-scrollbar"
          data={tradeMessages}
          initialTopMostItemIndex={tradeMessages.length - 1}
          itemContent={(index, data) => (
            <Flex>
              <Text>{data.trader}</Text>
              <Text>
                {data.taskType === InteractionType.BUY_VOTES
                  ? "bought"
                  : "sold"}
              </Text>
              <Text>{data.amount}</Text>
              <Text>{data.isYay ? "YES" : "NO"}</Text>
              <Text>votes!</Text>
            </Flex>
          )}
        />
      </Flex>
      <Flex justifyContent={"space-around"}>
        <Flex gap="5px">
          <Button
            bg={isYay ? "#46a800" : "transparent"}
            border={!isYay ? "1px solid #46a800" : undefined}
            _focus={{}}
            _hover={{}}
            _active={{}}
            onClick={() => setIsYay(true)}
          >
            <TriangleUpIcon />
          </Button>
          <Button
            bg={!isYay ? "#fe2815" : "transparent"}
            border={isYay ? "1px solid #fe2815" : undefined}
            _focus={{}}
            _hover={{}}
            _active={{}}
            onClick={() => setIsYay(false)}
          >
            <TriangleDownIcon />
          </Button>
        </Flex>
        <Flex bg={"#131323"} borderRadius="15px">
          <Button
            bg={isBuying ? "#46a800" : "transparent"}
            border={!isBuying ? "1px solid #46a800" : undefined}
            _focus={{}}
            _hover={{}}
            _active={{}}
            onClick={() => setIsBuying(true)}
            borderRadius="15px"
          >
            BUY
          </Button>
          <Button
            bg={!isBuying ? "#fe2815" : "transparent"}
            border={isBuying ? "1px solid #fe2815" : undefined}
            _focus={{}}
            _hover={{}}
            _active={{}}
            onClick={() => setIsBuying(false)}
            borderRadius="15px"
          >
            SELL
          </Button>
        </Flex>
      </Flex>
      <Flex direction="column" borderRadius="15px" p="1rem">
        <Flex gap="1rem" mb="5px">
          <Flex direction="column">
            <Text fontSize="10px" textAlign="center">
              how many
            </Text>
            <Flex alignItems={"center"}>
              <IconButton
                bg="transparent"
                _active={{}}
                _focus={{}}
                _hover={{}}
                aria-label="decrease Votes"
                icon={<MinusIcon />}
                onClick={() => {
                  if (Number(amountOfVotes) <= 0) return;
                  setAmountOfVotes(String(Number(amountOfVotes) - 1));
                }}
              />
              <Input
                textAlign="center"
                width={"70px"}
                value={amountOfVotes}
                onChange={handleInputChange}
              />
              <IconButton
                bg="transparent"
                _active={{}}
                _focus={{}}
                _hover={{}}
                aria-label="decrease Votes"
                icon={<AddIcon />}
                onClick={() => {
                  setAmountOfVotes(String(Number(amountOfVotes) + 1));
                }}
              />
            </Flex>
          </Flex>
          <Flex direction="column">
            <Text fontSize="10px" textAlign="center">
              price
            </Text>
            <Text whiteSpace={"nowrap"} margin="auto">
              0.003 ETH
            </Text>
          </Flex>
          <Flex direction="column">
            <Text fontSize="10px" textAlign="center">
              have
            </Text>
            <Text whiteSpace={"nowrap"} margin="auto">
              {truncateValue(3, 0)}
            </Text>
          </Flex>
        </Flex>
        <Button
          bg={isBuying ? "#46a800" : "#fe2815"}
          _focus={{}}
          _hover={{}}
          _active={{}}
        >
          {isBuying ? "BUY" : "SELL"}
        </Button>
      </Flex>
    </>
  );
};

const Chat = ({
  chat,
  isVipChat,
}: {
  chat: ChatReturnType;
  isVipChat?: boolean;
}) => {
  const { arcade } = useChannelContext();
  const { chatBot } = arcade;

  const {
    scrollRef,
    isAtBottom,
    channelChatCommands,
    handleScrollToPresent,
    handleIsAtBottom,
    sendChatMessage,
  } = useChatBox(
    "chat",
    chatBot,
    chat.receivedMessages,
    chat.hasMessagesLoaded,
    chat.channel
  );

  const [emojisToAnimate, setEmojisToAnimate] = useState<
    { emoji: string; id: number }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.offsetHeight);
    }
  }, [containerRef]);

  const handleAnimateReactionEmoji = (str: string) => {
    const id = Date.now();
    setEmojisToAnimate((prev) => [...prev, { emoji: str, id }]);

    // Remove the emoji from the state after the animation duration (1s)
    setTimeout(() => {
      setEmojisToAnimate((prev) => prev.filter((emoji) => emoji.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!chat.allMessages || chat.allMessages.length === 0) return;
    const latestMessage = chat.allMessages[chat.allMessages.length - 1];
    if (
      Date.now() - latestMessage.timestamp < 300 &&
      latestMessage.name === ADD_REACTION_EVENT &&
      latestMessage.data.body
    )
      handleAnimateReactionEmoji(latestMessage.data.body);
  }, [chat.allMessages]);

  return (
    <Flex
      mt="10px"
      direction="column"
      minW="100%"
      width="100%"
      h="100%"
      position={"relative"}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          pointerEvents: "none",
        }}
        ref={containerRef}
      >
        {emojisToAnimate.map(({ emoji, id }) => (
          <span
            key={id}
            className="floatingEmoji"
            style={
              {
                "--translateY": `${containerHeight - 120}px`,
              } as CSSProperties & { "--translateY": string }
            }
          >
            {emoji}
          </span>
        ))}
      </div>
      <Flex
        direction="column"
        overflowX="auto"
        height="100%"
        id="chat"
        position="relative"
        mt="8px"
      >
        <MessageList
          scrollRef={scrollRef}
          messages={chat.receivedMessages}
          channel={chat.channel}
          isAtBottomCallback={handleIsAtBottom}
          isVipChat={isVipChat}
        />
      </Flex>
      <Flex justifyContent="center">
        {!isAtBottom && chat.hasMessagesLoaded && (
          <Box
            bg="rgba(98, 98, 98, 0.6)"
            p="4px"
            borderRadius="4px"
            _hover={{
              background: "rgba(98, 98, 98, 0.3)",
              cursor: "pointer",
            }}
            onClick={handleScrollToPresent}
          >
            <Text fontSize="12px">
              scrolling paused. click to scroll to bottom.
            </Text>
          </Box>
        )}
      </Flex>
      <Flex w="100%">
        <ChatForm
          sendChatMessage={sendChatMessage}
          additionalChatCommands={channelChatCommands}
          allowPopout
          channel={chat.channel}
          isVipChat={isVipChat}
        />
      </Flex>
    </Flex>
  );
};

export default ChatComponent;
