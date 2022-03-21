import { expect } from "chai";
import { ethers } from "hardhat";
import { UltimateERC20, UltimateERC20__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils } from "ethers";
import exp from "constants";

describe("UltimateCoin", function () {
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  let contract: UltimateERC20;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;
  let address4: SignerWithAddress;
  let address5: SignerWithAddress;

  before(async function () {
    [owner, address1, address2, address3, address4, address5] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const ultimateFactory = <UltimateERC20__factory>(
      await ethers.getContractFactory("UltimateERC20")
    );
    contract = await ultimateFactory.deploy("Test", "TST");
    contract = await contract.deployed();
  });

  it("Should be contructed properly", async function () {
    expect(await contract.name()).to.equal("Test");
    expect(await contract.symbol()).to.equal("TST");
    expect(await contract.totalSupply()).to.equal(
      utils.parseUnits("1000000000", 9).toString()
    );
    expect(await contract.decimals()).to.equal(9);
    expect(await contract.balanceOf(owner.address)).to.equal(
      await contract.totalSupply()
    );
  });

  // todo: fix this. the returned type is coming as transaction but it should be address(string)
  it("should be able to create a new pair", async function () {
    // const newpair = await contract.addNewPair(
    //   "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    // ); // BUSD address
    // console.log(newpair);
    // expect(await contract.automatedMarketMakerPairs(newpair)).to.equal(true);

    await contract.addNewPair("0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56");

    await expect(
      contract.addNewPair("0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56")
    ).to.be.revertedWith("Pancake: PAIR_EXISTS"); // should fail
  });

  it("Should be able to transfer without fees", async function () {
    await contract.setBurnFeePercent(0, 0);
    await contract.setEcoSystemFeePercent(0, 0);
    await contract.setLiquidityFeePercent(0, 0);
    await contract.setTaxFeePercent(0, 0);

    await contract
      .connect(owner)
      .transfer(address1.address, utils.parseUnits("1", "9"));
    expect(
      await contract.connect(address1).balanceOf(address1.address)
    ).to.equal(utils.parseUnits("1", "9"));
  });

  it("Should be able to transfer with BURN fee", async function () {
    await contract.setEcoSystemFeePercent(0, 0);
    await contract.setLiquidityFeePercent(0, 0);
    await contract.setTaxFeePercent(0, 0);
    await contract.setBurnFeePercent(0, 1000);

    // the transaction is from a excluded one: the owner. no fee should be taken
    await contract
      .connect(owner)
      .transfer(address1.address, utils.parseUnits("1", "9"));
    expect(
      await contract.connect(address1).balanceOf(address1.address)
    ).to.equal(utils.parseUnits("1", "9"));

    // expect the value be lower than the transferred
    await contract
      .connect(address1)
      .transfer(address2.address, utils.parseUnits("0.9", "9"));
    expect(
      await contract.connect(address2).balanceOf(address2.address)
    ).to.equal(utils.parseUnits("0.81", "9"));

    // expect the burn address have the tokens
    expect(
      await contract.connect(address2).balanceOf(await contract._burnAddress())
    ).to.equal(utils.parseUnits("0.09", "9"));
  });

  // todo: implement deployment of dexes
  // it("Timelock DEX transfer", async function () {
  //   await contract.setBurnFeePercent(0, 0);
  //   await contract.setEcoSystemFeePercent(0, 0);
  //   await contract.setLiquidityFeePercent(0, 0);
  //   await contract.setTaxFeePercent(0, 0);
  // });
});
