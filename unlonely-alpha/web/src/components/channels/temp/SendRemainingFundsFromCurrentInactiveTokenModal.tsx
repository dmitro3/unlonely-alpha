import { Button, Flex, Input, Spinner, Text, Tooltip } from "@chakra-ui/react";
import { TransactionModalTemplate } from "../../transactions/TransactionModalTemplate";
import { useSendRemainingFundsToWinnerState } from "../../../hooks/internal/temp-token/write/useSendRemainingFundsToWinnerState";
import { useTempTokenContext } from "../../../hooks/context/useTempToken";

export const SendRemainingFundsFromCurrentInactiveTokenModal = ({
  title,
  handleClose,
  isOpen,
  callbackOnTxSuccess,
}: {
  title: string;
  handleClose: () => void;
  isOpen: boolean;
  callbackOnTxSuccess: () => void;
}) => {
  const { tempToken } = useTempTokenContext();
  const { currentTempTokenContract } = tempToken;

  const {
    sendRemainingFundsToWinnerAfterTokenExpiration,
    loading: sendRemainingFundsToWinnerAfterTokenExpirationTxLoading,
    handleWinnerChange,
    winner,
    resolvedAddress,
  } = useSendRemainingFundsToWinnerState(
    currentTempTokenContract,
    callbackOnTxSuccess
  );

  return (
    <TransactionModalTemplate
      title={title}
      handleClose={handleClose}
      isOpen={isOpen}
      hideFooter
      bg={"#18162F"}
    >
      <Flex direction="column" gap="5px">
        <Text>Please provide an address or an ENS to send it</Text>
        <Tooltip
          placement="top"
          shouldWrapChildren
          isOpen={resolvedAddress}
          isDisabled={!resolvedAddress}
          label={`This ENS points to ${resolvedAddress}`}
          bg="#078410"
        >
          <Input
            variant="glow"
            value={winner}
            onChange={(e) => handleWinnerChange(e.target.value)}
          />
        </Tooltip>
        <Button
          isDisabled={
            sendRemainingFundsToWinnerAfterTokenExpirationTxLoading ||
            !sendRemainingFundsToWinnerAfterTokenExpiration
          }
          onClick={sendRemainingFundsToWinnerAfterTokenExpiration}
        >
          {sendRemainingFundsToWinnerAfterTokenExpirationTxLoading ? (
            <Spinner />
          ) : (
            "send"
          )}
        </Button>
      </Flex>
    </TransactionModalTemplate>
  );
};
