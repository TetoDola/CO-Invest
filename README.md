## CO-INVEST: DeFi Vault Platform

**(ONLY ON BASE APP OR FARCASTER APP)**

**💡 In simple terms:** Co-Invest lets anyone invest alongside proven managers through secure on-chain vaults — gas-free, transparent, and verifiable. You deposit USDC, the manager trades within strict limits, and you automatically earn proportional rewards.

**🔍 Transaction Proof on Mainnet:**

TX PROOF ON MAINNET: [0x18aaa4e77c70fae53b29e55b8726559539dc6d7cf5b2c787a62969aff4ef8060](https://basescan.org/tx/0x18aaa4e77c70fae53b29e55b8726559539dc6d7cf5b2c787a62969aff4ef8060)

---

### Why This Transaction Matters

This transaction demonstrates our platform’s key features:

* **Account Abstraction (AA)** via EntryPoint 0.6.0 (`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`)
* **Gasless execution** through sponsored transactions

**Token Flow Breakdown:**

* **Input:** 0.431584 USDC ($0.43) from user `0x048ef1062cbb39B338Ac2685dA72adf104b4cEF5`
* **Swap:** USDC → 0.00011 WETH via Uniswap V4 Universal Router
* **Rewards:** 4.637023 ZORA distributed from Uniswap V4 Pool Manager

  * Majority to the user as trading rewards
  * 0.075261 ZORA → protocol treasury
  * 0.037630 ZORA → validator split
* **Bonus:** 2,562.421 *Cabbage tokens* minted to the user’s vault position

**Why these tokens exist:**

* **WETH:** Base asset for vault operations
* **ZORA:** User trading rewards tracked by sender address
* **Cabbage:** Extra incentive token tied to vault performance

**Security Constraints:**

* Slippage < 0.5%
* Bundled transactions for gas efficiency
* Reward distribution verified via sender address

---
## Technical Implementation Overview

### 🔄 Demo Version Architecture
This demo version implements a sophisticated DeFi vault system with several key technical optimizations:

1. **Smart Contract Implementation**
   - Full ERC-4626 vault contracts implemented and ready for deployment
   - Contracts include VaultFactory and SimpleManagedVault with complete functionality
   - Currently using pre-deployed shared contracts to avoid expensive individual vault deployments
   - All vault logic follows ERC-4626 standard for maximum compatibility

2. **Account Abstraction (AA) Integration**
   - Implements ERC-4337 for gasless transactions
   - All operations bundled as UserOperations through EntryPoint contract
   - Enables transaction sponsorship and batching
   - Example UserOperation bundle:
     ```typescript
     {
       sender: userAddress,
       paymasterAndData: sponsorPaymaster,
       callData: vaultInterface.encodeFunctionData("deposit", [amount]),
       ...AA_PARAMS
     }
     ```

3. **Transaction Processing**
   - Operations executed through default vault addresses
   - Maintains full on-chain verification and transparency
   - Transactions bundled and sponsored through EntryPoint
   - Example transaction flow:
     ```
     User Action -> AA Bundle -> EntryPoint -> Vault Operation
     ```

4. **Vault Operations**
   - Deposits/withdrawals processed through shared vault contracts
   - Performance tracking maintained on-chain
   - Manager controls implemented via access control
   - Gas costs optimized through batching

### 💡 Key Technical Features

1. **Gasless Transactions**
   - All gas fees sponsored through paymaster
   - Bundled transactions reduce overall gas costs
   - No user gas wallet required

2. **Smart Contract Architecture**
   - Core vault logic in SimpleManagedVault.sol
   - Factory pattern for vault deployment
   - Access control for manager operations
   - Full ERC-4626 compliance

3. **Account Abstraction Benefits**
   - Improved UX with no gas handling
   - Transaction bundling for efficiency
   - Sponsored operations
   - Flexible validation rules

### 🔒 Security Considerations

1. **Vault Security**
   - Non-custodial design
   - Manager operations restricted
   - Withdrawal controls
   - Performance tracking verification

2. **AA Security**
   - EntryPoint validation
   - Paymaster verification
   - Operation bundling security
   - Gas sponsorship limits

### 📝 Implementation Notes

- Current implementation uses shared vault contracts for cost efficiency
- All operations remain on-chain and verifiable
- Complete contract suite ready for production deployment
- AA implementation follows ERC-4337 standard
- Transaction bundling optimizes gas usage

### 🚀 Production Deployment

For production deployment, the system can be easily migrated to:
1. Individual vault deployments per manager
2. Custom AA implementation
3. Dedicated paymaster setup
4. Full contract verification

### 📊 Technical Specifications

```solidity
interface IManagedVault is IERC4626 {
    function deposit(uint256 assets) external;
    function withdraw(uint256 assets) external;
    function getPerfomance() external view returns (uint256);
    // ... additional vault functions
}
```

```typescript
interface UserOperation {
    sender: string;
    nonce: BigNumber;
    initCode: BytesLike;
    callData: BytesLike;
    callGasLimit: BigNumber;
    verificationGasLimit: BigNumber;
    preVerificationGas: BigNumber;
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
    paymasterAndData: BytesLike;
    signature: BytesLike;
}
```

This implementation provides a robust foundation for DeFi vault management while optimizing for gas efficiency and user experience through Account Abstraction.
