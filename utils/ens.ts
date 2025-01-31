import { Provider } from "ethers";

export async function resolveEns(
  provider: Provider,
  ensName: string
): Promise<string | null> {
  try {
    const address = await provider.resolveName(ensName);
    return address;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return null;
  }
}

export async function lookupEnsName(
  provider: Provider,
  address: string
): Promise<string | null> {
  try {
    const ensName = await provider.lookupAddress(address);
    return ensName;
  } catch (error) {
    console.error("Error looking up ENS name for address:", error);
    return null;
  }
}
