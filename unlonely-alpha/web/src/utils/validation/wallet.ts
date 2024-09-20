import { isAddressEqual, isAddress as isEthereumAddress } from "viem"; // Assuming "viem" is a library for Ethereum address validation

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const isBase58 = (address: string): boolean => {
    for (let i = 0; i < address.length; i++) {
        if (!BASE58_ALPHABET.includes(address[i])) {
            return false;
        }
    }
    return true;
};

export const isValidAddress = (address: string): "ethereum" | "solana" | undefined => {
    // Check if the address is a valid Ethereum address
    if (isEthereumAddress(address)) {
        return "ethereum";
    }

    // Check if the address is a valid Solana address
    if (address.length === 44 && isBase58(address)) {
        return "solana";
    }

    return undefined;
};

export const areAddressesEqual = (a: string, b: string ) => {

    // if both are ethereum addresses, compare using viem's compare function, 
    // else treat them as solana addresses that are case sensitive
    if (isEthereumAddress(a) && isEthereumAddress(b)) return isAddressEqual(a, b)
    return a === b
}