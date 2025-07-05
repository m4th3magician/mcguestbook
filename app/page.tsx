"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { BookOpen, Wallet, MessageSquare, Users, Plus } from "lucide-react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { SimpleWalletConnect } from "./simple-wallet-connect"

const GUESTBOOK_CONTRACT = "0xf38dc33B61AA315F38b685AC145e64FE0d2D4cc4"

const GUESTBOOK_ABI = [
  {
    inputs: [{ name: "message", type: "string" }],
    name: "signMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "signer", type: "address" },
      { indexed: false, internalType: "string", name: "message", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "MessageSigned",
    type: "event",
  },
] as const

interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
}

interface GuestbookEntry {
  signer: string
  name: string
  eventId: string
  message: string
  timestamp: string
  ensName: string
}

export default function GuestbookApp() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
  })
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [eventId, setEventId] = useState("")
  const [entries, setEntries] = useState<GuestbookEntry[]>([])

  const fetchGuestBookMessages = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const guestBook = new ethers.Contract(GUESTBOOK_CONTRACT, GUESTBOOK_ABI, provider)
      const filter = guestBook.filters.MessageSigned()
      const logs = await guestBook.queryFilter(filter, 0, "latest")
  
      const ensCache = new Map<string, string>() // cache: signer address -> ens/display name
  
      const mapped = await Promise.all(
        logs.map(async (log: any) => {
          const {  message, timestamp } = log.args
          const signer = '0x179A862703a4adfb29896552DF9e307980D19285';
          let parsed = { name: "Anonymous", eventId: "N/A", message }
  
          try {
            parsed = JSON.parse(message)
          } catch (err) {
            // fallback to raw message
          }
  
          let displayName = ensCache.get(signer)
          if (!displayName) {
            const ensName = await provider.lookupAddress(signer)
            displayName = ensName || formatAddress(signer)
            ensCache.set(signer, displayName)
          }
  
          return {
            signer,
            name: parsed.name || "Anonymous",
            eventId: parsed.eventId || "N/A",
            message: parsed.message || message,
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            ensName: displayName,
          }
        })
      )
  
      setEntries(mapped.reverse())
    } catch (err) {
      console.error("Error fetching messages:", err)
    }
  }
  

  const handleWalletChange = (newWallet: WalletState) => {
    setWallet(newWallet)
  }

  const handleAddEntry = async () => {
    if (!name.trim() || !eventId.trim() || !message.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all fields before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!wallet.isConnected || !wallet.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(GUESTBOOK_CONTRACT, GUESTBOOK_ABI, signer)

      const payload = JSON.stringify({
        name: name.trim(),
        eventId: eventId.trim(),
        message: message.trim(),
      })

      const tx = await contract.signMessage(payload)
      await tx.wait()

      toast({
        title: "Message Signed!",
        description: "Your message has been recorded on the blockchain.",
      })

      setName("")
      setEventId("")
      setMessage("")
      fetchGuestBookMessages()
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error?.reason || "Could not sign your message.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchGuestBookMessages()
  }, [])

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Onchain Guestbook</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Leave a permanent message on the Ethereum blockchain.
          </p>
        </div>

        {/* Wallet Connect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>Connect your wallet to sign a message</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleWalletConnect onWalletChange={handleWalletChange} />
          </CardContent>
        </Card>

        {/* Add Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Sign the Guestbook
            </CardTitle>
            <CardDescription>Your message will be stored forever via Ethereum logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              className="w-full p-2 border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!wallet.isConnected}
            />
            <input
              type="text"
              placeholder="Event ID"
              className="w-full p-2 border rounded"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={!wallet.isConnected}
            />
            <Textarea
              placeholder="Your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!wallet.isConnected}
              rows={4}
            />
            <Button
              onClick={handleAddEntry}
              disabled={!wallet.isConnected || !message.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Sign Message
            </Button>
            {!wallet.isConnected && (
              <p className="text-sm text-gray-500 text-center">Connect your wallet to sign a message</p>
            )}
          </CardContent>
        </Card>

        {/* Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Guestbook Entries
              <Badge variant="secondary" className="ml-auto">
                <Users className="h-3 w-3 mr-1" />
                {entries.length} entries
              </Badge>
            </CardTitle>
            <CardDescription>Blockchain messages from all signers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Be the first!</p>
                </div>
              ) : (
                entries.map((entry, idx) => (
                  <div key={idx}>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {entry.ensName}
                          </Badge>
                          <span className="text-sm text-gray-500">{entry.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-indigo-700">{entry.name}</p>
                      <p className="text-xs text-gray-500">Event ID: {entry.eventId}</p>
                      <p className="text-gray-700 leading-relaxed">{entry.message}</p>
                    </div>
                    {idx < entries.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Powered by Ethereum and public logs 🪶</p>
        </div>
      </div>
    </div>
  )
}