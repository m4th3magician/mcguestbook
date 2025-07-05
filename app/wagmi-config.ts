import { createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http("https://eth-mainnet.g.alchemy.com/v2/demo"),
    [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/demo"),
  },
})
