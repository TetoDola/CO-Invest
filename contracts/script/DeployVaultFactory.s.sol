// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {VaultFactory} from "../VaultFactory.sol";

/**
 * @title DeployVaultFactory
 * @notice Deployment script for VaultFactory on Base
 * 
 * Usage:
 * forge script contracts/script/DeployVaultFactory.s.sol:DeployVaultFactory \
 *   --rpc-url $BASE_RPC_URL \
 *   --private-key $PRIVATE_KEY \
 *   --broadcast \
 *   --verify \
 *   --etherscan-api-key $BASESCAN_API_KEY
 */
contract DeployVaultFactory is Script {
    function run() external returns (VaultFactory factory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy VaultFactory
        factory = new VaultFactory();
        console.log("VaultFactory deployed at:", address(factory));
        
        vm.stopBroadcast();
        
        // Log important addresses
        console.log("\n=== Deployment Complete ===");
        console.log("VaultFactory:", address(factory));
        console.log("USDC on Base:", 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
        console.log("\nAdd this to your .env.local:");
        console.log("NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=%s", address(factory));
    }
}