import { Flex } from "@chakra-ui/react";
import { BooPackageButton } from "./BooPackageButton";
import { ChatReturnType } from "../../hooks/chat/useChat";

const carePackageNames = ["water", "flashlight"];

export const BooCarePackages = ({
  dateNow,
  chat,
  booPackageMap,
  userBooPackageCooldowns,
  fetchUserBooPackageCooldownMapping,
}: {
  dateNow: number;
  chat: ChatReturnType;
  booPackageMap: any;
  userBooPackageCooldowns: any;
  fetchUserBooPackageCooldownMapping: any;
}) => {
  return (
    <Flex flexWrap={"wrap"} justifyContent={"space-evenly"}>
      {carePackageNames.map((name) => (
        <BooPackageButton
          key={name}
          chat={chat}
          cooldownInSeconds={booPackageMap?.[name]?.cooldownInSeconds ?? 0}
          userBooPackageCooldowns={userBooPackageCooldowns}
          dateNow={dateNow}
          packageInfo={{ name, isCarePackage: true }}
          fetchUserBooPackageCooldownMapping={
            fetchUserBooPackageCooldownMapping
          }
        />
      ))}
    </Flex>
  );
};
