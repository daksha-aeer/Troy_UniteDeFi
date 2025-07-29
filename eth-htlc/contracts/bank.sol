pragma solidity ^0.8.0;

contract Bank{
    // mapping that maintains a record of the balance associated with an address
    mapping (address => uint) public balances;

    event Withdrawal(uint amount, address user);
    event Deposit(uint amount, address user);

    function deposit(uint amount) public {
        balances[msg.sender] += amount;
        emit Deposit(amount, msg.sender);
    }

    function withdraw( uint amount) public {
        require(amount <= balances[msg.sender], "Cannot withdraw");
        balances[msg.sender] -= amount;
        emit Withdrawal(amount, msg.sender);
    }

    function getBalance() public view returns (uint){
        return balances[msg.sender];
    }
}