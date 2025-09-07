const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Equal.fun", function () {
  let factory, treasury, weth;
  let owner, user1, user2, creator;
  let token;

  beforeEach(async function () {
    [owner, user1, user2, creator] = await ethers.getSigners();

    // Deploy mock WETH
    const MockWETH = await ethers.getContractFactory("MockWETH");
    weth = await MockWETH.deploy();

    // Deploy Factory (which also deploys Treasury)
    const Factory = await ethers.getContractFactory("EqualFunFactory");
    factory = await Factory.deploy(weth.address, ethers.constants.AddressZero, owner.address);
    
    // Get Treasury address
    const treasuryAddress = await factory.treasury();
    treasury = await ethers.getContractAt("EqualFunTreasury", treasuryAddress);
  });

  describe("Token Creation", function () {
    it("Should create a new token", async function () {
      const tx = await factory.connect(creator).createToken(
        "Test Token",
        "TEST",
        "A test token"
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TokenCreated");
      
      expect(event).to.not.be.undefined;
      expect(event.args.creator).to.equal(creator.address);
      expect(event.args.name).to.equal("Test Token");
      expect(event.args.symbol).to.equal("TEST");
      
      token = await ethers.getContractAt("EqualFunToken", event.args.token);
    });
  });

  describe("Trading", function () {
    beforeEach(async function () {
      const tx = await factory.connect(creator).createToken(
        "Test Token",
        "TEST",
        "A test token"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TokenCreated");
      token = await ethers.getContractAt("EqualFunToken", event.args.token);
    });

    it("Should buy tokens", async function () {
      const ethAmount = ethers.utils.parseEther("0.1");
      
      await expect(
        factory.connect(user1).buyToken(token.address, { value: ethAmount })
      ).to.emit(factory, "TokenPurchased");
      
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should track holding time", async function () {
      const ethAmount = ethers.utils.parseEther("0.1");
      await factory.connect(user1).buyToken(token.address, { value: ethAmount });
      
      const purchaseTime = await token.lastPurchaseTime(user1.address);
      expect(purchaseTime).to.be.gt(0);
      
      const isEligible = await token.isEligibleForRewards(user1.address);
      expect(isEligible).to.be.false; // Not eligible immediately
    });
  });

  describe("Fee Distribution", function () {
    it("Should collect fees on transfers", async function () {
      const ethAmount = ethers.utils.parseEther("1");
      
      // User1 buys tokens
      await factory.connect(user1).buyToken(token.address, { value: ethAmount });
      const balance1 = await token.balanceOf(user1.address);
      
      // User1 transfers to User2 (should incur 1% fee)
      const transferAmount = balance1.div(2);
      await token.connect(user1).transfer(user2.address, transferAmount);
      
      // Check that fees were collected
      const tokenInfo = await treasury.getTokenInfo(token.address);
      expect(tokenInfo.totalFees).to.be.gt(0);
    });
  });
});

// Mock WETH for testing
contract("MockWETH", function () {
  function deposit() external payable {
    _mint(msg.sender, msg.value);
  }
  
  function withdraw(uint256 amount) external {
    _burn(msg.sender, amount);
    payable(msg.sender).transfer(amount);
  }
}