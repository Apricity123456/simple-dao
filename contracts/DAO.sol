// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IToken {
    function balanceOf(address account) external view returns (uint256);
}

contract DAO {
    IToken public governanceToken;

    uint256 public proposalCount;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 id, address proposer, string description);
    event Voted(uint256 id, address voter, bool support);
    event ProposalExecuted(uint256 id, bool passed);

    constructor(address _token) {
        governanceToken = IToken(_token);
    }

    function createProposal(string calldata _description) external {
        require(
            governanceToken.balanceOf(msg.sender) > 0,
            "Only token holders"
        );

        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: _description,
            yesVotes: 0,
            noVotes: 0,
            deadline: block.timestamp + 3 days,
            executed: false
        });

        emit ProposalCreated(proposalCount, msg.sender, _description);
    }

    function vote(uint256 _proposalId, bool support) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(governanceToken.balanceOf(msg.sender) > 0, "No voting power");

        hasVoted[_proposalId][msg.sender] = true;

        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit Voted(_proposalId, msg.sender, support);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.deadline, "Too early");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        bool passed = proposal.yesVotes > proposal.noVotes;

        emit ProposalExecuted(_proposalId, passed);
    }
}
