// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract QuestSystem is Ownable {
    struct Quest {
        uint256 id;
        string title;
        string description;
        uint256 rewardAmount;
        address rewardToken;
        bool isActive;
        mapping(address => bool) completed;
    }

    mapping(uint256 => Quest) public quests;
    uint256 public nextQuestId;

    event QuestCreated(uint256 indexed questId, string title, uint256 rewardAmount);
    event QuestCompleted(uint256 indexed questId, address indexed user);
    event RewardClaimed(uint256 indexed questId, address indexed user, uint256 amount);

    constructor() {
        nextQuestId = 1;
    }

    function createQuest(
        string memory _title,
        string memory _description,
        uint256 _rewardAmount,
        address _rewardToken
    ) external onlyOwner {
        Quest storage quest = quests[nextQuestId];
        quest.id = nextQuestId;
        quest.title = _title;
        quest.description = _description;
        quest.rewardAmount = _rewardAmount;
        quest.rewardToken = _rewardToken;
        quest.isActive = true;

        emit QuestCreated(nextQuestId, _title, _rewardAmount);
        nextQuestId++;
    }

    function completeQuest(uint256 _questId) external {
        Quest storage quest = quests[_questId];
        require(quest.isActive, "Quest is not active");
        require(!quest.completed[msg.sender], "Quest already completed");

        quest.completed[msg.sender] = true;
        emit QuestCompleted(_questId, msg.sender);

        // Transfer reward
        IERC20(quest.rewardToken).transfer(msg.sender, quest.rewardAmount);
        emit RewardClaimed(_questId, msg.sender, quest.rewardAmount);
    }

    function isQuestCompleted(uint256 _questId, address _user) external view returns (bool) {
        return quests[_questId].completed[_user];
    }

    function deactivateQuest(uint256 _questId) external onlyOwner {
        quests[_questId].isActive = false;
    }
}
