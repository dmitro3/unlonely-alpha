import { Flex } from "@chakra-ui/react";
import React from "react";

import MessageBody from "./MessageBody";
import { Message } from "./types";

type Props = {
  messages: Message[];
  channel: any;
};

const MessageList = ({ messages, channel }: Props) => {
  return (
    <>
      {messages.length > 0 ? (
        <>
          {messages.map((message, index) => {
            if (message.name !== "chat-message") return null;
            const messageText = message.data.messageText;
            // regex to check if message is a link
            const isLink = messageText.match(
              /((https?:\/\/)|(www\.))[^\s/$.?#].[^\s]*/g
            )
              ? true
              : false;
            // if isLink true, remove link from message
            let splitURL: string[] | undefined = undefined;
            if (isLink) {
              // detect link at end of message, split into array [message, link].
              splitURL = messageText.split(/(?:http:\/\/|https:\/\/|www\.)/g);
              // add https:// to link
              splitURL[splitURL.length - 1] = `https://${
                splitURL[splitURL.length - 1]
              }`;
            }

            return (
              <div key={index}>
                <MessageBody index={index} message={message} messageText={messageText} isLink={isLink} splitURL={splitURL} channel={channel}/>
              </div>
            );
          })}
        </>
      ) : (
        <>
          <Flex flexDirection="row">
            {"No messages to show. Messages delete every 48 hrs."}
          </Flex>
        </>
      )}
    </>
  );
}

export default MessageList;