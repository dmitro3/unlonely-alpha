import { gql, useQuery } from "@apollo/client";
import { Text, Flex, Button, SimpleGrid, Spinner } from "@chakra-ui/react";

import HostEventCard from "../components/hostEvents/HostEventCard";
import AppLayout from "../components/layout/AppLayout";
import { HostEventCard_HostEventFragment } from "../generated/graphql";

const HOSTEVENT_FEED_QUERY = gql`
  query HostEventFeed($data: HostEventFeedInput!) {
    getHostEventFeed(data: $data) {
      id
      hostDate
      title
      description
      score
      owner {
        username
        FCImageUrl
      }
      liked
      disliked
      challenge {
        id
        hostDate
        title
        description
        score
        owner {
          username
          FCImageUrl
        }
        liked
        disliked
      }
    }
  }
`;

export default function Page() {
  const { data, loading, error } = useQuery(HOSTEVENT_FEED_QUERY, {
    variables: {
      data: {
        limit: 5,
        orderBy: null,
      },
    },
  });

  const hostEvents = data?.getHostEventFeed;

  return (
    <AppLayout>
      <Flex justifyContent="center">
        <Flex
          marginTop={{ base: "40px", md: "60px", lg: "100px" }}
          maxW="80%"
          flexDirection="column"
        >
          <Text
            color="black"
            fontSize={{ base: "40px", md: "60px", lg: "80px" }}
            lineHeight={{ base: "40px", md: "60px", lg: "80px" }}
            fontWeight="bold"
            textAlign="center"
          >
            Never watch alone again. Come be{" "}
            <Text as="span" color="white">
              unlonely
            </Text>{" "}
            with us.
          </Text>
          <Flex w="100%" justifyContent="center" mt="10px" mb="20px">
            <SimpleGrid columns={[1]} spacing="40px">
                <Flex w="100%" justifyContent="center">
                  <Button
                    variantColor="white"
                    bgGradient="linear(to-r, #d16fce, #7655D2, #4173D6, #4ABBDF)"
                    variant="outline"
                    size="lg"
                    minW="50%"
                    h="50px"
                    borderRadius="20px"
                    mt="10px"
                    mb="10px"
                    pr="10px"
                    pl="10px"
                    color="white"
                    _hover={{ bg: "white", color: "black" }}
                    onClick={() => {
                      window.location.href = "/channels/brian";
                    }}
                  >
                    Join Now!
                  </Button>
                </Flex>
            </SimpleGrid>
          </Flex>
          {!hostEvents || loading ? (
          <Flex width="100%" justifyContent="center">
            <Spinner />
          </Flex>
        ) : (
          <>
            <Flex width="100%" justifyContent="center" alignItems="center" direction="column">
              {hostEvents?.map((h: HostEventCard_HostEventFragment) => !!h && <HostEventCard key={h.id} hostEvent={h} />)}
            </Flex>
          </>
        )}
        </Flex>
      </Flex>
    </AppLayout>
  );
}

export async function getStaticProps() {
  return { props: {} };
}
