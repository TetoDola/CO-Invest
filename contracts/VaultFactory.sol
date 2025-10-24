// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {SimpleManagedVault} from "./SimpleManagedVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaultFactory {
    event VaultCreated(
        address indexed vault,
        address indexed asset,
        address indexed manager,
        string name,
        string symbol
    );

    /**
     * @notice Deploy a new 4626 vault for `manager`.
     * @param asset   ERC20 asset (USDC on Base for MVP)
     * @param name    Vault ERC20 name
     * @param symbol  Vault ERC20 symbol
     * @param manager Manager EOA (shown in UI, no special withdrawal power)
     */
    function createVault(
        address asset,
        string memory name,
        string memory symbol,
        address manager
    ) external returns (address vault) {
        require(asset != address(0), "asset=0");
        require(manager != address(0), "manager=0");

        SimpleManagedVault v = new SimpleManagedVault(IERC20(asset), name, symbol, manager);
        vault = address(v);
        emit VaultCreated(vault, asset, manager, name, symbol);
    }
}