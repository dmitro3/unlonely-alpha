import { useState, useCallback, useEffect, useRef } from "react";
import { NFC_FETCH_LIMIT } from "../components/NFCs/ChannelPageNfcsList";
import {
  GetChannelSearchResultsQuery,
  NfcFeedQuery,
} from "../generated/graphql";
import {
  Button,
  Center,
  Flex,
  Wrap,
  WrapItem,
  Text,
  Spinner,
  Input,
  useToast,
} from "@chakra-ui/react";
import NfcCard from "../components/NFCs/NfcCard";
import { useLazyQuery } from "@apollo/client";
import {
  GET_CHANNEL_SEARCH_RESULTS_QUERY,
  NFC_FEED_QUERY,
} from "../constants/queries";
import AppLayout from "../components/layout/AppLayout";
import Header from "../components/navigation/Header";
import { NFCS_SORT_QUERY_PARAM } from "../constants";
import { useRouter } from "next/router";
import { safeIncludes } from "../utils/safeFunctions";

const Nfcs = () => {
  const router = useRouter();

  const [loadingMore, setLoadingMore] = useState(false);
  const [channelNfcs, setChannelNfcs] = useState<NfcFeedQuery["getNFCFeed"]>(
    []
  );
  const [filteredNfcs, setFilteredNfcs] = useState<NfcFeedQuery["getNFCFeed"]>(
    []
  );
  const [pagesFetched, setPagesFetched] = useState(0);
  const [call, { loading }] = useLazyQuery(NFC_FEED_QUERY);
  const ref = useRef<HTMLDivElement>(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [fetchedUnderLimit, setFetchedUnderLimit] = useState(false);

  const [filterStreamer, setFilterStreamer] = useState("");
  const [filterClipper, setFilterClipper] = useState("");

  const [appliedFilterStreamer, setAppliedFilterStreamer] = useState("");
  const [appliedFilterClipper, setAppliedFilterClipper] = useState("");

  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "totalMints">("totalMints");

  const channelNfcsToUse = hasAppliedFilters ? filteredNfcs : channelNfcs;
  const toast = useToast();

  const [getChannelSearchResults] = useLazyQuery<GetChannelSearchResultsQuery>(
    GET_CHANNEL_SEARCH_RESULTS_QUERY
  );

  const applyFilters = useCallback(async () => {
    let newNfcResults = channelNfcs;
    if (filterStreamer.length > 0) {
      const res = await getChannelSearchResults({
        variables: {
          data: {
            query: filterStreamer,
            containsSlug: true,
            includeSoftDeletedChannels: true,
          },
        },
      });
      const matchingIds = (res?.data?.getChannelSearchResults ?? []).map(
        (c: any) => c?.id
      );
      console.log(matchingIds);
      newNfcResults = newNfcResults?.filter((nfc) =>
        safeIncludes(matchingIds, nfc?.channelId)
      );
    }
    if (filterClipper.length > 0) {
      newNfcResults = newNfcResults?.filter(
        (nfc) =>
          safeIncludes(
            nfc?.owner.username?.toLowerCase(),
            filterClipper?.toLowerCase()
          ) ||
          safeIncludes(
            nfc?.owner.address?.toLowerCase(),
            filterClipper?.toLowerCase()
          )
      );
    }
    if (filterStreamer.length === 0 && filterClipper.length === 0) {
      setAppliedFilterStreamer("");
      setAppliedFilterClipper("");
      setHasAppliedFilters(false);
      setFilteredNfcs([]);
      return;
    }
    setAppliedFilterStreamer(filterStreamer);
    setAppliedFilterClipper(filterClipper);
    setHasAppliedFilters(true);
    setFilteredNfcs(newNfcResults);
  }, [filterStreamer, filterClipper, channelNfcs]);

  const fetchNfcs = useCallback(
    async (orderBy: "createdAt" | "totalMints") => {
      const nfcsData = await call({
        variables: {
          data: {
            limit: NFC_FETCH_LIMIT,
            orderBy,
            offset: pagesFetched * NFC_FETCH_LIMIT,
          },
        },
      });
      const nfcs: NfcFeedQuery["getNFCFeed"] = nfcsData?.data?.getNFCFeed ?? [];
      const filteredNfcs = (nfcs ?? [])?.filter(
        (nfc): nfc is NonNullable<typeof nfc> =>
          nfc !== null && nfc !== undefined
      );
      if (pagesFetched > 1 && filteredNfcs.length < NFC_FETCH_LIMIT) {
        handleMaxNfcs();
      }
      setFetchedUnderLimit(filteredNfcs.length < NFC_FETCH_LIMIT);
      setPagesFetched((prev) => prev + 1);
      setChannelNfcs((prev) => [...(prev || []), ...filteredNfcs]);
    },
    [pagesFetched]
  );

  useEffect(() => {
    let orderBy: "createdAt" | "totalMints" = "totalMints";
    if (
      router.query[NFCS_SORT_QUERY_PARAM] &&
      typeof router.query[NFCS_SORT_QUERY_PARAM] === "string" &&
      safeIncludes(
        ["createdAt", "totalMints"],
        router.query[NFCS_SORT_QUERY_PARAM]
      )
    ) {
      orderBy = router.query[NFCS_SORT_QUERY_PARAM] as
        | "createdAt"
        | "totalMints";
      setSort(orderBy);
    }
    if (channelNfcs?.length === 0) fetchNfcs(orderBy);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        setShowNextButton(true);
      } else {
        setShowNextButton(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaX === 0) return;
      e.preventDefault();
      el.scrollTop += e.deltaY;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        setShowNextButton(true);
      } else {
        setShowNextButton(false);
      }
    };

    el.addEventListener("wheel", handleWheel);
    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [ref.current]);

  const handleMaxNfcs = () => {
    toast({
      title: "no more clips to fetch",
      status: "error",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <AppLayout isCustomHeader={false} noHeader>
      <Flex direction="column" height="100vh">
        <Header />
        <Flex px="20px" gap="10px">
          <Flex direction="column">
            <Input
              variant="glow"
              placeholder="filter for a streamer"
              value={filterStreamer}
              onChange={(e) => setFilterStreamer(e.target.value)}
            />
            {appliedFilterStreamer && <Text>{appliedFilterStreamer}</Text>}
          </Flex>
          <Flex direction="column">
            <Input
              variant="glow"
              placeholder="filter for a clipper"
              value={filterClipper}
              onChange={(e) => setFilterClipper(e.target.value)}
            />
            {appliedFilterClipper && <Text>{appliedFilterClipper}</Text>}
          </Flex>
          <Button onClick={applyFilters}>apply</Button>
        </Flex>
        {loading && !loadingMore ? (
          <Flex justifyContent={"center"}>
            <Spinner />
          </Flex>
        ) : (
          <Wrap
            ref={ref}
            spacing="30px"
            justify={"center"}
            overflowY={"scroll"}
            p="20px"
          >
            {channelNfcsToUse &&
              channelNfcsToUse.map((nfc) => (
                <WrapItem key={nfc?.id}>
                  <Center w="380px">
                    <NfcCard key={nfc?.id} nfc={nfc} />
                  </Center>
                </WrapItem>
              ))}
          </Wrap>
        )}
        {!fetchedUnderLimit && !hasAppliedFilters && (
          <Button
            opacity={showNextButton ? 1 : 0}
            transition={"all 0.3s"}
            bottom={showNextButton ? "50px" : 0}
            position="fixed"
            left="50%"
            transform="translateX(-50%)"
            onClick={async () => {
              setLoadingMore(true);
              await fetchNfcs(sort).then(() => {
                setShowNextButton(false);
              });
              setLoadingMore(false);
            }}
            bg={"rgba(55, 255, 139, 1)"}
          >
            <Text>{loadingMore ? <Spinner /> : "load more"}</Text>
          </Button>
        )}
      </Flex>
    </AppLayout>
  );
};

export default Nfcs;
