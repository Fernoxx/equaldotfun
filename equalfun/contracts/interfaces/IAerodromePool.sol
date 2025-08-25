// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAerodromePool {
    // Get current reserves
    function getReserves() external view returns (
        uint112 reserve0,
        uint112 reserve1,
        uint32 blockTimestampLast
    );
    
    // Get pool tokens
    function token0() external view returns (address);
    function token1() external view returns (address);
    
    // Get total supply of LP tokens
    function totalSupply() external view returns (uint256);
    
    // Get fees collected
    function fees() external view returns (address);
    
    // Check if stable pool
    function stable() external view returns (bool);
    
    // Get current K value
    function getK() external view returns (uint256);
}