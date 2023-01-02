// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Marketplace is
    ReentrancyGuard //A modifier that can prevent reentrancy during certain functions.
{
    // Variables
    uint256 public itemCount;
    address payable public admin;   

    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 startPrice;
        bool isSold;
        bool isStarted;
        uint256 endAt;
        address payable highestBidder;
        uint256 highestBid;
        address creator;
        address[] bidderAddress;
        mapping(address => uint256) bids;
    }

    // itemId -> Item
    mapping(uint256 => Item) public items;

    //https://ethereum.stackexchange.com/questions/40396/can-somebody-please-explain-the-concept-of-event-indexing
    event Offered(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        address indexed creator,
        bool isSold,
        bool isStarted,
        uint256 endAt,
        uint256 highestBid
    );
    event StartAuction(bool isStarted, uint256 startPrice);
    event Bid(
        uint256 itemId,
        address indexed highestBidder,
        uint256 highestBid
    );
    event setAdmin(address ad);
    event endAuc(address indexed buyer);

    // constructor() {
    //     admin = payable(msg.sender); // 'msg.sender' is sender of current call, contract deployer for a constructor
    //     emit setAdmin(address(msg.sender));
    // }

    // Make item to offer on the marketplace
    function transItem(IERC721 _nft, uint256 _tokenId) external nonReentrant {
        // transfer nft  Transfers a specific NFT (tokenId) from one account (from) to another (to).
        _nft.transferFrom(msg.sender, address(this), _tokenId);
    }

    function makeItem(IERC721 _nft, uint256 _tokenId) external nonReentrant {
        // increment itemCount
        itemCount++;

        Item storage it = items[itemCount];

        it.itemId = itemCount;
        it.nft = _nft;  
        it.tokenId = _tokenId;
        // it.startPrice = _startPrice;
        // it.seller = payable(msg.sender);
        it.isSold = false;
        it.isStarted = false;
        it.endAt = 0;
        it.highestBidder = payable(address(0));
        it.highestBid = 0;
        it.creator = msg.sender;

        emit Offered(
            itemCount,
            address(_nft),
            _tokenId,
            msg.sender,
            items[itemCount].isSold,
            items[itemCount].isStarted,
            items[itemCount].endAt,
            items[itemCount].highestBid
        );
    }

    function startAuction(
        uint256 _itemId,
        uint256 _endAt,
        uint256 _startPrice
    ) external nonReentrant {
        require(_startPrice > 0, "Price must be greater than zero");
        items[_itemId].isStarted = true;
        items[_itemId].endAt = block.timestamp + _endAt;

        items[_itemId].startPrice = _startPrice;

        emit StartAuction(items[_itemId].isStarted, items[_itemId].startPrice);
    }

    function stopAuction(uint256 _itemId) external nonReentrant {
        items[_itemId].isStarted = false;
    }

    function bid(uint256 _itemId) external payable {
        Item storage item = items[_itemId];

        require(!item.isSold, "item already sold");
        require(item.isStarted, "not started");
        require(block.timestamp < item.endAt, "auction ended");
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(
            msg.value + item.bids[msg.sender] >= item.highestBid,
            "not enough eth to bid"
        ); //bug: item.highestBid = 0

        if (item.highestBidder != address(0)) {
            item.bids[item.highestBidder] = item.highestBid;
            item.bidderAddress.push(item.highestBidder);
        }

        item.highestBidder = payable(msg.sender);
        item.highestBid = msg.value + item.bids[msg.sender];

        emit Bid(_itemId, item.highestBidder, item.highestBid);
    }

    function getBid(uint256 _itemId, address addr)
        public
        view
        returns (uint256)
    {
        return items[_itemId].bids[addr];
    }

    function getBidderAddress(uint256 _itemId, uint256 index)
        public
        view
        returns (address)
    {
        return items[_itemId].bidderAddress[index];
    }

    // function withdraw(uint256 _itemId) external nonReentrant {
    //     Item storage item = items[_itemId];

    //     require(item.bids[msg.sender]>0, "already withdraw");

    //     uint256 balance = item.bids[msg.sender];
    //     item.bids[msg.sender] = 0;

    //     payable(msg.sender).transfer(balance);
    //     //emit
    // }

    function endAuction(uint256 _itemId) external nonReentrant {
        Item storage item = items[_itemId];
        // require(item.isStarted, "not started");  //bug logic
        // require(block.timestamp >= item.endAt, "not ended");
        if(item.highestBidder == address(0)) {
            item.isStarted = false;
            return;
        }

        if (item.highestBidder != address(0)) {
            admin.transfer(item.highestBid);
            // transfer nft to buyer
            item.nft.transferFrom(
                address(this),
                item.highestBidder,
                item.tokenId
            );
            item.isSold = true;

            for (uint256 i = 0; i < item.bidderAddress.length; i++) {
                address currAddress = item.bidderAddress[i];

                if (item.bids[currAddress] > 0) {
                    uint256 balance = item.bids[currAddress];
                    item.bids[currAddress] = 0;
                    payable(currAddress).transfer(balance);
                }
            }
        }
        item.isStarted = false;

        emit endAuc(item.highestBidder);
    }
}
