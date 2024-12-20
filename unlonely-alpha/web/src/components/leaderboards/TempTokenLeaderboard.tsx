import { useLazyQuery } from "@apollo/client";
import { GET_TEMP_TOKENS_QUERY } from "../../constants/queries";
import { GetTempTokensQuery, TempToken } from "../../generated/graphql";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNetworkContext } from "../../hooks/context/useNetwork";
import {
  Button,
  Flex,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
} from "@chakra-ui/react";
import { truncateValue } from "../../utils/tokenDisplayFormatting";
import { formatUnits } from "viem";
import { useCacheContext } from "../../hooks/context/useCache";
import { bondingCurveBigInt } from "../../utils/contract";

const headers = ["rank", "token", "channel", "price"];

const ITEMS_PER_PAGE = 10;

const TempTokenLeaderboard = () => {
  const { network } = useNetworkContext();
  const { localNetwork } = network;
  const { ethPriceInUsd } = useCacheContext();

  const visibleColumns = useBreakpointValue({
    base: [1, 3],
    sm: [0, 1, 3],
    md: [0, 1, 2, 3],
    lg: [0, 1, 2, 3],
  });

  const [getTempTokensQuery, { loading, data, error }] =
    useLazyQuery<GetTempTokensQuery>(GET_TEMP_TOKENS_QUERY, {
      fetchPolicy: "network-only",
    });

  const [page, setPage] = useState(0);

  const dataset = useMemo(
    () =>
      (data?.getTempTokens ?? [])?.filter(
        (token): token is TempToken => token !== null
      ),
    [data]
  );

  const datasetSorted = useMemo(() => {
    return dataset
      .map((token) => {
        const n = BigInt(token.totalSupply);
        const n_ = n > BigInt(0) ? n - BigInt(1) : BigInt(0);
        const priceForCurrent = bondingCurveBigInt(n);
        const priceForPrevious = bondingCurveBigInt(n_);
        const basePrice = token.minBaseTokenPrice;
        const newPrice = priceForCurrent - priceForPrevious + BigInt(basePrice);
        return {
          ...token,
          price: newPrice,
        };
      })
      .sort((a, b) => {
        const nA = Number(a.price);
        const nB = Number(b.price);
        if (nA !== nB) return nB - nA;
        return b.endUnixTimestamp - a.endUnixTimestamp;
      });
  }, [dataset]);

  const completedDataRows = useMemo(() => {
    return datasetSorted.map((token, index) => {
      return {
        data: [
          `${index + page * ITEMS_PER_PAGE + 1}`,
          token.symbol,
          token.channel.slug,
          `$${truncateValue(
            Number(formatUnits(token.price, 18)) * Number(ethPriceInUsd),
            4
          )}`,
        ],
      };
    });
  }, [datasetSorted, ethPriceInUsd]);

  const rowsPaginated = useMemo(() => {
    return completedDataRows.slice(
      page * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
    );
  }, [completedDataRows, page]);

  const fetch = useCallback(() => {
    getTempTokensQuery({
      variables: {
        data: {
          chainId: localNetwork.config.chainId,
          onlyTradeableTokens: true,
          fulfillAllNotAnyConditions: true,
        },
      },
    });
  }, [localNetwork]);

  useEffect(() => {
    fetch();
  }, [localNetwork]);

  return (
    <Flex
      direction="column"
      width="100%"
      bg="#131323"
      py="15px"
      borderRadius={"10px"}
    >
      <Text
        fontSize={{ base: "30px", lg: "40px" }}
        fontWeight="400"
        textAlign={"center"}
        fontFamily={"LoRes15"}
      >
        Token Leaderboard
      </Text>
      {error ? (
        <Flex justifyContent={"center"}>
          <Text>Cannot fetch data</Text>
        </Flex>
      ) : loading ? (
        <Flex justifyContent={"center"} p="10px">
          <Spinner />
        </Flex>
      ) : (
        <>
          {dataset.length > 0 ? (
            <Flex direction="column" gap="10px">
              <TableContainer overflowX={"auto"} my="10px">
                <Table variant="unstyled">
                  <Thead>
                    <Tr>
                      {visibleColumns &&
                        visibleColumns.map((i) => (
                          <Th
                            textTransform={"lowercase"}
                            fontSize={["20px", "24px"]}
                            p="10px"
                            textAlign="center"
                            borderBottom="1px solid #615C5C"
                            key={i}
                          >
                            {headers[i]}
                          </Th>
                        ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rowsPaginated.map((row, rowIndex) => {
                      return (
                        <Tr key={rowIndex}>
                          {visibleColumns &&
                            visibleColumns.map((index) => (
                              <Td
                                _hover={
                                  visibleColumns[index] === 1 ||
                                  visibleColumns[index] === 2
                                    ? { background: "#615C5C", color: "white" }
                                    : undefined
                                }
                                onClick={() => {
                                  if (visibleColumns[index] === 1) {
                                    window.open(
                                      `${window.location.origin}/token/${
                                        datasetSorted[
                                          page * ITEMS_PER_PAGE + rowIndex
                                        ].chainId
                                      }/${
                                        datasetSorted[
                                          page * ITEMS_PER_PAGE + rowIndex
                                        ].tokenAddress
                                      }`,
                                      "_blank"
                                    );
                                  }
                                  if (visibleColumns[index] === 2) {
                                    window.open(
                                      `${window.location.origin}/channels/${row.data[2]}`,
                                      "_blank"
                                    );
                                  }
                                }}
                                fontSize={["20px", "24px"]}
                                p="10px"
                                textAlign="center"
                                key={index}
                              >
                                {row.data[index]}
                              </Td>
                            ))}
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
              <Flex justifyContent={"center"} gap="10px" alignItems={"center"}>
                <Button
                  height="25px"
                  width="100px"
                  onClick={() => {
                    setPage(page - 1);
                  }}
                  isDisabled={page === 0}
                >
                  prev
                </Button>
                <Text>{page + 1}</Text>
                <Button
                  height="25px"
                  width="100px"
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  isDisabled={rowsPaginated.length < ITEMS_PER_PAGE}
                >
                  next
                </Button>
              </Flex>
            </Flex>
          ) : (
            <Flex direction="column" justifyContent="center" gap="5px">
              <Text textAlign={"center"}>No active tokens to show</Text>
              <Button mx="auto" onClick={fetch}>
                check again
              </Button>
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
};

export default TempTokenLeaderboard;
