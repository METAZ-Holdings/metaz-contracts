const { expect } = require('chai');
const { BN, expectEvent, expectRevert, makeInterfaceId, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const FactoryERC1155 = artifacts.require('FactoryERC1155');
const ERC1155Instance = artifacts.require('ERC1155Instance');

const MINUS_ONE = new BN(-1);
const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);
const FOUR = new BN(4);
const FIVE = new BN(5);
const SIX = new BN(6);
const SEVEN = new BN(7);
const EIGHT = new BN(8);
const NINE = new BN(9);
const TEN = new BN(10);
const TWENTY = new BN(20);

const DECIMALS = new BN(18);
const ONE_TOKEN = TEN.pow(DECIMALS);
const TWO_TOKEN = ONE_TOKEN.mul(TWO);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

require('dotenv').config();
const {
} = process.env;

let FactoryERC1155Inst;

contract (
    'ERC1155 factory and instance',
    ([
        deployer,
        owner,
        user1,
        user2
    ]) => {

        beforeEach (async () => {

            FactoryERC1155Inst = await FactoryERC1155.new(owner, owner, "a/");
            await FactoryERC1155Inst.transferOwnership(owner);
        })

        it('Main functionality', async () => {

            await expectRevert(FactoryERC1155Inst.deployERC1155Instance("", ""), "Ownable: caller is not the owner");
            let tx = await FactoryERC1155Inst.deployERC1155Instance("", "", {from: owner});
            let Instance = await ERC1155Instance.at(tx.logs[0].args.instance);

            await expectRevert(Instance.mint([user1, user2], [ZERO, ZERO], [ONE, ONE]), "Not authorized for mint");
            await expectRevert(Instance.mint([user1, user2], [ZERO, ZERO], [ONE, ONE], {from: owner}), "Mint for nonexisting token");

            await expectRevert(Instance.createNewToken([ONE, TWO], [owner, owner], [ZERO, ONE]), "Not authorized for mint");
            await Instance.createNewToken([ONE, TWO], [owner, owner], [ZERO, ONE], {from: owner});

            expect(await Instance.totalSupply(ZERO)).bignumber.equal(ZERO);
            expect(await Instance.totalSupply(ONE)).bignumber.equal(ONE);
            expect(await Instance.balanceOf(owner, ONE)).bignumber.equal(ONE);

            await Instance.mint([user1, user2], [ZERO, ZERO], [ONE, ONE], {from: owner});

            expect(await Instance.totalSupply(ZERO)).bignumber.equal(TWO);
            expect(await Instance.totalSupply(ONE)).bignumber.equal(ONE);
            expect(await Instance.balanceOf(user1, ZERO)).bignumber.equal(ONE);
            expect(await Instance.balanceOf(user2, ZERO)).bignumber.equal(ONE);

            await expectRevert(Instance.burn(user1, ZERO, ONE, {from: user1}), "Not authorized for burn");
            await expectRevert(Instance.burnBatch(user1, [ZERO], [ONE], {from: user1}), "Not authorized for burn");
            await Instance.setApprovalForAll(owner, true, {from: user1});
            await Instance.burn(owner, ONE, ONE, {from: owner});
            await Instance.burnBatch(user1, [ZERO], [ONE], {from: owner});

            expect(await Instance.totalSupply(ZERO)).bignumber.equal(ONE);
            expect(await Instance.totalSupply(ONE)).bignumber.equal(ZERO);
        })

        it('Universal minter test', async () => {

            let tx = await FactoryERC1155Inst.deployERC1155Instance("", "", {from: owner});
            let Instance = [];
            Instance.push(await ERC1155Instance.at(tx.logs[0].args.instance));
            tx = await FactoryERC1155Inst.deployERC1155Instance("", "", {from: owner});
            Instance.push(await ERC1155Instance.at(tx.logs[0].args.instance));

            await expectRevert(Instance[0].createNewToken([ZERO], [user1], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[1].createNewToken([ZERO], [user1], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[0].mint([user2], [ZERO], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[1].mint([user2], [ZERO], [ONE]), "Not authorized for mint");

            await expectRevert(FactoryERC1155Inst.setUniversalMinter(deployer), "Ownable: caller is not the owner");
            await FactoryERC1155Inst.setUniversalMinter(deployer, {from: owner});

            await Instance[0].createNewToken([ZERO], [user1], [ONE]);
            await Instance[1].createNewToken([ZERO], [user1], [ONE]);
            await Instance[0].mint([user2], [ZERO], [ONE]);
            await Instance[1].mint([user2], [ZERO], [ONE]);

            tx = await FactoryERC1155Inst.deployERC1155Instance("", "", {from: owner});
            Instance.push(await ERC1155Instance.at(tx.logs[0].args.instance));

            await Instance[2].createNewToken([ZERO], [user1], [ONE]);
            await Instance[2].mint([user2], [ZERO], [ONE]);

            await expectRevert(FactoryERC1155Inst.setUniversalMinter(owner), "Ownable: caller is not the owner");
            await FactoryERC1155Inst.setUniversalMinter(owner, {from: owner});

            await expectRevert(Instance[0].createNewToken([ONE], [user1], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[1].createNewToken([ONE], [user1], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[2].createNewToken([ONE], [user1], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[0].mint([user2], [ZERO], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[1].mint([user2], [ZERO], [ONE]), "Not authorized for mint");
            await expectRevert(Instance[2].mint([user2], [ZERO], [ONE]), "Not authorized for mint");
        })
    }
)