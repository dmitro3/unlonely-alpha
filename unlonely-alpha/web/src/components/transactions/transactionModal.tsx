import {
  Button,
  Modal,
  ModalOverlay,
  Text,
  Center,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Spinner,
  AlertIcon,
  Alert,
  AlertDescription,
  AlertTitle,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { MATIC_NEWSTOKEN_ADDRESS } from "../../constants";
import NewsToken from "../../utils/newsToken.json";
import NewsContract from "../../utils/newsContractABI.json";
import { UseContractWriteArgs } from "wagmi/dist/declarations/src/hooks/contracts/useContractWrite";
import { BigNumber } from "ethers";
import { useDebounce } from "usehooks-ts";
type Props = {
  onSuccess: (hash: string) => void;
};

const price = 500;

export default function TransactionModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const accountData = useAccount();
  const {
    data: data3,
    error: error3,
    isLoading: loading3,
  } = useContractRead({
    addressOrName: MATIC_NEWSTOKEN_ADDRESS,
    contractInterface: NewsToken,
    functionName: "balanceOf",
    args: [accountData?.address],
    chainId: 137,
  });

  const {
    data: allowance,
    error: allowanceError,
    isLoading: allowanceLoading,
  } = useContractRead({
    addressOrName: MATIC_NEWSTOKEN_ADDRESS,
    contractInterface: NewsToken,
    functionName: "allowance",
    args: [accountData?.address],
    chainId: 137,
  });

  const { config: transferConfig } = usePrepareContractWrite({
    addressOrName: MATIC_NEWSTOKEN_ADDRESS,
    contractInterface: NewsToken,
    functionName: "transfer",
    args: [MATIC_NEWSTOKEN_ADDRESS, price],
    enabled: Boolean(price),
    onError: (err) => {
      console.log("transfer err", err);
      setStep(0);
    },
  });
  const { data: transferData, write: transferWrite } =
    useContractWrite(transferConfig);
  const { config } = usePrepareContractWrite({
    addressOrName: MATIC_NEWSTOKEN_ADDRESS,
    contractInterface: NewsToken,
    functionName: "approve",
    args: [accountData?.address, price],
    enabled: Boolean(price),
    onError: (err) => {
      console.log("approve err", err);
      setStep(0);
    },
  });

  const { data, error, isError, writeAsync } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });
  const {
    isLoading: transferLoading,
    isSuccess: isTransferSuccess,
    error: transferError,
  } = useWaitForTransaction({
    hash: transferData?.hash,
  });

  useEffect(() => {
    try {
      if (isSuccess) {
        setStep(1);
        transferWrite && transferWrite();
      }
      if (error) {
        console.log("isApproveError", error.message);
        setStep(0);
      }
    } catch (e) {
      console.log("error in is approve update", e);
      setStep(0);
    }
  }, [isSuccess]);

  useEffect(() => {
    try {
      if (isTransferSuccess) {
        setOpen(false);
        setStep(0);
        onSuccess && onSuccess(transferData?.hash as string);
      }
      if (transferError) {
        console.log("isTransferError", transferError.message);
        transferWrite && transferWrite();
      }
    } catch (e) {
      console.log("error in is transfer update", e);
      setStep(0);
    }
  }, [isTransferSuccess, transferError]);
  const handleTransaction = async () => {
    try {
      if (allowance && parseInt(allowance.toString()) >= price) {
        setStep(1);
        transferWrite && transferWrite();
      } else {
        writeAsync && (await writeAsync());
      }
    } catch (e) {
      console.log("error in handle transaction", e);
    }
  };
  return (
    <>
      <Center>
        <Button justifyContent="" onClick={() => setOpen(true)}>
          Buy Content
        </Button>
      </Center>
      <Modal
        isCentered={true}
        isOpen={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <ModalOverlay />
        <ModalContent>
          {!isLoading && !transferLoading ? (
            <>
              <ModalHeader>
                {step === 1
                  ? "Please accept transfer transaction"
                  : "Change the stream overlay"}
              </ModalHeader>
              <ModalCloseButton />
              <ModalFooter justifyContent="space-between">
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    handleTransaction();
                  }}
                  disabled={
                    step === 1 || (data3 && parseInt(data3.toString()) < price)
                  }
                  colorScheme="green"
                >
                  Make purchase
                </Button>
              </ModalFooter>{" "}
            </>
          ) : (
            <ModalBody
              m="2"
              justifyContent="center"
              justifyItems="center"
              alignItems="center"
            >
              {
                <Text mb={5} align="center">
                  {isLoading
                    ? "Waiting for approval transaction..."
                    : "waiting for transfer..."}
                </Text>
              }
              <Center mb={5}>
                <Spinner />
              </Center>{" "}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
