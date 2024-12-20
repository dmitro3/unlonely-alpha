import { Box, Flex } from "@chakra-ui/react";

import NextHead from "../layout/NextHead";
import { useChat } from "../../hooks/chat/useChat";
import { TabsComponent } from "./TabsComponent";
import { ChatBot } from "../../constants/types";

const styles = `
  html, body {
    background: transparent !important;
  }

  *, *:before, *:after {
    -webkit-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
    -webkit-user-drag: none !important;  
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
`;

const PopOutChatComponent = ({ chatBot }: { chatBot: ChatBot[] }) => {
  const chat = useChat({ chatBot });

  return (
    <Box flexDirection="column" height="100dvh" flexWrap="nowrap">
      <style>{styles}</style>
      <NextHead title="Unlonely Chat" description="" image="">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </NextHead>
      <div
        style={{
          height: "100svh",
          position: "relative",
        }}
      >
        <Flex bg={"#19162F"} h={"100%"} direction="column">
          <TabsComponent chat={chat} />
        </Flex>
      </div>
    </Box>
  );
};

export default PopOutChatComponent;
