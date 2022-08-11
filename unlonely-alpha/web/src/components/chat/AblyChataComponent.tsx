import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  Flex,
  Button,
  Textarea,
  Link,
  useToast,
  Image,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

import useChannel from "../../hooks/useChannel";
import { ChatBot } from "../../pages/channels/youtube";
import { COLORS } from "../../styles/Colors";
import { isFCUser } from "../../utils/farcasterBadge";
import NFTList from "../profile/NFTList";

type Message = {
  clientId: string;
  connectionId: string;
  data: {
    messageText: string;
    username: string;
    chatColor: string;
    address: string;
    isFC: boolean;
  };
  id: string;
  timestamp: number;
};

type Props = {
  username: string | null | undefined;
  chatBot: ChatBot[];
};

const chatColor = COLORS[Math.floor(Math.random() * COLORS.length)];

const AblyChatComponent = ({ username, chatBot }: Props) => {
  let inputBox: HTMLTextAreaElement | null = null;
  // automatically scroll to the bottom of the chat
  const autoScroll = useRef(true);
  const [messageText, setMessageText] = useState<string>("");
  const [receivedMessages, setMessages] = useState<Message[]>([]);
  const [isFC, setIsFC] = useState<boolean>(false);
  const accountData = useAccount();
  const toast = useToast();
  const [buttonStatus, toggleButton] = useState(false);
  const messageTextIsEmpty = messageText.trim().length === 0;

  const switchButton = () => {
    toggleButton((current) => !current);
  };
  const [channel, ably] = useChannel(
    "persistMessages:chat-demo",
    (message: Message) => {
      const history = receivedMessages.slice(-199);
      setMessages([...history, message]);
    }
  );

  useEffect(() => {
    async function getMessages() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { items } = await channel.history({ limit: 200 });
      const reversed = items.reverse();
      setMessages(reversed);
    }
    getMessages();
  }, []);

  // publish new chat when chatBot changes
  useEffect(() => {
    if (chatBot.length > 0) {
      // get last message in chatbot
      const lastMessage = chatBot[chatBot.length - 1];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      channel.publish({
        name: "chat-message",
        data: {
          messageText: `${username} added the video: "${lastMessage.videoTitle}"`,
          username: "chatbot🤖",
          chatColor: "black",
          address: "0x0000000000000000000000000000000000000000",
          isFC: false,
        },
      });
    }
  }, [chatBot]);

  const sendChatMessage = async (messageText: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    channel.publish({
      name: "chat-message",
      data: {
        messageText,
        username,
        chatColor,
        isFC,
        address: accountData?.address,
      },
    });
    setMessageText("");
    if (inputBox) inputBox.focus();
    if (messageText.startsWith("@chatbot")) {
      // const that removes the @chatbot: from the beginning of the message
      const prompt = messageText.substring(9);
      const res = await fetch("/api/openai", {
        body: JSON.stringify({
          prompt: prompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      channel.publish({
        name: "chat-message",
        data: {
          messageText: `${data}`,
          username: "chatbot🤖",
          chatColor: "black",
          address: "0x0000000000000000000000000000000000000000",
          isFC: false,
        },
      });
    }
  };

  const handleFormSubmission = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (username) {
      sendChatMessage(messageText);
    } else {
      toast({
        title: "Sign in first.",
        description: "Please sign into your wallet first.",
        status: "warning",
        duration: 9000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleKeyPress = (event: any) => {
    if (event.charCode !== 13 || messageTextIsEmpty) {
      return;
    }
    event.preventDefault();
    if (username) {
      sendChatMessage(messageText);
    } else {
      toast({
        title: "Sign in first.",
        description: "Please sign into your wallet first.",
        status: "warning",
        duration: 9000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const messages = receivedMessages.map((message, index) => {
    let author: string;
    // add key to flexbox to prevent React error
    if (message.data.username === "chatbot🤖") {
      author = "chatbot🤖";
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      author = message.data.username;
    }
    return (
      <>
        <Flex direction="column">
          <Flex key={index} direction="row" align="center">
            {(message.data.isFC) && (
              <Image
                src="https://searchcaster.xyz/img/logo.png"
                width="20px"
                height="20px"
                mr="5px"
              />
            )}
            <NFTList address={message.data.address} author={author} />
          </Flex>
          <Box
            key={index}
            borderRadius="10px"
            bg={message.data.chatColor}
            pr="10px"
            pl="10px"
            mb="10px"
          >
            <Text color="white" fontSize={14} wordBreak="break-word">
              {message.data.messageText}
            </Text>
          </Box>
        </Flex>
      </>
    );
  });

  useEffect(() => {
    const fetchData = async (address: string) => {
      const fcBadge = await isFCUser(address);
      setIsFC(fcBadge);
    };
    if (accountData?.address) {
      fetchData(accountData.address);
    }
  }, [accountData?.address]);

  // useeffect to scroll to the bottom of the chat
  useEffect(() => {
    if (autoScroll.current) {
      const chat = document.getElementById("chat");
      if (chat) {
        chat.scrollTop = chat.scrollHeight;
      }
    }
  }, [receivedMessages]);

  return (
    <>
      <Flex p="10px" h="100%" minW="100%">
        <Flex direction="column">
          <Text lineHeight={5} mb="10px" fontWeight="bold" fontSize={14}>
            Give product feedback and bug reports
            <Link href="https://tally.so/r/mODB9K" isExternal>
              {" "}
              here.
              <ExternalLinkIcon mx="2px" />
            </Link>
          </Text>
          <Flex
            direction="column"
            overflowX="auto"
            height="100%"
            maxH="400px"
            id="chat"
          >
            {messages}
            {autoScroll.current && (
              <Box
              // ref={(el) => {
              //   if (el) el.scrollIntoView({ behavior: "smooth" });
              // }}
              />
            )}
          </Flex>
          <Flex mt="20px" w="100%">
            <form
              onSubmit={handleFormSubmission}
              className="xeedev-form-i"
              style={{ width: "100%" }}
            >
              <Textarea
                ref={(element) => {
                  inputBox = element;
                }}
                value={messageText}
                placeholder="Type a message..."
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                background="white"
                minW="100%"
              ></Textarea>
              <Flex width="100%" justifyContent="right" mb="50px">
                <Button
                  type="submit"
                  disabled={messageTextIsEmpty}
                  mt="5px"
                  bg="#27415E"
                  color="white"
                  className="xeedev-button-desktop"
                >
                  Send
                </Button>
              </Flex>
            </form>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};

export default AblyChatComponent;
