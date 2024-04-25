import { useToast, Box } from "@chakra-ui/react";
import Link from "next/link";
import { decodeEventLog } from "viem";
import { useNetworkContext } from "../../../context/useNetwork";
import useUpdateTempTokenHasHitTotalSupplyThreshold from "../../../server/temp-token/useUpdateTempTokenHasHitTotalSupplyThreshold";
import { useCallback, useEffect, useState } from "react";
import { useUpdateTotalSupplyThreshold } from "../../../contracts/useTempTokenV1";
import { useTempTokenContext } from "../../../context/useTempToken";

export const useOwnerUpdateTotalSupplyThresholdState = (
  onSuccess?: () => void
) => {
  const { tempToken } = useTempTokenContext();
  const { currentTempTokenContract } = tempToken;
  const { network } = useNetworkContext();
  const { localNetwork, explorerUrl } = network;
  const toast = useToast();

  const [newSupplyThreshold, setNewSupplyThreshold] = useState<bigint>(
    BigInt(0)
  );

  const {
    updateTempTokenHasHitTotalSupplyThreshold:
      call_updateDb_hasHitTotalSupplyThreshold,
    loading: updateTempTokenHasHitTotalSupplyThresholdLoading,
  } = useUpdateTempTokenHasHitTotalSupplyThreshold({
    onError: (e) => {
      console.log("useUpdateTempTokenHasHitTotalSupplyThreshold", e);
    },
  });

  const {
    updateTotalSupplyThreshold,
    updateTotalSupplyThresholdData,
    updateTotalSupplyThresholdTxData,
    updateTotalSupplyThresholdTxLoading,
    isRefetchingUpdateTotalSupplyThreshold,
  } = useUpdateTotalSupplyThreshold(
    {
      newThreshold: newSupplyThreshold,
    },
    currentTempTokenContract,
    {
      onWriteSuccess: (data) => {
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.hash}`}
                passHref
              >
                setTotalSupplyThresholdForTokens pending, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setNewSupplyThreshold(BigInt(0));
      },
      onWriteError: (error) => {
        console.log("setTotalSupplyThresholdForTokens error", error);
        toast({
          duration: 9000,
          isClosable: true,
          position: "top-right",
          render: () => (
            <Box as="button" borderRadius="md" bg="#bd711b" px={4} h={8}>
              setTotalSupplyThresholdForTokens cancelled
            </Box>
          ),
        });
        setNewSupplyThreshold(BigInt(0));
      },
      onTxSuccess: async (data) => {
        await call_updateDb_hasHitTotalSupplyThreshold({
          tokenAddressesSetTrue: [],
          tokenAddressesSetFalse: [currentTempTokenContract.address],
          chainId: localNetwork.config.chainId,
        });
        const topics = decodeEventLog({
          abi: currentTempTokenContract.abi,
          data: data.logs[0].data,
          topics: data.logs[0].topics,
        });
        const args: any = topics.args;
        console.log("setTotalSupplyThresholdForTokens success", data, args);
        setNewSupplyThreshold(BigInt(0));
        onSuccess && onSuccess();
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
              <Link
                target="_blank"
                href={`${explorerUrl}/tx/${data.transactionHash}`}
                passHref
              >
                setTotalSupplyThresholdForTokens success, click to view
              </Link>
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      },
      onTxError: (error) => {
        console.log("setTotalSupplyThresholdForTokens error", error);
        toast({
          render: () => (
            <Box as="button" borderRadius="md" bg="#b82929" px={4} h={8}>
              setTotalSupplyThresholdForTokens error
            </Box>
          ),
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        setNewSupplyThreshold(BigInt(0));
      },
    }
  );

  const callSetTotalSupplyThresholdForTokens = useCallback(
    async (newSupplyThreshold: bigint) => {
      setNewSupplyThreshold(newSupplyThreshold);
    },
    []
  );

  useEffect(() => {
    if (newSupplyThreshold === BigInt(0)) return;
    updateTotalSupplyThreshold?.();
  }, [newSupplyThreshold, updateTotalSupplyThreshold]);

  return {
    callSetTotalSupplyThresholdForTokens,
    updateTotalSupplyThresholdData,
    updateTotalSupplyThresholdTxData,
    loading:
      isRefetchingUpdateTotalSupplyThreshold ||
      updateTotalSupplyThresholdTxLoading ||
      updateTempTokenHasHitTotalSupplyThresholdLoading,
  };
};