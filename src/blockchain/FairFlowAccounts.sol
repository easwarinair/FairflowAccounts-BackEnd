// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract FairFlowAccounts {
    event ProjectCreated();
    event FundsSent(address indexed to, uint amount);
    event FundsReceived(address indexed from, uint amount);
    event PhaseUpdated(uint phase);
    event PhaseCompleted(uint phase);
    event ManagerAdded(address newManager, address oldManager);
    address public owner;
    mapping(address => bool) public managers;
    string public projectTitle;
    string public projectDescription;
    uint public totalFundsRequired;
    uint public totalFundsReceived;
    uint public totalFundsSpent;
    uint public currentPhase;

    struct Phase {
        string description;
        bool isCompleted;
        string updates;
    }

    Phase[] public phases;
    mapping(address => uint) public income;
    mapping(address => uint) public expenses;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    modifier onlyManager() {
        require(managers[msg.sender], "Only a manager can call this function.");
        _;
    }

    constructor(
        string memory _projectTitle,
        string memory _projectDescription,
        uint _totalFundsRequired,
        string[] memory _phaseDescriptions
    ) {
        owner = msg.sender;
        managers[owner] = true; // owner is automatically a manager
        projectTitle = _projectTitle;
        projectDescription = _projectDescription;
        totalFundsRequired = _totalFundsRequired;
        currentPhase = 0;

        for (uint i = 0; i < _phaseDescriptions.length; i++) {
            phases.push(
                Phase({
                    description: _phaseDescriptions[i],
                    isCompleted: false,
                    updates: ""
                })
            );
        }
        emit ProjectCreated();
    }

    function addManager(address _newManager) public onlyOwner {
        managers[_newManager] = true;
        emit ManagerAdded(_newManager, msg.sender);
    }

    function fundProject() public payable {
        totalFundsReceived += msg.value;
        income[msg.sender] += msg.value;
        emit FundsReceived(msg.sender, msg.value);
    }

    function sendFunds(
        address payable _to,
        uint _amount,
        string memory _purpose
    ) public onlyManager {
        require(
            totalFundsReceived - totalFundsSpent >= _amount,
            "Insufficient funds."
        );
        _to.transfer(_amount);
        totalFundsSpent += _amount;
        expenses[msg.sender] += _amount;
        emit FundsSent(_to, _amount);
    }

    function updatePhase(string memory _updates) public onlyManager {
        require(currentPhase < phases.length, "Invalid phase index.");
        phases[currentPhase].updates = _updates;
        emit PhaseUpdated(currentPhase);
    }

    function completePhase() public onlyManager {
        require(currentPhase < phases.length, "Invalid phase index.");
        require(!phases[currentPhase].isCompleted, "Phase already completed.");
        phases[currentPhase].isCompleted = true;
        emit PhaseCompleted(currentPhase);
        if (currentPhase < phases.length - 1) {
            currentPhase++;
        }
    }

    function getProjectStatus()
        public
        view
        returns (
            string memory,
            uint,
            string memory,
            string memory,
            uint,
            uint,
            uint
        )
    {
        Phase memory phase = phases[currentPhase];
        uint256 bal = address(this).balance;
        return (
            projectTitle,
            currentPhase,
            phase.description,
            phase.updates,
            bal,
            totalFundsReceived,
            totalFundsSpent
        );
    }

    receive() external payable {
        fundProject();
    }
}
