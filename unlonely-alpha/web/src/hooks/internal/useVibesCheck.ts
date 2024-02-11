import { useState, useEffect, useRef, useMemo } from "react";
import { Log, createPublicClient, parseAbiItem, http } from "viem";
import { useContractEvent } from "wagmi";
import { useApolloClient } from "@apollo/client";
import { base } from "viem/chains";

import { VibesTokenTx } from "../../constants/types";
import { GET_USER_QUERY } from "../../constants/queries";
import { getContractFromNetwork } from "../../utils/contract";
import useUserAgent from "./useUserAgent";
import { NETWORKS } from "../../constants/networks";

const CREATION_BLOCK = BigInt(9018023);

export const useVibesCheck = () => {
  const { isStandalone } = useUserAgent();
  // const publicClient = usePublicClient();
  const client = useApolloClient();
  const [tokenTxs, setTokenTxs] = useState<VibesTokenTx[]>([]);
  const [loading, setLoading] = useState(true);
  const contract = getContractFromNetwork("vibesTokenV1", NETWORKS[0]);
  const [chartTimeIndexes, setChartTimeIndexes] = useState<
    Map<string, {index: number | undefined, blockNumber: number | undefined}>
  >(new Map());
  const fetching = useRef(false);
  const [hashMapState, setHashMapState] = useState<Map<string, string>>(
    new Map()
  );

  const _getEnsName = async (address: `0x${string}`) => {
    try {
      const { data } = await client.query({
        query: GET_USER_QUERY,
        variables: { data: { address } },
      });
      return data.getUser.username ?? data.getUser.address;
    } catch (e) {
      return address;
    }
  };

  const eventQueueRef = useRef<Log[]>([]);

  const baseClient = useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: http(
          "https://base-mainnet.g.alchemy.com/v2/aR93M6MdEC4lgh4VjPXLaMnfBveve1fC"
        ),
      }),
    []
  );

  /**
   * These two useContractEvent calls are used to listen for mint and burn events
   * Every call is inportant and every piece of information returned should be in
   * the order they were initiated. Therefore, we will use a queue system to ensure
   * that the events are in the correct order, regardless of the individual status
   * per asynchronous call.
   */
  useContractEvent({
    address: contract.address,
    abi: contract.abi,
    eventName: loading ? undefined : "Mint",
    listener(logs) {
      console.log("Mint event detected", logs);
      const sortedLogs = logs.sort(
        (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
      );
      sortedLogs.forEach((log) => {
        eventQueueRef.current.push(log);
        if (eventQueueRef.current.length === 1) {
          processQueue();
        }
      });
    },
  });

  useContractEvent({
    address: contract.address,
    abi: contract.abi,
    eventName: loading ? undefined : "Burn",
    listener(logs) {
      console.log("Burn event detected", logs);
      const sortedLogs = logs.sort(
        (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
      );
      sortedLogs.forEach((log) => {
        eventQueueRef.current.push(log);
        if (eventQueueRef.current.length === 1) {
          processQueue();
        }
      });
    },
  });

  const processQueue = async () => {
    while (eventQueueRef.current.length > 0) {
      const log = eventQueueRef.current[0];
      await handleEvent(log);
      eventQueueRef.current.shift();
    }
  };

  const handleEvent = async (log: any) => {
    const eventName = log?.eventName;
    const n = Number(log?.args.totalSupply);
    const n_ = Math.max(n - 1, 0);
    const priceForCurrent = Math.floor((n * (n + 1) * (2 * n + 1)) / 6);
    const priceForPrevious = Math.floor((n_ * (n_ + 1) * (2 * n_ + 1)) / 6);
    const newPrice = priceForCurrent - priceForPrevious;

    const user =
      hashMapState.get(log?.args.account) ??
      (await _getEnsName(log?.args.account));
    if (!hashMapState.get(log?.args.account)) {
      setHashMapState((prev) => {
        return new Map([...prev, [log?.args.account, user]]);
      });
    }
    const previousTxPrice =
      tokenTxs.length > 0 ? tokenTxs[tokenTxs.length - 1].price : 0;
    const eventTx: VibesTokenTx = {
      eventName: eventName,
      user,
      amount: log?.args.amount,
      price: newPrice,
      blockNumber: Number(log?.blockNumber),
      supply: log?.args.totalSupply,
      priceChangePercentage:
        tokenTxs.length === 0
          ? 0
          : ((newPrice - previousTxPrice) / previousTxPrice) * 100,
    };
    console.log("detected", eventName, eventTx);
    setTokenTxs((prev) => {
      const newTokenTxs = insertElementSorted(prev, eventTx);
      console.log("newTokenTxs", newTokenTxs);
      return newTokenTxs;
    });
  };

  useEffect(() => {
    const getVibesEvents = async () => {
      if (
        !baseClient ||
        !contract.address ||
        fetching.current ||
        isStandalone
      ) {
        fetching.current = false;
        return;
      }
      fetching.current = true;
      const [mintLogs, burnLogs] = await Promise.all([
        baseClient.getLogs({
          address: contract.address,
          event: parseAbiItem(
            "event Mint(address indexed account, uint256 amount, address indexed streamerAddress, uint256 indexed totalSupply)"
          ),
          fromBlock: CREATION_BLOCK,
        }),
        baseClient.getLogs({
          address: contract.address,
          event: parseAbiItem(
            "event Burn(address indexed account, uint256 amount, address indexed streamerAddress, uint256 indexed totalSupply)"
          ),
          fromBlock: CREATION_BLOCK,
        }),
      ]);
      console.log("mintLogs length", mintLogs.length);
      console.log("burnLogs length", burnLogs.length);
      const logs = [...mintLogs, ...burnLogs];
      logs.sort((a, b) => {
        if (a.blockNumber === null || b.blockNumber === null) return 0;
        if (a.blockNumber < b.blockNumber) return -1;
        if (a.blockNumber > b.blockNumber) return 1;
        return 0;
      });
      const _tokenTxs: VibesTokenTx[] = [];
      const uniqueUsers = new Set<string>();
      for (let i = 0; i < logs.length; i++) {
        const event = logs[i];
        const n = Number(event.args.totalSupply);
        const n_ = Math.max(n - 1, 0);
        const priceForCurrent = Math.floor((n * (n + 1) * (2 * n + 1)) / 6);
        const priceForPrevious = Math.floor((n_ * (n_ + 1) * (2 * n_ + 1)) / 6);
        const newPrice = priceForCurrent - priceForPrevious;
        const previousTxPrice =
          _tokenTxs.length > 0 ? _tokenTxs[_tokenTxs.length - 1].price : 0;
        const tx: VibesTokenTx = {
          eventName: event.eventName,
          user: event.args.account as string,
          amount: event.args.amount as bigint,
          price: newPrice,
          blockNumber: Number(event.blockNumber),
          supply: event.args.totalSupply as bigint,
          priceChangePercentage:
            i > 0 && _tokenTxs.length > 0
              ? ((newPrice - previousTxPrice) / previousTxPrice) * 100
              : 0,
        };
        _tokenTxs.push(tx);
        uniqueUsers.add(tx.user);
      }
      const promises = Array.from(uniqueUsers).map((u) =>
        _getEnsName(u as `0x${string}`)
      );
      const names = await Promise.all(promises).then((res) => {
        return res;
      });
      const nameHashMap = createHashmap(
        Array.from(uniqueUsers),
        names as string[]
      );
      const namedTokenTxs = _tokenTxs.map((tx: VibesTokenTx) => {
        return {
          ...tx,
          user: nameHashMap.get(tx.user) ?? tx.user,
        };
      });
      fetching.current = false;
      console.log("setting token txs,", namedTokenTxs.length, "count");
      setHashMapState(nameHashMap);
      setTokenTxs(namedTokenTxs);
      setLoading(false);
    };
    getVibesEvents();
  }, [baseClient, contract.address]);

  useEffect(() => {
    const init = async () => {
      if (tokenTxs.length === 0) return;

      const SECONDS_IN_A_MINUTE = 60;
      const MINUTES_IN_AN_HOUR = 60;
      const HOURS_IN_A_DAY = 24;
      const DAYS_IN_A_WEEK = 7;
      const AVERAGE_BLOCK_TIME_SECS = 2;
      const currentBlockNumber = await baseClient.getBlockNumber();

      const blockNumberSixtyDaysAgo =
        currentBlockNumber -
        BigInt(60 * HOURS_IN_A_DAY * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberThirtyDaysAgo =
        currentBlockNumber -
        BigInt(30 * HOURS_IN_A_DAY * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberTwoWeeksAgo =
        currentBlockNumber -
        BigInt((2 * DAYS_IN_A_WEEK * HOURS_IN_A_DAY * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberOneWeekAgo =
        currentBlockNumber - BigInt((DAYS_IN_A_WEEK * HOURS_IN_A_DAY * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberOneDayAgo = currentBlockNumber - BigInt((HOURS_IN_A_DAY * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      const dayIndex =
        blockNumberOneDayAgo < CREATION_BLOCK
          ? undefined
          : binarySearchIndex(tokenTxs, blockNumberOneDayAgo);

      const blockNumberEighteenHoursAgo = currentBlockNumber - BigInt((18 * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberTwelveHoursAgo = currentBlockNumber - BigInt((12 * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberSixHoursAgo = currentBlockNumber - BigInt((6 * MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      const blockNumberOneHourAgo = currentBlockNumber - BigInt((MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE) / AVERAGE_BLOCK_TIME_SECS);

      setChartTimeIndexes(
        new Map([
          ["day", {index: dayIndex, blockNumber: Number(blockNumberOneDayAgo)}],
          ["7day", {index: undefined, blockNumber: Number(blockNumberOneWeekAgo)}],
          ["14day", {index: undefined, blockNumber: Number(blockNumberTwoWeeksAgo)}],
          ["30day", {index: undefined, blockNumber: Number(blockNumberThirtyDaysAgo)}],
          ["60day", {index: undefined, blockNumber: Number(blockNumberSixtyDaysAgo)}],
          ["18hour", {index: undefined, blockNumber: Number(blockNumberEighteenHoursAgo)}],
          ["12hour", {index: undefined, blockNumber: Number(blockNumberTwelveHoursAgo)}],
          ["6hour", {index: undefined, blockNumber: Number(blockNumberSixHoursAgo)}],
          ["1hour", {index: undefined, blockNumber: Number(blockNumberOneHourAgo)}],
        ])
      );
    };
    init();
  }, [tokenTxs.length]);

  return { tokenTxs, chartTimeIndexes, loading };
};

function createHashmap<K, V>(keys: K[], values: V[]): Map<K, V> {
  if (keys.length !== values.length) {
    throw new Error("Keys and values arrays must be of the same length");
  }

  const map = new Map<K, V>();
  keys.forEach((key, index) => {
    map.set(key, values[index]);
  });

  return map;
}

function binarySearchIndex(arr: VibesTokenTx[], target: bigint): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid].blockNumber === Number(target)) {
      // Target found, return its index
      return mid;
    } else if (arr[mid].blockNumber < Number(target)) {
      // Search in the right half
      left = mid + 1;
    } else {
      // Search in the left half
      right = mid - 1;
    }
  }

  // Target not found, return the insertion position
  return left;
}

function insertElementSorted(arr: VibesTokenTx[], newElement: VibesTokenTx) {
  // Find the insertion index
  let insertIndex = arr.length;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].blockNumber <= newElement.blockNumber) {
      // Found the position to insert
      insertIndex = i + 1;
      break;
    }
  }

  return [...arr.slice(0, insertIndex), newElement, ...arr.slice(insertIndex)];
}
