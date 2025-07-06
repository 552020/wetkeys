export const USDCReceiverABI = [
  {
    type: "function",
    name: "payForFile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fileId", type: "string" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
