// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./EqualFunToken.sol";
import "./EqualFunTreasury.sol";
import "./interfaces/IUniswapV3.sol";

contract EqualFunFactoryV3 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct TokenData {
        address tokenAddress;
        address creator;
        address poolAddress;
        uint256 totalSupply;
        uint256 initialLiquidity;
        uint256 createdAt;
        uint24 poolFee;
        int24 tickLower;
        int24 tickUpper;
        uint256 tokenId; // NFT position ID
    }
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant LIQUIDITY_PERCENTAGE = 90; // 90% for liquidity
    uint256 public constant CREATOR_PERCENTAGE = 10; // 10% to creator
    uint24 public constant DEFAULT_FEE = 10000; // 1% fee tier
    
    // Uniswap V3 contracts
    IUniswapV3Factory public immutable uniswapV3Factory;
    INonfungiblePositionManager public immutable positionManager;
    ISwapRouter public immutable swapRouter;
    address public immutable weth;
    
    // Equal.fun contracts
    EqualFunTreasury public treasury;
    
    // State
    mapping(address => TokenData) public tokens;
    address[] public allTokens;
    
    // Events
    event TokenCreated(
        address indexed token,
        address indexed creator,
        address indexed pool,
        string name,
        string symbol
    );
    event LiquidityAdded(address indexed token, uint256 tokenAmount, uint256 ethAmount, uint256 tokenId);
    
    constructor(
        address _uniswapV3Factory,
        address _positionManager,
        address _swapRouter,
        address _weth,
        address _initialOwner
    ) Ownable(_initialOwner) {
        uniswapV3Factory = IUniswapV3Factory(_uniswapV3Factory);
        positionManager = INonfungiblePositionManager(_positionManager);
        swapRouter = ISwapRouter(_swapRouter);
        weth = _weth;
        
        // Deploy treasury
        treasury = new EqualFunTreasury(_initialOwner);
        treasury.setFactory(address(this));
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        string memory description
    ) external payable nonReentrant returns (address tokenAddress, address poolAddress) {
        require(msg.value >= 0.1 ether, "Minimum 0.1 ETH required for initial liquidity");
        
        // Deploy new token
        EqualFunToken token = new EqualFunToken(
            name,
            symbol,
            INITIAL_SUPPLY,
            msg.sender,
            address(this)
        );
        
        tokenAddress = address(token);
        
        // Calculate distribution
        uint256 liquidityTokens = (INITIAL_SUPPLY * LIQUIDITY_PERCENTAGE) / 100;
        uint256 creatorTokens = (INITIAL_SUPPLY * CREATOR_PERCENTAGE) / 100;
        
        // Transfer creator allocation
        IERC20(tokenAddress).safeTransfer(msg.sender, creatorTokens);
        
        // Create Uniswap V3 pool
        poolAddress = _createAndInitializePool(tokenAddress, msg.value, liquidityTokens);
        
        // Store token data
        TokenData storage tokenData = tokens[tokenAddress];
        tokenData.tokenAddress = tokenAddress;
        tokenData.creator = msg.sender;
        tokenData.poolAddress = poolAddress;
        tokenData.totalSupply = INITIAL_SUPPLY;
        tokenData.initialLiquidity = msg.value;
        tokenData.createdAt = block.timestamp;
        tokenData.poolFee = DEFAULT_FEE;
        
        allTokens.push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, poolAddress, name, symbol);
        
        return (tokenAddress, poolAddress);
    }
    
    function _createAndInitializePool(
        address tokenAddress,
        uint256 ethAmount,
        uint256 tokenAmount
    ) private returns (address pool) {
        // Determine token0 and token1 (sorted)
        (address token0, address token1) = tokenAddress < weth ? 
            (tokenAddress, weth) : (weth, tokenAddress);
        
        // Create pool
        pool = uniswapV3Factory.createPool(token0, token1, DEFAULT_FEE);
        
        // Initialize pool with a reasonable starting price
        // Price = ETH amount / token amount
        uint160 sqrtPriceX96 = _calculateSqrtPriceX96(ethAmount, tokenAmount, tokenAddress < weth);
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        
        // Add liquidity
        _addLiquidityToPool(tokenAddress, ethAmount, tokenAmount, pool);
        
        return pool;
    }
    
    function _addLiquidityToPool(
        address tokenAddress,
        uint256 ethAmount,
        uint256 tokenAmount,
        address pool
    ) private {
        // Wrap ETH
        IWETH(weth).deposit{value: ethAmount}();
        
        // Approve tokens for position manager
        IERC20(tokenAddress).approve(address(positionManager), tokenAmount);
        IERC20(weth).approve(address(positionManager), ethAmount);
        
        // Get current tick for full range position
        (, int24 tick, , , , , ) = IUniswapV3Pool(pool).slot0();
        
        // Create full range position
        int24 tickSpacing = IUniswapV3Pool(pool).tickSpacing();
        int24 tickLower = (TickMath.MIN_TICK / tickSpacing) * tickSpacing;
        int24 tickUpper = (TickMath.MAX_TICK / tickSpacing) * tickSpacing;
        
        // Determine amounts based on token order
        (uint256 amount0Desired, uint256 amount1Desired) = tokenAddress < weth ?
            (tokenAmount, ethAmount) : (ethAmount, tokenAmount);
        
        // Mint position NFT and send to dead address (lock forever)
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: tokenAddress < weth ? tokenAddress : weth,
            token1: tokenAddress < weth ? weth : tokenAddress,
            fee: DEFAULT_FEE,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0,
            amount1Min: 0,
            recipient: address(0xdead), // Lock liquidity forever
            deadline: block.timestamp + 300
        });
        
        (uint256 tokenId, , , ) = positionManager.mint(params);
        
        // Store position data
        TokenData storage tokenData = tokens[tokenAddress];
        tokenData.tickLower = tickLower;
        tokenData.tickUpper = tickUpper;
        tokenData.tokenId = tokenId;
        
        emit LiquidityAdded(tokenAddress, tokenAmount, ethAmount, tokenId);
    }
    
    function _calculateSqrtPriceX96(
        uint256 ethAmount,
        uint256 tokenAmount,
        bool tokenIsToken0
    ) private pure returns (uint160) {
        // Calculate price ratio
        // If token is token0: price = amount1/amount0 = ethAmount/tokenAmount
        // If token is token1: price = amount0/amount1 = tokenAmount/ethAmount
        
        uint256 price;
        if (tokenIsToken0) {
            // price = ethAmount * 10**18 / tokenAmount
            price = (ethAmount * 10**18) / tokenAmount;
        } else {
            // price = tokenAmount / ethAmount
            price = (tokenAmount * 10**18) / ethAmount;
        }
        
        // Calculate sqrt(price) * 2^96
        // This is a simplified calculation - in production use a more precise method
        uint256 sqrtPrice = sqrt(price * 10**18);
        return uint160((sqrtPrice * 2**96) / 10**9);
    }
    
    function sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    // Handle fees from token transfers
    function handleFees(address token, uint256 amount) external {
        require(msg.sender == token, "Only token contract");
        treasury.receiveFees(token, amount);
    }
    
    // View functions
    function getTokenData(address token) external view returns (TokenData memory) {
        return tokens[token];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    function getPoolInfo(address tokenAddress) external view returns (
        address pool,
        uint256 token0Reserve,
        uint256 token1Reserve,
        uint256 liquidity,
        uint24 fee
    ) {
        TokenData memory data = tokens[tokenAddress];
        pool = data.poolAddress;
        fee = data.poolFee;
        
        if (pool != address(0)) {
            // Get pool reserves (simplified - actual implementation would decode position)
            liquidity = IUniswapV3Pool(pool).liquidity();
            
            // Note: Getting exact reserves in V3 requires more complex calculations
            // based on current tick and liquidity distribution
        }
        
        return (pool, 0, 0, liquidity, fee);
    }
}