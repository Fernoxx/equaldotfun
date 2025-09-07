// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EqualFunFactory.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract EqualFunFactoryV2 is EqualFunFactory {
    
    struct TokenLaunchConfig {
        string name;
        string symbol;
        string description;
        uint256 vaultPercentage; // 0-50% of supply to vault
        uint256 devBuyAmount; // ETH amount for dev buy
        address[] airdropRecipients;
        uint256[] airdropAmounts;
        uint256 tradingDelay; // Delay in seconds before trading starts
        bool enableMevProtection;
    }
    
    struct VaultInfo {
        uint256 amount;
        uint256 unlockTime;
        bool claimed;
    }
    
    // Token vaults
    mapping(address => mapping(address => VaultInfo)) public vaults;
    
    // MEV protection
    mapping(address => uint256) public tradingStartTime;
    
    // Airdrop merkle roots
    mapping(address => bytes32) public airdropMerkleRoots;
    
    event TokenVaulted(address indexed token, address indexed owner, uint256 amount, uint256 unlockTime);
    event VaultClaimed(address indexed token, address indexed owner, uint256 amount);
    event AirdropCreated(address indexed token, bytes32 merkleRoot);
    
    constructor(
        address _weth,
        address _aerodrome,
        address _initialOwner
    ) EqualFunFactory(_weth, _aerodrome, _initialOwner) {}
    
    function createTokenAdvanced(
        TokenLaunchConfig memory config
    ) external nonReentrant returns (address) {
        // Deploy token
        EqualFunToken token = new EqualFunToken(
            config.name,
            config.symbol,
            INITIAL_SUPPLY,
            msg.sender,
            address(this)
        );
        
        address tokenAddress = address(token);
        
        // Initialize token data
        uint256 bondingSupply = (INITIAL_SUPPLY * BONDING_CURVE_PERCENTAGE) / 100;
        uint256 liquiditySupply = (INITIAL_SUPPLY * LIQUIDITY_PERCENTAGE) / 100;
        
        // Handle vaulting if requested
        uint256 vaultAmount = 0;
        if (config.vaultPercentage > 0 && config.vaultPercentage <= 50) {
            vaultAmount = (INITIAL_SUPPLY * config.vaultPercentage) / 100;
            bondingSupply -= vaultAmount;
            
            // Lock tokens in vault
            vaults[tokenAddress][msg.sender] = VaultInfo({
                amount: vaultAmount,
                unlockTime: block.timestamp + 30 days,
                claimed: false
            });
            
            emit TokenVaulted(tokenAddress, msg.sender, vaultAmount, block.timestamp + 30 days);
        }
        
        // Handle airdrops
        uint256 airdropTotal = 0;
        if (config.airdropRecipients.length > 0) {
            require(config.airdropRecipients.length == config.airdropAmounts.length, "Mismatched arrays");
            
            for (uint256 i = 0; i < config.airdropAmounts.length; i++) {
                airdropTotal += config.airdropAmounts[i];
            }
            
            require(airdropTotal <= bondingSupply / 10, "Airdrop too large"); // Max 10% for airdrops
            bondingSupply -= airdropTotal;
            
            // Distribute airdrops
            for (uint256 i = 0; i < config.airdropRecipients.length; i++) {
                IERC20(tokenAddress).safeTransfer(config.airdropRecipients[i], config.airdropAmounts[i]);
            }
        }
        
        // Set up token data
        TokenData storage tokenData = tokens[tokenAddress];
        tokenData.tokenAddress = tokenAddress;
        tokenData.creator = msg.sender;
        tokenData.totalSupply = INITIAL_SUPPLY;
        tokenData.bondingCurveSupply = bondingSupply;
        tokenData.tokenReserve = bondingSupply;
        tokenData.ethReserve = 0;
        tokenData.k = 0;
        tokenData.liquidityLocked = false;
        tokenData.createdAt = block.timestamp;
        
        // MEV protection
        if (config.enableMevProtection && config.tradingDelay > 0) {
            tradingStartTime[tokenAddress] = block.timestamp + config.tradingDelay;
        } else {
            tradingStartTime[tokenAddress] = block.timestamp;
        }
        
        // Dev buy if specified
        if (config.devBuyAmount > 0) {
            require(msg.value >= config.devBuyAmount, "Insufficient ETH for dev buy");
            _buyTokenInternal(tokenAddress, config.devBuyAmount, msg.sender);
        }
        
        allTokens.push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, config.name, config.symbol);
        
        return tokenAddress;
    }
    
    function _buyTokenInternal(address tokenAddress, uint256 ethAmount, address recipient) private {
        TokenData storage tokenData = tokens[tokenAddress];
        
        uint256 tokensOut;
        if (tokenData.k == 0) {
            tokensOut = (tokenData.bondingCurveSupply * ethAmount) / (TARGET_MARKET_CAP / 10);
            tokenData.k = (tokenData.ethReserve + ethAmount) * (tokenData.tokenReserve - tokensOut);
        } else {
            uint256 newEthReserve = tokenData.ethReserve + ethAmount;
            uint256 newTokenReserve = tokenData.k / newEthReserve;
            tokensOut = tokenData.tokenReserve - newTokenReserve;
        }
        
        tokenData.ethReserve += ethAmount;
        tokenData.tokenReserve -= tokensOut;
        
        IERC20(tokenAddress).safeTransfer(recipient, tokensOut);
    }
    
    function buyToken(address tokenAddress) external payable override nonReentrant {
        require(block.timestamp >= tradingStartTime[tokenAddress], "Trading not started");
        super.buyToken(tokenAddress);
    }
    
    function sellToken(address tokenAddress, uint256 tokenAmount) external override nonReentrant {
        require(block.timestamp >= tradingStartTime[tokenAddress], "Trading not started");
        super.sellToken(tokenAddress, tokenAmount);
    }
    
    function claimVault(address tokenAddress) external nonReentrant {
        VaultInfo storage vault = vaults[tokenAddress][msg.sender];
        require(vault.amount > 0, "No vault");
        require(!vault.claimed, "Already claimed");
        require(block.timestamp >= vault.unlockTime, "Still locked");
        
        vault.claimed = true;
        IERC20(tokenAddress).safeTransfer(msg.sender, vault.amount);
        
        emit VaultClaimed(tokenAddress, msg.sender, vault.amount);
    }
    
    // Additional features for V2
    function setTradingFee(address tokenAddress, uint256 newFee) external {
        require(msg.sender == tokens[tokenAddress].creator, "Only creator");
        require(newFee <= 500, "Fee too high"); // Max 5%
        // Implementation would update fee in token contract
    }
    
    function enableMultipleRecipients(address tokenAddress, address[] memory recipients, uint256[] memory shares) external {
        require(msg.sender == tokens[tokenAddress].creator, "Only creator");
        require(recipients.length == shares.length && recipients.length <= 7, "Invalid recipients");
        // Implementation would update treasury distribution
    }
}