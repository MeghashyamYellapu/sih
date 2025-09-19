// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import CONTRACT_ABI from "./abi/SupplyChain.json";
import "./App.css";
import { Routes, Route, Link } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export default function App() {
  // basic web3 state
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  // UI / dashboard state
  const [txStatus, setTxStatus] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);
  const [approvedProducts, setApprovedProducts] = useState(0);
  const [registeredRoles, setRegisteredRoles] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);

  // forms & products
  const [createForm, setCreateForm] = useState({
    name: "",
    batchId: "",
    category: "",
    productionDate: "",
    metadataURI: "",
  });
  const [producerAddr, setProducerAddr] = useState("");
  const [producerDetails, setProducerDetails] = useState("");
  const [inspectorAddr, setInspectorAddr] = useState("");
  const [inspectorDetails, setInspectorDetails] = useState("");
  const [distributorAddr, setDistributorAddr] = useState("");
  const [distributorDetails, setDistributorDetails] = useState("");
  const [retailerAddr, setRetailerAddr] = useState("");
  const [retailerDetails, setRetailerDetails] = useState("");
  const [searchProductId, setSearchProductId] = useState("");
  const [productsList, setProductsList] = useState([]);
  const [roleChecksLoading, setRoleChecksLoading] = useState(false);

  // refs for handling event listeners cleanup if needed
  const contractRef = useRef();

  // Initialize provider (window.ethereum preferred, fallback to JSON RPC)
  useEffect(() => {
    async function init() {
      try {
        let p;
        if (window.ethereum) {
          p = new ethers.BrowserProvider(window.ethereum);
        } else {
          // fallback read-only provider
          p = new ethers.JsonRpcProvider(RPC_URL);
        }
        setProvider(p);

        // if env has contract address, create read-only contract (no signer yet)
        if (CONTRACT_ADDRESS && p) {
          const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, p);
          setContract(readContract);
          contractRef.current = readContract;
        }
      } catch (err) {
        console.error("init error", err);
      }
    }
    init();

    // cleanup on unmount
    return () => {
      if (contractRef.current && contractRef.current.removeAllListeners) {
        contractRef.current.removeAllListeners();
      }
    };
  }, []);

  // When signer/account changes, create contract with signer
  useEffect(() => {
    if (!provider || !account) return;
    (async () => {
      try {
        const s = await provider.getSigner();
        setSigner(s);
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
        setContract(connectedContract);
        contractRef.current = connectedContract;
        // auto refresh dashboard
        updateDashboard(connectedContract);
      } catch (err) {
        console.error("Error setting signer/contract:", err);
      }
    })();
  }, [provider, account]);

  // --- Wallet connect ---
  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or a compatible wallet.");
        return;
      }
      // Request accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      const s = await p.getSigner();
      const addr = await s.getAddress();
      setAccount(addr);
      setSigner(s);
      if (CONTRACT_ADDRESS) {
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
        setContract(c);
        contractRef.current = c;
        updateDashboard(c);
      }
      setTxStatus("Wallet connected: " + `${addr.slice(0,6)}...${addr.slice(-4)}`);
    } catch (err) {
      console.error(err);
      setTxStatus("Failed to connect wallet: " + (err.message || err));
    }
  }

  // --- Helper: show & clear tx status ---
  function setStatus(msg, autoClear = true, timeout = 5000) {
    setTxStatus(msg);
    if (autoClear) setTimeout(() => setTxStatus(""), timeout);
  }

  // --- Use my address helper (fills input with connected account) ---
  function fillMyAddress(setter) {
    if (!account) {
      setStatus("Connect wallet first", true);
      return;
    }
    setter(account);
  }

  // --- Core actions (wrap calls with loading UI) ---
  async function registerProducer() {
    if (!contract) return setStatus("Connect wallet first");
    if (!ethers.isAddress(producerAddr) || !producerDetails.trim()) {
      return setStatus("Invalid producer address or details", true);
    }
    const btn = document.activeElement;
    try {
      setStatus("Sending registerProducer tx...");
      const tx = await contract.registerProducer(producerAddr, producerDetails);
      await tx.wait();
      setProducerAddr("");
      setProducerDetails("");
      setStatus("Producer registered ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    } finally {
      if (btn) btn.blur();
    }
  }

  async function registerQualityInspector() {
    if (!contract) return setStatus("Connect wallet first");
    if (!ethers.isAddress(inspectorAddr) || !inspectorDetails.trim()) {
      return setStatus("Invalid inspector address or details", true);
    }
    try {
      setStatus("Registering inspector...");
      const tx = await contract.registerQualityInspector(inspectorAddr, inspectorDetails);
      await tx.wait();
      setInspectorAddr("");
      setInspectorDetails("");
      setStatus("Inspector registered ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function registerDistributor() {
    if (!contract) return setStatus("Connect wallet first");
    if (!ethers.isAddress(distributorAddr) || !distributorDetails.trim()) {
      return setStatus("Invalid distributor address or details", true);
    }
    try {
      setStatus("Registering distributor...");
      const tx = await contract.registerDistributor(distributorAddr, distributorDetails);
      await tx.wait();
      setDistributorAddr("");
      setDistributorDetails("");
      setStatus("Distributor registered ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function registerRetailer() {
    if (!contract) return setStatus("Connect wallet first");
    if (!ethers.isAddress(retailerAddr) || !retailerDetails.trim()) {
      return setStatus("Invalid retailer address or details", true);
    }
    try {
      setStatus("Registering retailer...");
      const tx = await contract.registerRetailer(retailerAddr, retailerDetails);
      await tx.wait();
      setRetailerAddr("");
      setRetailerDetails("");
      setStatus("Retailer registered ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function createProduct(e) {
    e && e.preventDefault && e.preventDefault();
    if (!contract) return setStatus("Connect wallet first");
    const { name, batchId, category, productionDate, metadataURI } = createForm;
    if (!name || !batchId || !category || !productionDate) {
      return setStatus("Please fill all product fields", true);
    }
    try {
      setStatus("Creating product...");
      // productionDate must be a unix timestamp (seconds), convert if required
      const productionTs = Math.floor(new Date(productionDate).getTime() / 1000);
      const tx = await contract.createProduct(name, batchId, category, productionTs, metadataURI || "");
      const rc = await tx.wait();
      // optionally parse events from rc.receipt/logs to get new productId
      setCreateForm({ name: "", batchId: "", category: "", productionDate: "", metadataURI: "" });
      setStatus("Product created ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function assignDistributor(productId, distributorAddress) {
    if (!contract) return setStatus("Connect wallet first");
    if (!productId || !ethers.isAddress(distributorAddress)) {
      return setStatus("Invalid input", true);
    }
    try {
      setStatus("Assigning distributor...");
      const tx = await contract.assignDistributor(productId, distributorAddress);
      await tx.wait();
      setStatus("Distributor assigned ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function assignRetailerFn(productId, retailerAddress) {
    if (!contract) return setStatus("Connect wallet first");
    if (!productId || !ethers.isAddress(retailerAddress)) {
      return setStatus("Invalid input", true);
    }
    try {
      setStatus("Assigning retailer...");
      const tx = await contract.assignRetailer(productId, retailerAddress);
      await tx.wait();
      setStatus("Retailer assigned ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function addCertification(productId, certification) {
    if (!contract) return setStatus("Connect wallet first");
    if (!productId || !certification) return setStatus("Invalid input", true);
    try {
      setStatus("Adding certification...");
      const tx = await contract.addCertification(productId, certification);
      await tx.wait();
      setStatus("Certification added ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function approveQuality(productId, expiryDate) {
    if (!contract) return setStatus("Connect wallet first");
    if (!productId || !expiryDate) return setStatus("Invalid input", true);
    try {
      const expiryTs = Math.floor(new Date(expiryDate).getTime() / 1000);
      setStatus("Approving quality...");
      const tx = await contract.approveQuality(productId, expiryTs);
      await tx.wait();
      setStatus("Quality approved ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  async function sellToConsumer(productId, consumerAddress) {
    if (!contract) return setStatus("Connect wallet first");
    if (!productId || !ethers.isAddress(consumerAddress)) return setStatus("Invalid input", true);
    try {
      setStatus("Selling to consumer...");
      const tx = await contract.sellToConsumer(productId, consumerAddress);
      await tx.wait();
      setStatus("Sold to consumer ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  // --- Search & load products ---
  async function searchProduct() {
    if (!contract) return setStatus("Connect wallet first");
    if (!searchProductId) return setStatus("Enter a product ID", true);
    try {
      setStatus("Searching product...");
      const info = await contract.getFullProductDetails(Number(searchProductId));
      setProductsList([ { id: Number(searchProductId), info } ]);
      setStatus("Product loaded");
    } catch (err) {
      console.error(err);
      setStatus("Error loading product: " + (err?.message ?? err), true);
    }
  }

  async function loadAllProducts() {
    if (!contract) return setStatus("Connect wallet first");
    try {
      setStatus("Loading products (this may take a while) ...", false);
      const next = await contract.nextProductId();
      const max = Number(next) - 1;
      const list = [];
      for (let i = 1; i <= max; i++) {
        try {
          const info = await contract.getBasicProductInfo(i);
          list.push({ id: i, info });
        } catch (err) {
          // ignore missing entries
        }
      }
      setProductsList(list);
      setStatus("Loaded products: " + list.length, true);
    } catch (err) {
      console.error(err);
      setStatus("Error loading products: " + (err?.message ?? err), true);
    }
  }

  // --- Utility to detect role for an address ---
  async function getRoleForAddress(address) {
    if (!contract) return "Participant";
    setRoleChecksLoading(true);
    try {
      if (await contract.isProducerRegistered(address)) return "Producer";
      if (await contract.isQualityInspectorRegistered(address)) return "Quality Inspector";
      if (await contract.isDistributorRegistered(address)) return "Distributor";
      if (await contract.isRetailerRegistered(address)) return "Retailer";
      if (address === account) return "You";
    } catch (err) {
      console.error("role check error", err);
    } finally {
      setRoleChecksLoading(false);
    }
    return "Participant";
  }

  // --- Dashboard update (aggregates counts) ---
  async function updateDashboard(c = contract) {
    if (!c) return;
    try {
      const next = await c.nextProductId();
      const total = Number(next) - 1;
      setTotalProducts(total);

      // Count approved products (inefficient but matches index.html approach)
      let approved = 0;
      for (let i = 1; i <= total; i++) {
        try {
          const basic = await c.getBasicProductInfo(i);
          if (basic[6]) approved++;
        } catch {}
      }
      setApprovedProducts(approved);

      // counts of roles
      let producers = 0, inspectors = 0, distributors = 0, retailers = 0;
      try { producers = Number(await c.totalProducers()); } catch {}
      try { inspectors = Number(await c.totalQualityInspectors()); } catch {}
      try { distributors = Number(await c.totalDistributors()); } catch {}
      try { retailers = Number(await c.totalRetailers()); } catch {}

      const rolesTotal = producers + inspectors + distributors + retailers;
      setRegisteredRoles(rolesTotal);

      // simple transfers estimate
      setTotalTransfers(total > 0 ? total * 2 : 0);
    } catch (err) {
      console.error("updateDashboard err", err);
    }
  }

  // --- Beautiful UI layout ---
  const MainUI = () => (
    <div className="container">
      <header className="header" style={{ position: 'relative' }}>
        <h1>SupplyChain DApp</h1>
        <p>Decentralized Supply Chain Management System</p>
        <div style={{ position: 'absolute', top: 18, right: 24, display: 'flex', gap: 10 }}>
          <Link to="/register" className="btn">Register</Link>
          <Link to="/login" className="btn">Login</Link>
        </div>
      </header>



      {txStatus && (
        <div className={`alert ${txStatus.includes('Error') || txStatus.includes('Failed') ? 'alert-error' : 'alert-success'}`}>
          {txStatus}
        </div>
      )}

      <section className="grid">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📦</div>
            <h2 className="card-title">Create Product</h2>
          </div>
          
          <form onSubmit={createProduct}>
            <div className="form-group">
              <label>Product Name</label>
              <input 
                placeholder="Enter product name"
                value={createForm.name} 
                onChange={(e)=>setCreateForm({...createForm, name: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Batch ID</label>
              <input 
                placeholder="Enter batch ID"
                value={createForm.batchId} 
                onChange={(e)=>setCreateForm({...createForm, batchId: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input 
                placeholder="Enter product category"
                value={createForm.category} 
                onChange={(e)=>setCreateForm({...createForm, category: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Production Date</label>
              <input 
                type="date" 
                value={createForm.productionDate} 
                onChange={(e)=>setCreateForm({...createForm, productionDate: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Metadata URI (optional)</label>
              <input 
                placeholder="https://example.com/metadata.json"
                value={createForm.metadataURI} 
                onChange={(e)=>setCreateForm({...createForm, metadataURI: e.target.value})} 
              />
            </div>
            <button type="submit" className="btn btn-success">Create Product</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-icon">👥</div>
            <h2 className="card-title">Role Registration</h2>
          </div>
          
          <div className="form-group">
            <h4>Producer Registration</h4>
            <input 
              placeholder="Producer address (0x...)" 
              value={producerAddr} 
              onChange={(e)=>setProducerAddr(e.target.value)} 
            />
            <input 
              placeholder="Producer details/company name" 
              value={producerDetails} 
              onChange={(e)=>setProducerDetails(e.target.value)} 
            />
            <button className="btn btn-secondary" onClick={()=> fillMyAddress(setProducerAddr)}>
              Use My Address
            </button>
            <button className="btn" onClick={registerProducer}>Register Producer</button>
          </div>

          <div className="form-group">
            <h4>Quality Inspector</h4>
            <input 
              placeholder="Inspector address (0x...)" 
              value={inspectorAddr} 
              onChange={(e)=>setInspectorAddr(e.target.value)} 
            />
            <input 
              placeholder="Inspector details/certification" 
              value={inspectorDetails} 
              onChange={(e)=>setInspectorDetails(e.target.value)} 
            />
            <button className="btn" onClick={registerQualityInspector}>Register Inspector</button>
          </div>

          <div className="form-group">
            <h4>Distributor</h4>
            <input 
              placeholder="Distributor address (0x...)" 
              value={distributorAddr} 
              onChange={(e)=>setDistributorAddr(e.target.value)} 
            />
            <input 
              placeholder="Distributor details/company name" 
              value={distributorDetails} 
              onChange={(e)=>setDistributorDetails(e.target.value)} 
            />
            <button className="btn" onClick={registerDistributor}>Register Distributor</button>
          </div>

          <div className="form-group">
            <h4>Retailer</h4>
            <input 
              placeholder="Retailer address (0x...)" 
              value={retailerAddr} 
              onChange={(e)=>setRetailerAddr(e.target.value)} 
            />
            <input 
              placeholder="Retailer details/store name" 
              value={retailerDetails} 
              onChange={(e)=>setRetailerDetails(e.target.value)} 
            />
            <button className="btn" onClick={registerRetailer}>Register Retailer</button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="card-icon">🔍</div>
          <h2 className="card-title">Products Management</h2>
        </div>
        
        <div className="form-group">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label>Search Product</label>
              <input 
                placeholder="Enter Product ID" 
                value={searchProductId} 
                onChange={(e)=>setSearchProductId(e.target.value)} 
              />
            </div>
            <button className="btn" onClick={searchProduct}>Search Product</button>
            <button className="btn btn-secondary" onClick={loadAllProducts}>Load All Products</button>
            <button className="btn btn-warning" onClick={()=>updateDashboard(contract)}>Refresh Data</button>
          </div>
        </div>

        <div>
          {productsList.length === 0 ? (
            <div className="empty-state">
              <h3>No Products Found</h3>
              <p>Search for a product ID or load all products to view supply chain data.</p>
            </div>
          ) : (
            productsList.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-id">Product ID: {p.id}</div>
                <pre style={{ 
                  whiteSpace: "pre-wrap", 
                  background: "rgba(255,255,255,0.05)", 
                  padding: "15px", 
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  overflow: "auto"
                }}>
                  {JSON.stringify(p.info, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="card-header">
          <div className="card-icon">📊</div>
          <h2 className="card-title">Supply Chain Dashboard</h2>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{approvedProducts}</div>
            <div className="stat-label">Quality Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{registeredRoles}</div>
            <div className="stat-label">Registered Participants</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalTransfers}</div>
            <div className="stat-label">Total Transfers</div>
          </div>
        </div>
      </section>

      {/* Animated background particles */}
      <div className="animated-bg">
        <div className="bg-particle" style={{
          width: '100px',
          height: '100px',
          top: '20%',
          left: '10%',
          animationDelay: '0s'
        }}></div>
        <div className="bg-particle" style={{
          width: '150px',
          height: '150px',
          top: '60%',
          right: '15%',
          animationDelay: '2s'
        }}></div>
        <div className="bg-particle" style={{
          width: '80px',
          height: '80px',
          bottom: '30%',
          left: '70%',
          animationDelay: '4s'
        }}></div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainUI />} />
      <Route path="/login" element={<Login onChange={({userName, account, role})=>console.log('Login data', userName, account, role)} />} />
      <Route path="/register" element={<Register onChange={({userName, account, role})=>console.log('Register data', userName, account, role)} />} />
    </Routes>
  );
}