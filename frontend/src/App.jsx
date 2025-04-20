import { useEffect, useState } from "react";
import { ethers } from "ethers";
import tokenABI from "./contracts/YangShangyuToken.json";
import daoABI from "./contracts/DAO.json";
import { GOVERNANCE_TOKEN_ADDRESS, DAO_ADDRESS } from "./contracts/address";

function App() {
  const [account, setAccount] = useState(null);
  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");
  const [proposals, setProposals] = useState([]);

  // 连接钱包
  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    }
  }

  // 获取代币信息
  async function fetchTokenInfo() {
    console.log("🧠 正在调用 fetchTokenInfo()");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(GOVERNANCE_TOKEN_ADDRESS, tokenABI.abi, provider);
      const name = await contract.name();
      const sym = await contract.symbol();
      console.log("✅ 获取成功:", name, sym);
      setTokenName(name);
      setSymbol(sym);
    } catch (err) {
      console.error("❌ 获取失败:", err);
    }
  }

  // 创建提案
  async function createProposal() {
    if (!window.ethereum || !account) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const dao = new ethers.Contract(DAO_ADDRESS, daoABI.abi, signer);

    try {
      const tx = await dao.createProposal(proposalDesc);
      await tx.wait();
      alert("✅ 提案创建成功！");
      setProposalDesc(""); // 清空输入框
    } catch (err) {
      console.error("创建提案失败：", err);
      alert("⚠️ 创建失败（你可能没有代币）");
    }
  }
  async function fetchProposals() {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const dao = new ethers.Contract(DAO_ADDRESS, daoABI.abi, provider);

    try {
      const count = await dao.proposalCount();
      const proposalsArray = [];

      for (let i = 1; i <= parseInt(count); i++) {
        const p = await dao.proposals(i);
        proposalsArray.push(p);
      }

      setProposals(proposalsArray);
    } catch (err) {
      console.error("提案获取失败：", err);
    }
  }
  async function voteOnProposal(id, support) {
    if (!window.ethereum || !account) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const dao = new ethers.Contract(DAO_ADDRESS, daoABI.abi, signer);

    try {
      const tx = await dao.vote(id, support);
      await tx.wait();
      alert("✅ 投票成功！");
      fetchProposals(); // 重新加载
    } catch (err) {
      console.error("投票失败：", err);
      alert("⚠️ 投票失败，可能已投票或合约报错");
    }
  }
  useEffect(() => {
    console.log("🟡 useEffect 触发了。account =", account);
    if (account) {
      fetchTokenInfo();
      fetchProposals();
    }
  }, [account]);
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🌐 Lucas DAO 前端</h1>

      {!account ? (
        <button onClick={connectWallet}>连接钱包</button>
      ) : (
        <div>
          <p>✅ 钱包已连接: {account}</p>
          <p>🎖️ 代币信息: {tokenName} ({symbol})</p>

          <div style={{ marginTop: "30px" }}>
            <h2>📝 创建新提案</h2>
            <input
              type="text"
              placeholder="例如：资助 Lucas 项目 5000 YSY"
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
              style={{ width: "300px", padding: "8px" }}
            />
            <button onClick={createProposal} style={{ marginLeft: "10px", padding: "8px" }}>
              创建提案
            </button>
          </div>

          <div style={{ marginTop: "40px" }}>
            <h2>📋 当前提案</h2>

            {proposals.length === 0 ? (
              <p>暂无提案</p>
            ) : (
              proposals.map((p, index) => (
                <div key={index} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "12px" }}>
                  <p><strong>ID:</strong> {p.id.toString()}</p>
                  <p><strong>描述:</strong> {p.description}</p>
                  <p><strong>提案人:</strong> {p.proposer}</p>
                  <p>✅ 支持: {p.yesVotes.toString()} | ❌ 反对: {p.noVotes.toString()}</p>
                  <p>📦 执行状态: {p.executed ? "已执行" : "未执行"}</p>
                  <p>⏳ 截止时间: {new Date(parseInt(p.deadline) * 1000).toLocaleString()}</p>

                  {!p.executed && (
                    <div style={{ marginTop: "10px" }}>
                      <button onClick={() => voteOnProposal(p.id, true)}>✅ 支持</button>
                      <button onClick={() => voteOnProposal(p.id, false)} style={{ marginLeft: "10px" }}>❌ 反对</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

}

export default App;
