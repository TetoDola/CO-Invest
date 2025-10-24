// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleManagedVault
 * @notice Minimal ERC-4626 vault for an MVP on Base.
 * - Asset is typically USDC on Base for deposits/withdrawals.
 * - No fees, no strategy, no manager withdrawal function.
 * - Pro-rata withdrawals are guaranteed by ERC-4626 math.
 * - Manager has no special rights except metadata ownership (optional).
 */
contract SimpleManagedVault is ERC4626, ERC20 {
    address public immutable manager; // for future admin features if you want

    event VaultInitialized(address indexed asset, address indexed manager);

    constructor(
        IERC20 asset_,          // e.g., Base USDC
        string memory name_,    // e.g., "Alice USD Vault"
        string memory symbol_,  // e.g., "aUSDV"
        address manager_        // manager EOA; cannot withdraw funds directly
    )
        ERC20(name_, symbol_)
        ERC4626(asset_)
    {
        require(address(asset_) != address(0), "asset=0");
        require(manager_ != address(0), "manager=0");
        manager = manager_;
        emit VaultInitialized(address(asset_), manager_);
    }

    // (optional) convenience view
    function percentOfVault(address user) external view returns (uint256 bps) {
        uint256 ts = totalSupply();
        if (ts == 0) return 0;
        bps = (balanceOf(user) * 10_000) / ts; // basis points
    }

    // NOTE:
    // - No custom withdraw/redeem logic is added.
    // - Users can only withdraw/redeem their own shares (owner param).
    // - There is NO function for manager to sweep/transfer asset to themselves.
    //   That's intentional for the MVP "no-drain" guarantee.
}