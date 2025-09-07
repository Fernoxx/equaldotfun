// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./EqualFunToken.sol";

contract EqualFunTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct TokenInfo {
        uint256 totalFees;
        uint256 holdersClaimed;
        uint256 creatorClaimed;
        uint256 platformClaimed;
        mapping(address => uint256) holderClaims;
    }
    
    // Fee distribution percentages (basis points)
    uint256 public constant HOLDERS_SHARE = 4000; // 40%
    uint256 public constant CREATOR_SHARE = 4000; // 40%
    uint256 public constant PLATFORM_SHARE = 2000; // 20%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Minimum holding period for rewards
    uint256 public constant MIN_HOLDING_PERIOD = 24 hours;
    
    mapping(address => TokenInfo) public tokenInfo;
    address public factory;
    
    event FeesReceived(address indexed token, uint256 amount);
    event HolderClaimed(address indexed token, address indexed holder, uint256 amount);
    event CreatorClaimed(address indexed token, address indexed creator, uint256 amount);
    event PlatformClaimed(address indexed token, uint256 amount);
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    function setFactory(address _factory) external onlyOwner {
        require(factory == address(0), "Factory already set");
        factory = _factory;
    }
    
    function receiveFees(address token, uint256 amount) external onlyFactory {
        tokenInfo[token].totalFees += amount;
        emit FeesReceived(token, amount);
    }
    
    function claimHolderRewards(address token) external nonReentrant {
        EqualFunToken tokenContract = EqualFunToken(token);
        require(tokenContract.isEligibleForRewards(msg.sender), "Not eligible for rewards");
        
        uint256 holderBalance = tokenContract.balanceOf(msg.sender);
        uint256 totalSupply = tokenContract.totalSupply();
        
        // Calculate holder's share of the 40% allocation
        uint256 holdersAllocation = (tokenInfo[token].totalFees * HOLDERS_SHARE) / BASIS_POINTS;
        uint256 availableForHolders = holdersAllocation - tokenInfo[token].holdersClaimed;
        
        // Calculate this holder's proportional share
        uint256 holderShare = (availableForHolders * holderBalance) / totalSupply;
        
        // Track previous claims to prevent double claiming
        uint256 alreadyClaimed = tokenInfo[token].holderClaims[msg.sender];
        if (holderShare <= alreadyClaimed) {
            revert("No rewards to claim");
        }
        
        uint256 claimAmount = holderShare - alreadyClaimed;
        tokenInfo[token].holderClaims[msg.sender] = holderShare;
        tokenInfo[token].holdersClaimed += claimAmount;
        
        IERC20(token).safeTransfer(msg.sender, claimAmount);
        emit HolderClaimed(token, msg.sender, claimAmount);
    }
    
    function claimCreatorRewards(address token) external nonReentrant {
        EqualFunToken tokenContract = EqualFunToken(token);
        require(msg.sender == tokenContract.creator(), "Not token creator");
        
        uint256 creatorAllocation = (tokenInfo[token].totalFees * CREATOR_SHARE) / BASIS_POINTS;
        uint256 availableForCreator = creatorAllocation - tokenInfo[token].creatorClaimed;
        
        require(availableForCreator > 0, "No rewards to claim");
        
        tokenInfo[token].creatorClaimed += availableForCreator;
        
        IERC20(token).safeTransfer(msg.sender, availableForCreator);
        emit CreatorClaimed(token, msg.sender, availableForCreator);
    }
    
    function claimPlatformFees(address token, address recipient) external onlyOwner nonReentrant {
        uint256 platformAllocation = (tokenInfo[token].totalFees * PLATFORM_SHARE) / BASIS_POINTS;
        uint256 availableForPlatform = platformAllocation - tokenInfo[token].platformClaimed;
        
        require(availableForPlatform > 0, "No fees to claim");
        
        tokenInfo[token].platformClaimed += availableForPlatform;
        
        IERC20(token).safeTransfer(recipient, availableForPlatform);
        emit PlatformClaimed(token, availableForPlatform);
    }
    
    function getTokenInfo(address token) external view returns (
        uint256 totalFees,
        uint256 holdersClaimed,
        uint256 creatorClaimed,
        uint256 platformClaimed
    ) {
        TokenInfo storage info = tokenInfo[token];
        return (info.totalFees, info.holdersClaimed, info.creatorClaimed, info.platformClaimed);
    }
    
    function getHolderClaimableAmount(address token, address holder) external view returns (uint256) {
        EqualFunToken tokenContract = EqualFunToken(token);
        
        if (!tokenContract.isEligibleForRewards(holder)) {
            return 0;
        }
        
        uint256 holderBalance = tokenContract.balanceOf(holder);
        uint256 totalSupply = tokenContract.totalSupply();
        
        uint256 holdersAllocation = (tokenInfo[token].totalFees * HOLDERS_SHARE) / BASIS_POINTS;
        uint256 availableForHolders = holdersAllocation - tokenInfo[token].holdersClaimed;
        
        uint256 holderShare = (availableForHolders * holderBalance) / totalSupply;
        uint256 alreadyClaimed = tokenInfo[token].holderClaims[holder];
        
        return holderShare > alreadyClaimed ? holderShare - alreadyClaimed : 0;
    }
}