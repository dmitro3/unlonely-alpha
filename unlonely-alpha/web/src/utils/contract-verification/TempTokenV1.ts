import axios from "axios"

export const verifyTempTokenV1OnBase = async (tempTokenContractAddress: `0x${string}`, encodedConstructorArguments: string) => {

    const solidityCodeAsText = await fetch("/contracts/TempTokenV1Flattened.sol").then((res) => res.text())

    const postData = {
        "apikey": "YI2EP6PXGKQ614AJABB3W5FRG8TSG539E9",
        "module": "contract",
        "action": "verifysourcecode",
        "sourceCode": solidityCodeAsText, // this is a flattened version of the contract
        "contractaddress": tempTokenContractAddress,
        "contractname": "TempTokenV1",
        "codeformat": "solidity-single-file",
        "compilerversion": "v0.8.8+commit.dddeac2f", // this is the complier version that should match the version on hardhat config
        "optimizationUsed": "0",
        "runs": "200",
        "licensetype": "3", // 3 stands for the MIT license
        "constructorArguements": encodedConstructorArguments,
    }

    axios.post("https://api.basescan.org/api", postData).then(async (res) => {
        console.log(res.data)

        const status = res.data.status;
        const result = res.data.result;
        if (status === "1") {
            await new Promise(resolve => setTimeout(resolve, 5000))
            await checkVerificationStatusOnBase(result)
        } else {
            return { status: "error", message: "An error occurred while verifying the contract on BaseScan", result: null }
        }
    }).catch((err) => {
        console.error(err)
        return { status: "error", message: "An error occurred while verifying the contract on BaseScan", result: null }
    })
}

export const checkVerificationStatusOnBase = async (globalUniqueIdentifierForVerification: string) => {
    // Prepare query parameters
    const params = new URLSearchParams({
        apikey: "YI2EP6PXGKQ614AJABB3W5FRG8TSG539E9",
        module: "contract",
        action: "checkverifystatus",
        guid: globalUniqueIdentifierForVerification,
    });

    try {
        const res = await axios.get(`https://api.basescan.org/api?${params.toString()}`);
        console.log(res.data);

        const status = res.data.status;
        const message = res.data.message;
        const result = res.data.result;
        return { status, message, result };
    } catch (err) {
        console.error(err);
        return { status: "error", message: "An error occurred while checking the verification status on BaseScan", result: null };
    }
}