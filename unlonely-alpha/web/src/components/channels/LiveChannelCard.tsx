import { Text, Flex } from "@chakra-ui/layout";
import { Box, Image, Stack } from "@chakra-ui/react";

import { Channel } from "../../generated/graphql";

const unlonelyAvatar = "https://i.imgur.com/MNArpwV.png";

type Props = {
  channel: Channel;
};

const LiveChannelCard = ({ channel }: Props) => {
  const handleRedirect = () => {
    window.location.href = `/channels/${channel.slug}`;
  };

  if (!channel.isLive) return null;

  return (
    <>
      <Flex
        direction="column"
        padding="0.3rem"
        borderRadius="1rem"
        minH="8rem"
        w={{ base: "16rem", sm: "25rem", md: "25rem", lg: "25rem" }}
        onClick={handleRedirect}
        bg={"#131323"}
        p={"10px"}
      >
        <Flex
          _hover={{
            filter: "brightness(80%)",
            position: "relative",
          }}
        >
          {channel.thumbnailUrl && (
            <Box position="relative">
              <Image
                src={channel.thumbnailUrl}
                // width={["300px", "500px"]}
                // height={["168px", "281px"]}
                borderRadius={"10px"}
                boxShadow="0px 4px 16px rgba(208, 234, 53, 0.4)"
              />
              <Image
                src="/images/playIcon.png"
                opacity={0.5}
                style={
                  {
                    position: "absolute",
                    zIndex: 1,
                    visibility: "visible",
                    margin: "auto",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  } as React.CSSProperties
                }
              />
            </Box>
          )}
        </Flex>
        <Flex direction="row" justifyContent="left" mt="1rem"></Flex>
        <Flex justifyContent="space-between" flexDirection="column">
          <Stack direction="column">
            <Stack direction="row" alignItems={"center"}>
              <Flex
                p="1px"
                bg={
                  "repeating-linear-gradient(#E2F979 0%, #B0E5CF 34.37%, #BA98D7 66.67%, #D16FCE 100%)"
                }
                borderRadius="10px"
                boxShadow="0px 4px 16px rgba(208, 234, 53, 0.4)"
              >
                <Flex
                  bg={"#131323"}
                  borderRadius="10px"
                  px="10px"
                  whiteSpace="nowrap"
                >
                  🔴 Live
                </Flex>
              </Flex>
              <Text
                fontSize={20}
                fontWeight="bold"
                noOfLines={2}
                textShadow="rgba(208, 234, 53, 0.4) 1px 0 5px"
              >
                {channel.name}
              </Text>
            </Stack>
            <Text
              fontSize={12}
              fontWeight="medium"
              noOfLines={4}
              textShadow="rgba(208, 234, 53, 0.4) 1px 0 5px"
            >
              {channel.description}
            </Text>
            <Flex mt="1.2rem">
              <Image
                height="1.5rem"
                width="1.5rem"
                objectFit="cover"
                src={
                  channel.owner.FCImageUrl
                    ? channel.owner.FCImageUrl
                    : unlonelyAvatar
                }
                borderRadius="full"
                mr="0.5rem"
              />
              <Text
                fontSize="16px"
                noOfLines={1}
                fontWeight="light"
                textAlign="center"
                textShadow="rgba(208, 234, 53, 0.4) 1px 0 5px"
                color={"#D094FF"}
              >
                {channel.owner.username}
              </Text>
            </Flex>
          </Stack>
        </Flex>
      </Flex>
    </>
  );
};

export default LiveChannelCard;
