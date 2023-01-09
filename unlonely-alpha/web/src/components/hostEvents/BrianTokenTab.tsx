import { Box, Flex, Text, Stack, Image } from "@chakra-ui/react";
import Link from "next/link";

import usePostStreamInteraction from "../../hooks/usePostStreamInteraction";
import { ChatBot } from "../../pages/channels/brian";
import { CustomToast } from "../general/CustomToast";
import TransactionModal from "../transactions/transactionModal";

type Props = {
  setChatBot: (chatBot: ChatBot[]) => void;
  chatBot: ChatBot[];
};

const BrianTokenTab: React.FunctionComponent<Props> = ({
  chatBot,
  setChatBot,
}) => {
  const { postStreamInteraction, loading: postChatLoading } =
    usePostStreamInteraction({});
  const { addToast } = CustomToast();
  return (
    <Flex direction="column">
      <Flex justify="space-between">
        <Text color="black" fontSize="xl" mt={2} align="center">
          Set a random scene.
        </Text>

        <TransactionModal
          title="Randomize Scene"
          chatBot={chatBot}
          setChatBot={setChatBot}
          onSuccess={async (hash) => {
            try {
              addToast({
                render: (
                  <Box
                    as="button"
                    borderRadius="md"
                    bg="green"
                    px={4}
                    h={8}
                    color="white"
                  >
                    <Link
                      target="_blank"
                      href={`https://etherscan.io/tx/${hash}`}
                      passHref
                    >
                      <a target="_blank">Transaction approved, click to view</a>
                    </Link>
                  </Box>
                ),
              });
              await postStreamInteraction({ interactionType: "scene-change" });
              // wait 3 seconds then setChatBot
            } catch (e) {}
          }}
        />
      </Flex>
      <Stack mb={2} justify="start" direction="row" spacing={5}>
        <Image
          width={250}
          height={125}
          alt="Unlonely one"
          src="/images/unlonelyone.jpg"
        />
        <Image
          width={250}
          height={125}
          alt="Unlonely one"
          src="/images/unlonely2.jpg"
        />
        <Image
          width={250}
          height={125}
          alt="Unlonely one"
          src="/images/unlonely3.jpg"
        />
      </Stack>
      <Text color="black" fontSize="lg" align="center">
        ... and many more!
      </Text>
    </Flex>
  );
};

export default BrianTokenTab;