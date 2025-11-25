import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

import { SplitFactory, SplitBase } from "../typechain-types";

describe("SplitBase", function () {
  let splitFactory: SplitFactory;
  let owner: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let recipient3: SignerWithAddress;
  let sender: SignerWithAddress;

  beforeEach(async function () {
    [owner, recipient1, recipient2, recipient3, sender] = await ethers.getSigners();

    const SplitFactoryContract = await ethers.getContractFactory("SplitFactory");
    splitFactory = await SplitFactoryContract.deploy();
    await splitFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should create a split contract with valid parameters", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [60, 40];

      const tx = await splitFactory.createSplit(recipients, percentages);
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "SplitCreated"
      );
      expect(event).to.not.be.undefined;
    });

    it("Should reject if arrays have different lengths", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [60];

      await expect(
        splitFactory.createSplit(recipients, percentages)
      ).to.be.revertedWithCustomError(splitFactory, "InvalidArrayLength");
    });

    it("Should reject if percentages don't sum to 100", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [60, 30];

      await expect(
        splitFactory.createSplit(recipients, percentages)
      ).to.be.revertedWithCustomError(splitFactory, "PercentagesMustSumTo100");
    });

    it("Should reject if recipient is zero address", async function () {
      const recipients = [ethers.ZeroAddress, recipient2.address];
      const percentages = [60, 40];

      await expect(
        splitFactory.createSplit(recipients, percentages)
      ).to.be.revertedWithCustomError(splitFactory, "InvalidRecipientAddress");
    });

    it("Should reject if percentage is zero", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [0, 100];

      await expect(
        splitFactory.createSplit(recipients, percentages)
      ).to.be.revertedWithCustomError(splitFactory, "InvalidPercentage");
    });
  });

  describe("Fund Distribution", function () {
    let splitAddress: string;
    let split: SplitBase;

    beforeEach(async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const percentages = [50, 30, 20];

      const tx = await splitFactory.createSplit(recipients, percentages);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find(
        (log: any) => log.fragment?.name === "SplitCreated"
      );
      splitAddress = event?.args[0];

      split = await ethers.getContractAt("SplitBase", splitAddress);
    });

    it("Should automatically distribute funds on receive", async function () {
      const amount = ethers.parseEther("1.0");
      
      const recipient1BalanceBefore = await ethers.provider.getBalance(recipient1.address);
      const recipient2BalanceBefore = await ethers.provider.getBalance(recipient2.address);
      const recipient3BalanceBefore = await ethers.provider.getBalance(recipient3.address);

      await sender.sendTransaction({
        to: splitAddress,
        value: amount,
      });

      const recipient1BalanceAfter = await ethers.provider.getBalance(recipient1.address);
      const recipient2BalanceAfter = await ethers.provider.getBalance(recipient2.address);
      const recipient3BalanceAfter = await ethers.provider.getBalance(recipient3.address);

      // Check that recipients received their shares (50%, 30%, 20%)
      expect(recipient1BalanceAfter - recipient1BalanceBefore).to.equal(
        ethers.parseEther("0.5")
      );
      expect(recipient2BalanceAfter - recipient2BalanceBefore).to.equal(
        ethers.parseEther("0.3")
      );
      expect(recipient3BalanceAfter - recipient3BalanceBefore).to.equal(
        ethers.parseEther("0.2")
      );
    });

    it("Should manually distribute accumulated funds", async function () {
      const amount = ethers.parseEther("2.0");

      // Send funds without auto-distribute by sending to contract with data
      await sender.sendTransaction({
        to: splitAddress,
        value: amount,
      });

      // Balance should be 0 after auto-distribution
      const balanceAfterReceive = await ethers.provider.getBalance(splitAddress);
      expect(balanceAfterReceive).to.equal(0);
    });

    it("Should handle multiple distributions", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("0.5");

      const recipient1BalanceBefore = await ethers.provider.getBalance(recipient1.address);

      await sender.sendTransaction({
        to: splitAddress,
        value: amount1,
      });

      await sender.sendTransaction({
        to: splitAddress,
        value: amount2,
      });

      const recipient1BalanceAfter = await ethers.provider.getBalance(recipient1.address);
      
      // Should have received 50% of 1.5 ETH total
      expect(recipient1BalanceAfter - recipient1BalanceBefore).to.equal(
        ethers.parseEther("0.75")
      );
    });

    it("Should emit events on distribution", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        sender.sendTransaction({
          to: splitAddress,
          value: amount,
        })
      )
        .to.emit(split, "FundsReceived")
        .withArgs(sender.address, amount);
    });
  });

  describe("SplitFactory", function () {
    it("Should track all splits", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [70, 30];

      await splitFactory.createSplit(recipients, percentages);
      await splitFactory.createSplit(recipients, percentages);

      const allSplitsCount = await splitFactory.getAllSplitsCount();
      expect(allSplitsCount).to.equal(2);
    });

    it("Should track splits by owner", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [70, 30];

      await splitFactory.connect(owner).createSplit(recipients, percentages);
      await splitFactory.connect(owner).createSplit(recipients, percentages);
      await splitFactory.connect(recipient1).createSplit(recipients, percentages);

      const ownerSplits = await splitFactory.getSplitsByOwner(owner.address);
      expect(ownerSplits.length).to.equal(2);

      const recipient1Splits = await splitFactory.getSplitsByOwner(recipient1.address);
      expect(recipient1Splits.length).to.equal(1);
    });

    it("Should validate split addresses", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [70, 30];

      const tx = await splitFactory.createSplit(recipients, percentages);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find(
        (log: any) => log.fragment?.name === "SplitCreated"
      );
      const splitAddress = event?.args[0];

      const isValid = await splitFactory.isValidSplit(splitAddress);
      expect(isValid).to.be.true;

      const isInvalid = await splitFactory.isValidSplit(ethers.ZeroAddress);
      expect(isInvalid).to.be.false;
    });
  });

  describe("View Functions", function () {
    let splitAddress: string;
    let split: SplitBase;

    beforeEach(async function () {
      const recipients = [recipient1.address, recipient2.address];
      const percentages = [60, 40];

      const tx = await splitFactory.createSplit(recipients, percentages);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find(
        (log: any) => log.fragment?.name === "SplitCreated"
      );
      splitAddress = event?.args[0];

      split = await ethers.getContractAt("SplitBase", splitAddress);
    });

    it("Should return correct recipients count", async function () {
      const count = await split.getRecipientsCount();
      expect(count).to.equal(2);
    });

    it("Should return split details", async function () {
      const [recipients, percentages] = await split.getSplitDetails();
      
      expect(recipients.length).to.equal(2);
      expect(recipients[0]).to.equal(recipient1.address);
      expect(recipients[1]).to.equal(recipient2.address);
      expect(percentages[0]).to.equal(60);
      expect(percentages[1]).to.equal(40);
    });

    it("Should return individual recipient details", async function () {
      const [recipient, percentage] = await split.getRecipient(0);
      
      expect(recipient).to.equal(recipient1.address);
      expect(percentage).to.equal(60);
    });
  });
});

