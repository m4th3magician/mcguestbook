"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
}

export function SimpleWalletConnect({
  onWalletChange,
}: {
  onWalletChange: (wallet: WalletState) => void
}) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
  })

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        })

        const newWallet = {
          isConnected: true,
          address: accounts[0],
          chainId: Number.parseInt(chainId, 16),
        }

        setWallet(newWallet)
        onWalletChange(newWallet)

        toast({
          title: "Wallet Connected",
          description: "Successfully connected to your wallet!",
        })
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "No Wallet Found",
        description: "Please install MetaMask or another Web3 wallet.",
        variant: "destructive",
      })
    }
  }

  const disconnectWallet = () => {
    const newWallet = {
      isConnected: false,
      address: null,
      chainId: null,
    }

    setWallet(newWallet)
    onWalletChange(newWallet)

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div>
      {!wallet.isConnected ? (
        <Button onClick={connectWallet} className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      ) : (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Connected Wallet</p>
            <Badge variant="secondary" className="font-mono">
              {formatAddress(wallet.address || "")}
            </Badge>
          </div>
          <Button onClick={disconnectWallet} variant="outline">
            Disconnect
          </Button>
        </div>
      )}
    </div>
  )
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
