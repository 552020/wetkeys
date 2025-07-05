// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract USDCReceiver {
    address public immutable owner;
    address public immutable usdc;

    event PaymentReceived(
        address indexed payer,
        string fileId,         // Off-chain file reference
        uint256 amount,
        uint256 timestamp
    );

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = _usdc;
    }

    function payForFile(string calldata fileId, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        bool success = IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");

        emit PaymentReceived(msg.sender, fileId, amount, block.timestamp);
    }

    // Withdraw collected USDC
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        IERC20(usdc).transferFrom(address(this), owner, IERC20(usdc).balanceOf(address(this)));
    }
}
