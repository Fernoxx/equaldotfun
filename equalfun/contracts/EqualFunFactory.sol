// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./EqualFunToken.sol";
import "./EqualFunTreasury.sol";

interface IAerodrome {
    function createPair(address tokenA, address tokenB, bool stable) external returns (address pair);
    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

contract EqualFunFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct TokenData {
        address tokenAddress;
        address creator;
        uint256 totalSupply;
        uint256 bondingCurveSupply;
        uint256 ethReserve;
        uint256 tokenReserve;
        uint256 k; // Constant product for bonding curve
        bool liquidityLocked;
        uint256 createdAt;
    }
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant BONDING_CURVE_PERCENTAGE = 80; // 80% for bonding curve
    uint256 public constant LIQUIDITY_PERCENTAGE = 20; // 20% for liquidity
    uint256 public constant TARGET_MARKET_CAP = 55_000 * 10**18; // $55k in ETH
    uint256 public constant MIN_ETH_PURCHASE = 0.0001 ether;
    
    // State variables
    EqualFunTreasury public treasury;
    IAerodrome public aerodrome;
    address public weth;
    
    mapping(address => TokenData) public tokens;
    address[] public allTokens;
    
    // Events
    event TokenCreated(address indexed token, address indexed creator, string name, string symbol);
    event TokenPurchased(address indexed token, address indexed buyer, uint256 ethIn, uint256 tokensOut);
    event TokenSold(address indexed token, address indexed seller, uint256 tokensIn, uint256 ethOut);
    event LiquidityAdded(address indexed token, address indexed pair, uint256 ethAmount, uint256 tokenAmount);
    
    constructor(
        address _weth,
        address _aerodrome,
        address _initialOwner
    ) Ownable(_initialOwner) {
        weth = _weth;
        aerodrome = IAerodrome(_aerodrome);
        
        // Deploy treasury
        treasury = new EqualFunTreasury(_initialOwner);
        treasury.setFactory(address(this));
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        string memory description
    ) external nonReentrant returns (address) {
        // Deploy new token
        EqualFunToken token = new EqualFunToken(
            name,
            symbol,
            INITIAL_SUPPLY,
            msg.sender,
            address(this)
        );
        
        address tokenAddress = address(token);
        
        // Initialize token data
        uint256 bondingSupply = (INITIAL_SUPPLY * BONDING_CURVE_PERCENTAGE) / 100;
        uint256 liquiditySupply = (INITIAL_SUPPLY * LIQUIDITY_PERCENTAGE) / 100;
        
        TokenData storage tokenData = tokens[tokenAddress];
        tokenData.tokenAddress = tokenAddress;
        tokenData.creator = msg.sender;
        tokenData.totalSupply = INITIAL_SUPPLY;
        tokenData.bondingCurveSupply = bondingSupply;
        tokenData.tokenReserve = bondingSupply;
        tokenData.ethReserve = 0;
        tokenData.k = 0; // Will be set on first purchase
        tokenData.liquidityLocked = false;
        tokenData.createdAt = block.timestamp;
        
        allTokens.push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, name, symbol);
        
        return tokenAddress;
    }
    
    function buyToken(address tokenAddress) external payable nonReentrant {
        require(msg.value >= MIN_ETH_PURCHASE, "ETH amount too small");
        
        TokenData storage tokenData = tokens[tokenAddress];
        require(tokenData.tokenAddress != address(0), "Token not found");
        require(!tokenData.liquidityLocked, "Trading moved to DEX");
        
        uint256 ethIn = msg.value;
        uint256 tokensOut;
        
        if (tokenData.k == 0) {
            // First purchase - set initial price
            tokensOut = (tokenData.bondingCurveSupply * ethIn) / (TARGET_MARKET_CAP / 10);
            tokenData.k = (tokenData.ethReserve + ethIn) * (tokenData.tokenReserve - tokensOut);
        } else {
            // Calculate tokens out using x*y=k formula
            uint256 newEthReserve = tokenData.ethReserve + ethIn;
            uint256 newTokenReserve = tokenData.k / newEthReserve;
            tokensOut = tokenData.tokenReserve - newTokenReserve;
        }
        
        require(tokensOut > 0 && tokensOut <= tokenData.tokenReserve, "Invalid token amount");
        
        // Update reserves
        tokenData.ethReserve += ethIn;
        tokenData.tokenReserve -= tokensOut;
        
        // Transfer tokens
        IERC20(tokenAddress).safeTransfer(msg.sender, tokensOut);
        
        emit TokenPurchased(tokenAddress, msg.sender, ethIn, tokensOut);
        
        // Check if we should add liquidity
        _checkAndAddLiquidity(tokenAddress);
    }
    
    function sellToken(address tokenAddress, uint256 tokenAmount) external nonReentrant {
        TokenData storage tokenData = tokens[tokenAddress];
        require(tokenData.tokenAddress != address(0), "Token not found");
        require(!tokenData.liquidityLocked, "Trading moved to DEX");
        require(tokenData.k > 0, "No liquidity");
        
        // Transfer tokens from seller
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Calculate ETH out using x*y=k formula
        uint256 newTokenReserve = tokenData.tokenReserve + tokenAmount;
        uint256 newEthReserve = tokenData.k / newTokenReserve;
        uint256 ethOut = tokenData.ethReserve - newEthReserve;
        
        require(ethOut > 0 && ethOut <= tokenData.ethReserve, "Invalid ETH amount");
        
        // Update reserves
        tokenData.tokenReserve += tokenAmount;
        tokenData.ethReserve -= ethOut;
        
        // Send ETH to seller
        (bool success, ) = msg.sender.call{value: ethOut}("");
        require(success, "ETH transfer failed");
        
        emit TokenSold(tokenAddress, msg.sender, tokenAmount, ethOut);
    }
    
    function _checkAndAddLiquidity(address tokenAddress) private {
        TokenData storage tokenData = tokens[tokenAddress];
        
        // Calculate current market cap
        uint256 currentMarketCap = (tokenData.ethReserve * tokenData.totalSupply) / tokenData.tokenReserve;
        
        if (currentMarketCap >= TARGET_MARKET_CAP && !tokenData.liquidityLocked) {
            // Add liquidity to Aerodrome
            uint256 liquidityTokens = (tokenData.totalSupply * LIQUIDITY_PERCENTAGE) / 100;
            uint256 liquidityETH = tokenData.ethReserve;
            
            // Create pair
            address pair = aerodrome.createPair(tokenAddress, weth, false);
            
            // Approve tokens
            IERC20(tokenAddress).approve(address(aerodrome), liquidityTokens);
            IERC20(weth).approve(address(aerodrome), liquidityETH);
            
            // Wrap ETH
            (bool success, ) = weth.call{value: liquidityETH}("");
            require(success, "WETH wrap failed");
            
            // Add liquidity and lock it by sending LP tokens to dead address
            aerodrome.addLiquidity(
                tokenAddress,
                weth,
                false,
                liquidityTokens,
                liquidityETH,
                0,
                0,
                address(0xdead), // Lock liquidity forever
                block.timestamp + 300
            );
            
            // Mark as liquidity locked
            tokenData.liquidityLocked = true;
            EqualFunToken(tokenAddress).lockLiquidity();
            
            emit LiquidityAdded(tokenAddress, pair, liquidityETH, liquidityTokens);
        }
    }
    
    function handleFees(address token, uint256 amount) external {
        require(msg.sender == token, "Only token contract");
        treasury.receiveFees(token, amount);
    }
    
    function getTokenData(address token) external view returns (TokenData memory) {
        return tokens[token];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    function calculateBuyAmount(address tokenAddress, uint256 ethIn) external view returns (uint256) {
        TokenData storage tokenData = tokens[tokenAddress];
        require(tokenData.tokenAddress != address(0), "Token not found");
        
        if (tokenData.k == 0) {
            return (tokenData.bondingCurveSupply * ethIn) / (TARGET_MARKET_CAP / 10);
        } else {
            uint256 newEthReserve = tokenData.ethReserve + ethIn;
            uint256 newTokenReserve = tokenData.k / newEthReserve;
            return tokenData.tokenReserve - newTokenReserve;
        }
    }
    
    function calculateSellAmount(address tokenAddress, uint256 tokenIn) external view returns (uint256) {
        TokenData storage tokenData = tokens[tokenAddress];
        require(tokenData.tokenAddress != address(0), "Token not found");
        require(tokenData.k > 0, "No liquidity");
        
        uint256 newTokenReserve = tokenData.tokenReserve + tokenIn;
        uint256 newEthReserve = tokenData.k / newTokenReserve;
        return tokenData.ethReserve - newEthReserve;
    }
}