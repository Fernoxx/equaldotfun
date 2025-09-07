// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IEqualFunFactory {
    function handleFees(address token, uint256 amount) external;
}

contract EqualFunToken is ERC20, Ownable {
    IEqualFunFactory public immutable factory;
    address public immutable creator;
    
    uint256 public constant FEE_PERCENTAGE = 100; // 1% = 100 basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    bool public liquidityLocked;
    uint256 public launchTime;
    
    // Track last purchase time for each holder
    mapping(address => uint256) public lastPurchaseTime;
    
    event FeesCollected(uint256 amount);
    event LiquidityLocked();
    
    modifier onlyFactory() {
        require(msg.sender == address(factory), "Only factory");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _creator,
        address _factory
    ) ERC20(_name, _symbol) Ownable(_factory) {
        creator = _creator;
        factory = IEqualFunFactory(_factory);
        launchTime = block.timestamp;
        
        // Mint initial supply to factory for bonding curve
        _mint(_factory, _totalSupply);
    }
    
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        uint256 fee = 0;
        
        // Apply fee on transfers (excluding mints and burns)
        if (from != address(0) && to != address(0) && !liquidityLocked) {
            fee = (amount * FEE_PERCENTAGE) / BASIS_POINTS;
            if (fee > 0) {
                super._update(from, address(factory), fee);
                factory.handleFees(address(this), fee);
                emit FeesCollected(fee);
                amount -= fee;
            }
        }
        
        // Track purchase time for holder rewards
        if (to != address(0) && to != address(factory)) {
            lastPurchaseTime[to] = block.timestamp;
        }
        
        super._update(from, to, amount);
    }
    
    function lockLiquidity() external onlyFactory {
        liquidityLocked = true;
        emit LiquidityLocked();
    }
    
    function getHoldingDuration(address holder) external view returns (uint256) {
        if (lastPurchaseTime[holder] == 0) return 0;
        return block.timestamp - lastPurchaseTime[holder];
    }
    
    function isEligibleForRewards(address holder) external view returns (bool) {
        return lastPurchaseTime[holder] > 0 && 
               (block.timestamp - lastPurchaseTime[holder]) >= 24 hours &&
               balanceOf(holder) > 0;
    }
}