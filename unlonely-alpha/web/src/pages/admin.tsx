import { Button, Flex, Input, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { formatUnits, isAddress, parseUnits } from "viem";

import AppLayout from "../components/layout/AppLayout";
import { filteredInput } from "../utils/validation/input";
import AdminNotifications from "../components/general/AdminNotifications";
import { useNetworkContext } from "../hooks/context/useNetwork";
import {
  useEndTournament,
  useGenerateKey,
  useReadMappings,
  useReadPublic,
  useSelectTournamentWinner,
  useSetFeeDestination,
  useSetProtocolFeePercent,
  useSetSubjectFeePercent,
  useSetTournamentFeePercent,
  useStartTournament,
} from "../hooks/contracts/useTournament";
import { getContractFromNetwork } from "../utils/contract";

export default function AdminPage() {
  // const { user } = useUser();
  // const { network } = useNetworkContext();
  // const { localNetwork } = network;
  // const contract = getContractFromNetwork("unlonelyArcade", localNetwork);
  // const { admins } = useAdmins(contract);

  // const isAdmin = useMemo(() => {
  //   if (admins !== undefined && user?.address) {
  //     const userAddress = user.address;
  //     return admins.some((admin) => userAddress === admin);
  //   }
  //   return false;
  // }, [user, admins]);

  return (
    <AppLayout isCustomHeader={false}>
      <AdminContent />
      {/* {isAdmin && <AdminContent />}
      {!isAdmin && <Text>You're not supposed to be here.</Text>} */}
    </AppLayout>
  );
}

const AdminContent = () => {
  const toast = useToast();
  const { network } = useNetworkContext();
  const { localNetwork } = network;
  const contract = getContractFromNetwork("unlonelyTournament", localNetwork);
  const [streamerAddress, setStreamerAddress] = useState<string>("");
  const [_protocolFeeDestination, set_ProtocolFeeDestination] =
    useState<string>("");
  const [_subjectFeePercent, set_SubjectFeePercent] = useState<string>("");
  const [_tournamentFeePercent, set_TournamentFeePercent] =
    useState<string>("");
  const [_protocolFeePercent, set_ProtocolFeePercent] = useState<string>("");
  // const { explorerUrl } = network;
  // const [creatorTokenAddress, setCreatorTokenAddress] = useState<string>("");
  // const [creatorTokenSymbol, setCreatorTokenSymbol] = useState<string>("");
  // const [creatorTokenName, setCreatorTokenName] = useState<string>("");
  // const [channelId, setChannelId] = useState<string>("");
  // const [newCreatorTokenAddress, setNewCreatorTokenAddress] =
  //   useState<string>("");
  // const [tokenOwnerAddress, setTokenOwnerAddress] = useState<string>("");

  // const [buyTokenAmount, setBuyTokenAmount] = useState<string>("");
  // const [featurePrice, setFeaturePrice] = useState<string>("");
  // const [initialPrice, setInitialPrice] = useState<string>("");
  // const [newTokenPricesStr, setNewTokenPricesStr] = useState<string>("");
  // const [creatorTokenAddressesStr, setCreatorTokenAddressesStr] =
  //   useState<string>("");

  // const buyTokenAmount_bigint = useMemo(
  //   () => parseUnits(formatIncompleteNumber(buyTokenAmount) as `${number}`, 18),
  //   [buyTokenAmount]
  // );

  // const {
  //   refetch: refetchPublic,
  //   creatorToken,
  //   tokenPrice,
  //   tokenOwner,
  // } = useReadPublic(contract, creatorTokenAddress as `0x${string}`);

  // const { amountIn } = useCalculateEthAmount(
  //   creatorTokenAddress as `0x${string}`,
  //   contract,
  //   buyTokenAmount_bigint
  // );

  // const {
  //   requiresApproval,
  //   writeApproval,
  //   isTxLoading: isApprovalLoading,
  //   refetchAllowance,
  // } = useApproval(
  //   creatorTokenAddress as `0x${string}`,
  //   CreatorTokenAbi,
  //   tokenOwner as `0x${string}`,
  //   contract?.address as `0x${string}`,
  //   contract?.chainId as number,
  //   buyTokenAmount_bigint,
  //   undefined,
  //   {
  //     onWriteSuccess: (data) => {
  //       toast({
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.hash}`}
  //               passHref
  //             >
  //               approve pending, click to view
  //             </Link>
  //           </Box>
  //         ),
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //       });
  //     },
  //     onTxSuccess: (data) => {
  //       toast({
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.transactionHash}`}
  //               passHref
  //             >
  //               approve success, click to view
  //             </Link>
  //           </Box>
  //         ),
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //       });
  //       refetchPublic();
  //     },
  //   }
  // );

  // const {
  //   addCreatorToken,
  //   addCreatorTokenData,
  //   addCreatorTokenTxData,
  //   addCreatorTokenTxLoading,
  // } = useAddCreatorToken(
  //   {
  //     creatorTokenAddress: newCreatorTokenAddress as `0x${string}`,
  //     initialPrice: parseUnits(
  //       formatIncompleteNumber(initialPrice) as `${number}`,
  //       18
  //     ),
  //     tokenOwner: tokenOwnerAddress as `0x${string}`,
  //   },
  //   contract,
  //   {
  //     onWriteSuccess: (data) => {
  //       toast({
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.hash}`}
  //               passHref
  //             >
  //               addCreatorToken pending, click to view
  //             </Link>
  //           </Box>
  //         ),
  //       });
  //     },
  //     onTxSuccess: (data) => {
  //       toast({
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.transactionHash}`}
  //               passHref
  //             >
  //               addCreatorToken success, click to view
  //             </Link>
  //           </Box>
  //         ),
  //       });
  //       refetchPublic();
  //     },
  //   }
  // );

  // const { createCreatorToken } = useCreateCreatorToken({
  //   onError: (error: any) => {
  //     // console.log(error);
  //   },
  // });

  // const handleCreateCreatorToken = async () => {
  //   if (!addCreatorToken) return;
  //   // first call smart contract
  //   await addCreatorToken();
  //   // then call our database
  //   await createCreatorToken({
  //     address: newCreatorTokenAddress as `0x${string}`,
  //     symbol: creatorTokenSymbol,
  //     name: creatorTokenName,
  //     price: Number(initialPrice),
  //     channelId: channelId,
  //   });
  // };

  // const { useFeature, useFeatureData, useFeatureTxData, useFeatureTxLoading } =
  //   useUseFeature(
  //     {
  //       creatorTokenAddress: creatorTokenAddress as `0x${string}`,
  //       featurePrice: parseUnits(
  //         formatIncompleteNumber(featurePrice) as `${number}`,
  //         18
  //       ),
  //     },
  //     contract,
  //     {
  //       onWriteSuccess: (data) => {
  //         toast({
  //           render: () => (
  //             <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
  //               <Link
  //                 target="_blank"
  //                 href={`${explorerUrl}/tx/${data.hash}`}
  //                 passHref
  //               >
  //                 useFeature pending, click to view
  //               </Link>
  //             </Box>
  //           ),
  //           duration: 9000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //       },
  //       onTxSuccess: (data) => {
  //         toast({
  //           render: () => (
  //             <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
  //               <Link
  //                 target="_blank"
  //                 href={`${explorerUrl}/tx/${data.transactionHash}`}
  //                 passHref
  //               >
  //                 useFeature success, click to view
  //               </Link>
  //             </Box>
  //           ),
  //           duration: 9000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //         refetchPublic();
  //       },
  //     }
  //   );

  // const {
  //   buyCreatorToken,
  //   buyCreatorTokenData,
  //   buyCreatorTokenTxData,
  //   buyCreatorTokenTxLoading,
  // } = useBuyCreatorToken(
  //   {
  //     creatorTokenAddress: creatorTokenAddress as `0x${string}`,
  //     amountIn,
  //     amountOut: buyTokenAmount_bigint,
  //   },
  //   contract,
  //   {
  //     onWriteSuccess: (data) => {
  //       toast({
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.hash}`}
  //               passHref
  //             >
  //               buyCreatorToken pending, click to view
  //             </Link>
  //           </Box>
  //         ),
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //       });
  //     },
  //     onTxSuccess: (data) => {
  //       toast({
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.transactionHash}`}
  //               passHref
  //             >
  //               buyCreatorToken success, click to view
  //             </Link>
  //           </Box>
  //         ),
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //       });
  //       refetchPublic();
  //     },
  //   }
  // );

  // const { updateUserCreatorTokenQuantity } = useUpdateUserCreatorTokenQuantity({
  //   onError: (error: any) => {
  //     // console.log(error);
  //   },
  // });

  // const handleBuyCreatorToken = async () => {
  //   if (!buyCreatorToken) return;
  //   // first call smart contract
  //   await buyCreatorToken();
  //   // then call our database
  //   await updateUserCreatorTokenQuantity({
  //     tokenAddress: creatorTokenAddress as `0x${string}`,
  //     purchasedAmount: Number(buyTokenAmount),
  //   });
  // };

  // const {
  //   setTokenPrices,
  //   setTokenPricesData,
  //   setTokenPricesTxData,
  //   setTokenPricesTxLoading,
  // } = useSetTokenPrices(
  //   {
  //     creatorTokens: creatorTokenAddressesStr.split(",") as `0x${string}`[],
  //     newPrices: newTokenPricesStr
  //       .split(",")
  //       .map((p) => parseUnits(formatIncompleteNumber(p) as `${number}`, 18)),
  //   },
  //   contract,
  //   {
  //     onWriteSuccess: async (data) => {
  //       toast({
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#287ab0" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.hash}`}
  //               passHref
  //             >
  //               setTokenPrices pending, click to view
  //             </Link>
  //           </Box>
  //         ),
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //       });
  //     },
  //     onTxSuccess: async (data) => {
  //       // then call our database
  //       await Promise.all(
  //         creatorTokenAddressesStr
  //           .split(",")
  //           .map(async (tokenAddress, index) => {
  //             await updateCreatorTokenPrice({
  //               tokenAddress: tokenAddress as `0x${string}`,
  //               price: Number(newTokenPricesStr.split(",")[index]),
  //             });
  //           })
  //       );
  //       toast({
  //         render: () => (
  //           <Box as="button" borderRadius="md" bg="#50C878" px={4} h={8}>
  //             <Link
  //               target="_blank"
  //               href={`${explorerUrl}/tx/${data.transactionHash}`}
  //               passHref
  //             >
  //               setTokenPrices success, click to view
  //             </Link>
  //           </Box>
  //         ),
  //         duration: 9000,
  //         isClosable: true,
  //         position: "top-right",
  //       });
  //       refetchPublic();
  //     },
  //   }
  // );

  // const { updateCreatorTokenPrice } = useUpdateCreatorTokenPrice({
  //   onError: (error: any) => {
  //     // console.log(error);
  //   },
  // });

  // const handleSetTokenPrices = async () => {
  //   if (
  //     !setTokenPrices ||
  //     newTokenPricesStr.split(",").length !==
  //       creatorTokenAddressesStr.split(",").length
  //   )
  //     return;
  //   // first call smart contract
  //   await setTokenPrices();
  // };

  const {
    refetch,
    tournament,
    protocolFeeDestination,
    protocolFeePercent,
    subjectFeePercent,
    tournamentFeePercent,
  } = useReadPublic(contract);

  const { key, refetch: refetchKey } = useGenerateKey(
    streamerAddress as `0x${string}`,
    0,
    contract
  );

  const {
    setFeeDestination,
    setFeeDestinationData,
    setFeeDestinationTxData,
    setFeeDestinationTxLoading,
  } = useSetFeeDestination(
    { feeDestination: _protocolFeeDestination as `0x${string}` },
    contract
  );

  const {
    setProtocolFeePercent,
    setProtocolFeePercentData,
    setProtocolFeePercentTxData,
    setProtocolFeePercentTxLoading,
  } = useSetProtocolFeePercent(
    {
      feePercent: parseUnits(_protocolFeePercent as `${number}`, 18),
    },
    contract
  );

  const {
    setSubjectFeePercent,
    setSubjectFeePercentData,
    setSubjectFeePercentTxData,
    setSubjectFeePercentTxLoading,
  } = useSetSubjectFeePercent(
    {
      feePercent: parseUnits(_subjectFeePercent as `${number}`, 18),
    },
    contract
  );

  const {
    setTournamentFeePercent,
    setTournamentFeePercentData,
    setTournamentFeePercentTxData,
    setTournamentFeePercentTxLoading,
  } = useSetTournamentFeePercent(
    {
      feePercent: parseUnits(_tournamentFeePercent as `${number}`, 18),
    },
    contract
  );

  const {
    refetch: getData,
    vipBadgeSupply,
    isTournamentCreator,
  } = useReadMappings(key, contract);

  useEffect(() => {
    getData();
  }, [key]);

  const {
    startTournament,
    startTournamentData,
    startTournamentTxData,
    startTournamentTxLoading,
    refetchStartTournament,
  } = useStartTournament(contract);

  const {
    selectTournamentWinner,
    selectTournamentWinnerData,
    selectTournamentWinnerTxData,
    selectTournamentWinnerTxLoading,
    refetchSelectTournamentWinner,
  } = useSelectTournamentWinner(
    {
      streamerAddress: streamerAddress as `0x${string}`,
      eventId: 0,
    },
    contract
  );

  const {
    endTournament,
    endTournamentData,
    endTournamentTxData,
    endTournamentTxLoading,
    refetchEndTournament,
  } = useEndTournament(contract);

  const handleInputChange = (
    event: any,
    callback: (str: string) => void,
    allowDecimals?: boolean
  ) => {
    const input = event.target.value;
    const filtered = filteredInput(input, allowDecimals);
    callback(filtered);
  };

  // useEffect(() => {
  //   if (creatorTokenAddress) refetchAllowance();
  // }, [buyCreatorTokenTxLoading, isApprovalLoading]);

  return (
    <Flex direction="column" p="10px" gap="20px" bg="#636363">
      <Flex>{localNetwork.config.name}</Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        tournament
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>isActive</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={tournament.isActive ? "true" : "false"}
          />
        </VStack>
        <VStack>
          <Text>isPayoutClaimable</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={tournament.isPayoutClaimable ? "true" : "false"}
          />
        </VStack>
        <VStack>
          <Text>winningBadge</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={tournament.winningBadge}
          />
        </VStack>
        <VStack>
          <Text>vipPooledEth</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={String(tournament.vipPooledEth)}
          />
        </VStack>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        setFeeDestination
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>current</Text>
          <Input
            width="400px"
            variant="glow"
            readOnly
            value={protocolFeeDestination}
          />
        </VStack>
        <VStack>
          <Text>new</Text>
          <Input
            width="400px"
            variant="glow"
            isInvalid={!isAddress(_protocolFeeDestination)}
            value={_protocolFeeDestination}
            onChange={(e) => set_ProtocolFeeDestination(e.target.value)}
          />
        </VStack>
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={setFeeDestination}
          isDisabled={!setFeeDestination}
        >
          Send
        </Button>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        setProtocolFeePercent
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>current</Text>
          <Input
            width="400px"
            variant="glow"
            readOnly
            value={formatUnits(protocolFeePercent, 18)}
          />
        </VStack>
        <VStack>
          <Text>new</Text>
          <Input
            width="400px"
            variant="glow"
            value={_protocolFeePercent}
            onChange={(e) => set_ProtocolFeePercent(e.target.value)}
          />
        </VStack>
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={setProtocolFeePercent}
          isDisabled={!setProtocolFeePercent}
        >
          Send
        </Button>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        setSubjectFeePercent
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>current</Text>
          <Input
            width="400px"
            variant="glow"
            readOnly
            value={formatUnits(subjectFeePercent, 18)}
          />
        </VStack>
        <VStack>
          <Text>new</Text>
          <Input
            width="400px"
            variant="glow"
            value={_subjectFeePercent}
            onChange={(e) => set_SubjectFeePercent(e.target.value)}
          />
        </VStack>
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={setSubjectFeePercent}
          isDisabled={!setSubjectFeePercent}
        >
          Send
        </Button>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        setTournamentFeePercent
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>current</Text>
          <Input
            width="400px"
            variant="glow"
            readOnly
            value={formatUnits(tournamentFeePercent, 18)}
          />
        </VStack>
        <VStack>
          <Text>new</Text>
          <Input
            width="400px"
            variant="glow"
            value={_tournamentFeePercent}
            onChange={(e) => set_TournamentFeePercent(e.target.value)}
          />
        </VStack>
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={setTournamentFeePercent}
          isDisabled={!setTournamentFeePercent}
        >
          Send
        </Button>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        key
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>streamerAddress</Text>
          <Input
            width="400px"
            variant="glow"
            isInvalid={!isAddress(streamerAddress)}
            value={streamerAddress}
            onChange={(e) => setStreamerAddress(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>generated key</Text>
          <Input width="400px" variant="glow" readOnly value={key} />
        </VStack>
        <VStack>
          <Text>vipBadgeSupply</Text>
          <Input
            width="200px"
            variant="glow"
            readOnly
            value={String(vipBadgeSupply)}
          />
        </VStack>
        <VStack>
          <Text>isTournamentCreator</Text>
          <Input
            width="200px"
            variant="glow"
            readOnly
            value={isTournamentCreator ? "true" : "false"}
          />
        </VStack>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        startTournament
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={startTournament}
          isDisabled={!startTournament}
        >
          Send
        </Button>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        selectTournamentWinner
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>streamerAddress</Text>
          <Input
            width="400px"
            variant="glow"
            isInvalid={!isAddress(streamerAddress)}
            value={streamerAddress}
            onChange={(e) => setStreamerAddress(e.target.value)}
          />
        </VStack>
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={selectTournamentWinner}
          isDisabled={!selectTournamentWinner}
        >
          Send
        </Button>
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        endTournament
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <Button
          bg="#131323"
          _hover={{}}
          _focus={{}}
          _active={{}}
          onClick={endTournament}
          isDisabled={!endTournament}
        >
          Send
        </Button>
      </Flex>
      {/* <Text fontSize="25px" fontFamily="LoRes15">
        addCreatorToken
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>new creator token address</Text>
          <Input
            variant="glow"
            readOnly={addCreatorTokenTxLoading}
            width="300px"
            isInvalid={!isAddress(newCreatorTokenAddress)}
            value={newCreatorTokenAddress}
            onChange={(e) => setNewCreatorTokenAddress(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>symbol</Text>
          <Input
            variant="glow"
            readOnly={addCreatorTokenTxLoading}
            width="96px"
            value={creatorTokenSymbol}
            onChange={(e) => setCreatorTokenSymbol(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>name</Text>
          <Input
            variant="glow"
            readOnly={addCreatorTokenTxLoading}
            width="128px"
            value={creatorTokenName}
            onChange={(e) => setCreatorTokenName(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>channelId</Text>
          <Input
            variant="glow"
            readOnly={addCreatorTokenTxLoading}
            width="64px"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>how much eth will this new token cost?</Text>
          <Input
            width="128px"
            variant="glow"
            readOnly={addCreatorTokenTxLoading}
            value={initialPrice}
            onChange={(e) => handleInputChange(e, setInitialPrice, true)}
          />
        </VStack>
        <VStack>
          <Text>what is the address of the token owner?</Text>
          <Input
            width="400px"
            variant="glow"
            readOnly={addCreatorTokenTxLoading}
            value={tokenOwnerAddress}
            onChange={(e) => setTokenOwnerAddress(e.target.value)}
          />
        </VStack>
        {addCreatorTokenTxLoading ? (
          <Spinner />
        ) : (
          <Button
            bg="#131323"
            _hover={{}}
            _focus={{}}
            _active={{}}
            onClick={handleCreateCreatorToken}
            isDisabled={!addCreatorToken}
          >
            Send
          </Button>
        )}
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        useFeature
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>existing creator token address</Text>
          <Input
            variant="glow"
            readOnly={useFeatureTxLoading}
            width="400px"
            isInvalid={!isAddress(creatorTokenAddress)}
            value={creatorTokenAddress}
            onChange={(e) => setCreatorTokenAddress(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>owner</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={tokenOwner !== NULL_ADDRESS ? tokenOwner : ""}
          />
        </VStack>
        <VStack>
          <Text>how much of this token does this feature cost?</Text>
          <Input
            variant="glow"
            readOnly={useFeatureTxLoading}
            width="250px"
            value={featurePrice}
            onChange={(e) => handleInputChange(e, setFeaturePrice)}
          />
        </VStack>
        {useFeatureTxLoading ? (
          <Spinner />
        ) : (
          <Button
            bg="#131323"
            _hover={{}}
            _focus={{}}
            _active={{}}
            onClick={useFeature}
            isDisabled={!isAddress(creatorTokenAddress) || !useFeature}
          >
            Send
          </Button>
        )}
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        buyCreatorToken
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>existing creator token address</Text>
          <Input
            width="400px"
            variant="glow"
            readOnly={buyCreatorTokenTxLoading}
            isInvalid={!isAddress(creatorTokenAddress)}
            value={creatorTokenAddress}
            onChange={(e) => setCreatorTokenAddress(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>owner</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={tokenOwner !== NULL_ADDRESS ? tokenOwner : ""}
          />
        </VStack>
        <VStack>
          <Text>how much of this creator token do you want to buy?</Text>
          <Input
            width="500px"
            variant="glow"
            readOnly={buyCreatorTokenTxLoading}
            value={buyTokenAmount}
            onChange={(e) => handleInputChange(e, setBuyTokenAmount)}
          />
        </VStack>
        <VStack>
          <Text>{tokenPrice ? "price found" : "price not found"}</Text>
          <Input
            width="200px"
            variant="glow"
            isReadOnly
            value={
              tokenPrice
                ? `${formatUnits(tokenPrice ?? BigInt(0), 18)} ETH`
                : ""
            }
          />
        </VStack>
        {buyCreatorTokenTxLoading ? (
          <Spinner />
        ) : (
          <Button
            bg="#131323"
            _hover={{}}
            _focus={{}}
            _active={{}}
            onClick={handleBuyCreatorToken}
            isDisabled={!isAddress(creatorTokenAddress) || !buyCreatorToken}
          >
            Send
          </Button>
        )}
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        setTokenPrices
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>existing creator tokens</Text>
          <Input
            placeholder="0x1234...,0x5678..."
            variant="glow"
            readOnly={setTokenPricesTxLoading}
            width="400px"
            isInvalid={
              creatorTokenAddressesStr
                .split(",")
                .filter((address) => !isAddress(address)).length > 0
            }
            value={creatorTokenAddressesStr}
            onChange={(e) => setCreatorTokenAddressesStr(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>how much ETH will these tokens cost?</Text>
          <Input
            placeholder="0.0005,0.0015,1200,..."
            variant="glow"
            readOnly={setTokenPricesTxLoading}
            width="500px"
            value={newTokenPricesStr}
            onChange={(e) => setNewTokenPricesStr(e.target.value)}
          />
        </VStack>
        {setTokenPricesTxLoading ? (
          <Spinner />
        ) : (
          <Button
            bg="#131323"
            _hover={{}}
            _focus={{}}
            _active={{}}
            onClick={handleSetTokenPrices}
            isDisabled={
              !setTokenPrices ||
              newTokenPricesStr.split(",").length !==
                creatorTokenAddressesStr.split(",").length
            }
          >
            Send
          </Button>
        )}
      </Flex>
      <Text fontSize="25px" fontFamily="LoRes15">
        approve (owners only)
      </Text>
      <Flex gap={"10px"} alignItems="flex-end">
        <VStack>
          <Text>existing creator token address</Text>
          <Input
            variant="glow"
            readOnly={isApprovalLoading}
            width="400px"
            isInvalid={!isAddress(creatorTokenAddress)}
            value={creatorTokenAddress}
            onChange={(e) => setCreatorTokenAddress(e.target.value)}
          />
        </VStack>
        <VStack>
          <Text>owner</Text>
          <Input
            variant="glow"
            width="300px"
            isReadOnly
            value={tokenOwner !== NULL_ADDRESS ? tokenOwner : ""}
          />
        </VStack>
        <VStack>
          <Text>
            {"(owners only) how much of this token should go on sale?"}
          </Text>
          <Input
            variant="glow"
            readOnly={isApprovalLoading}
            width="500px"
            value={buyTokenAmount}
            onChange={(e) => handleInputChange(e, setBuyTokenAmount)}
          />
        </VStack>
        <VStack>
          <Text>needs approval?</Text>
          <Input
            width="200px"
            variant="glow"
            isReadOnly
            value={requiresApproval ? "yes" : "no"}
            bg={requiresApproval ? "red" : "inherit"}
          />
        </VStack>
        {isApprovalLoading ? (
          <Spinner />
        ) : (
          <Button
            bg="#131323"
            _hover={{}}
            _focus={{}}
            _active={{}}
            onClick={writeApproval}
            isDisabled={!isAddress(creatorTokenAddress) || !writeApproval}
          >
            Send
          </Button>
        )}
      </Flex> */}
      <Text fontSize="25px" fontFamily="LoRes15">
        admin notifications
      </Text>
      <AdminNotifications />
    </Flex>
  );
};
