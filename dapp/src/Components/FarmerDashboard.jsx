// src/Components/FarmerDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { Link, useNavigate } from 'react-router-dom';
import CONTRACT_ABI from "../abi/SupplyChain.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

const FarmerDashboard = ({ userInfo }) => {
  const navigate = useNavigate();
  
  // Basic web3 state
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  // UI / dashboard state
  const [txStatus, setTxStatus] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);
  const [approvedProducts, setApprovedProducts] = useState(0);
  const [myProducts, setMyProducts] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);

  // Forms & products
  const [createForm, setCreateForm] = useState({
    name: "",
    batchId: "",
    category: "",
    productionDate: "",
    metadataURI: "",
  });
  const [searchProductId, setSearchProductId] = useState("");
  const [productsList, setProductsList] = useState([]);

  // Refs for handling event listeners cleanup
  const contractRef = useRef();

  // Initialize provider and contract
  useEffect(() => {
    async function init() {
      try {
        let p;
        if (window.ethereum) {
          p = new ethers.BrowserProvider(window.ethereum);
        } else {
          p = new ethers.JsonRpcProvider(RPC_URL);
        }
        setProvider(p);

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

    return () => {
      if (contractRef.current && contractRef.current.removeAllListeners) {
        contractRef.current.removeAllListeners();
      }
    };
  }, []);

  // Setup signer when user info is available
  useEffect(() => {
    if (!provider || !userInfo?.account) return;
    (async () => {
      try {
        const s = await provider.getSigner();
        setSigner(s);
        setAccount(userInfo.account);
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
        setContract(connectedContract);
        contractRef.current = connectedContract;
        updateDashboard(connectedContract);
      } catch (err) {
        console.error("Error setting signer/contract:", err);
      }
    })();
  }, [provider, userInfo]);

  // Helper: show & clear tx status
  function setStatus(msg, autoClear = true, timeout = 5000) {
    setTxStatus(msg);
    if (autoClear) setTimeout(() => setTxStatus(""), timeout);
  }

  // Create product function
  async function createProduct(e) {
    e && e.preventDefault && e.preventDefault();
    if (!contract) return setStatus("Connect wallet first");
    const { name, batchId, category, productionDate, metadataURI } = createForm;
    if (!name || !batchId || !category || !productionDate) {
      return setStatus("Please fill all product fields", true);
    }
    try {
      setStatus("Creating product...");
      const productionTs = Math.floor(new Date(productionDate).getTime() / 1000);
      const tx = await contract.createProduct(name, batchId, category, productionTs, metadataURI || "");
      await tx.wait();
      setCreateForm({ name: "", batchId: "", category: "", productionDate: "", metadataURI: "" });
      setStatus("Product created successfully! ✓");
      updateDashboard(contract);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err?.message ?? err), true);
    }
  }

  // Search product function
  async function searchProduct() {
    if (!contract) return setStatus("Connect wallet first");
    if (!searchProductId) return setStatus("Enter a product ID", true);
    try {
      setStatus("Searching product...");
      const info = await contract.getFullProductDetails(Number(searchProductId));
      setProductsList([{ id: Number(searchProductId), info }]);
      setStatus("Product loaded");
    } catch (err) {
      console.error(err);
      setStatus("Error loading product: " + (err?.message ?? err), true);
    }
  }

  // Load all products function
  async function loadAllProducts() {
    if (!contract) return setStatus("Connect wallet first");
    try {
      setStatus("Loading products (this may take a while)...", false);
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

  // Dashboard update function
  async function updateDashboard(c = contract) {
    if (!c) return;
    try {
      const next = await c.nextProductId();
      const total = Number(next) - 1;
      setTotalProducts(total);

      // Count approved products
      let approved = 0;
      let myProductsCount = 0;
      
      for (let i = 1; i <= total; i++) {
        try {
          const basic = await c.getBasicProductInfo(i);
          if (basic[6]) approved++;
          
          // Count farmer's own products
          if (basic[1] === account) myProductsCount++;
        } catch {}
      }
      
      setApprovedProducts(approved);
      setMyProducts(myProductsCount);
      setTotalTransfers(total > 0 ? total * 2 : 0);
    } catch (err) {
      console.error("updateDashboard err", err);
    }
  }

  // Logout function
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div className="container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        color: '#fff'
      }}>
        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '20px 30px',
          marginBottom: '30px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              margin: '0 0 10px 0',
              background: 'linear-gradient(45deg, #fff, #f0f8ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🌾 Farmer Dashboard
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
              Welcome back, <strong>{userInfo?.userName || 'Farmer'}</strong>! Manage your products and track your supply chain.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '10px 15px',
              borderRadius: '10px',
              fontSize: '0.9rem'
            }}>
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {/* Status Alert */}
        {txStatus && (
          <div style={{
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '25px',
            backgroundColor: txStatus.includes('Error') || txStatus.includes('Failed') 
              ? 'rgba(255, 107, 107, 0.9)' 
              : 'rgba(72, 187, 120, 0.9)',
            color: '#fff',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {txStatus}
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          {/* Create Product Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '2rem',
                background: 'rgba(255, 255, 255, 0.2)',
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                📦
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                Create Product
              </h2>
            </div>

            <form onSubmit={createProduct}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', opacity: 0.9 }}>
                  Product Name
                </label>
                <input
                  placeholder="Enter product name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', opacity: 0.9 }}>
                    Batch ID
                  </label>
                  <input
                    placeholder="Enter batch ID"
                    value={createForm.batchId}
                    onChange={(e) => setCreateForm({ ...createForm, batchId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', opacity: 0.9 }}>
                    Category
                  </label>
                  <input
                    placeholder="Enter category"
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', opacity: 0.9 }}>
                  Production Date
                </label>
                <input
                  type="date"
                  value={createForm.productionDate}
                  onChange={(e) => setCreateForm({ ...createForm, productionDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', opacity: 0.9 }}>
                  Metadata URI (optional)
                </label>
                <input
                  placeholder="https://example.com/metadata.json"
                  value={createForm.metadataURI}
                  onChange={(e) => setCreateForm({ ...createForm, metadataURI: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 5px 15px rgba(74, 222, 128, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🌱 Create Product
              </button>
            </form>
          </div>

          {/* Products Management Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '2rem',
                background: 'rgba(255, 255, 255, 0.2)',
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🔍
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                Products Management
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                placeholder="Enter Product ID"
                value={searchProductId}
                onChange={(e) => setSearchProductId(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={searchProduct}
                style={{
                  background: 'rgba(59, 130, 246, 0.8)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                🔍 Search
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={loadAllProducts}
                style={{
                  background: 'rgba(139, 69, 19, 0.8)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  flex: 1
                }}
              >
                📦 Load All Products
              </button>
              <button
                onClick={() => updateDashboard(contract)}
                style={{
                  background: 'rgba(245, 158, 11, 0.8)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '10px'
            }}>
              {productsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>No Products Found</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    Search for a product ID or load all products to view data.
                  </p>
                </div>
              ) : (
                productsList.map((p) => (
                  <div key={p.id} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                      Product ID: {p.id}
                    </div>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.8rem',
                      margin: 0,
                      opacity: 0.9,
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(p.info, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Supply Chain Dashboard */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              fontSize: '2rem',
              background: 'rgba(255, 255, 255, 0.2)',
              width: '60px',
              height: '60px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              📊
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
              Supply Chain Dashboard
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(74, 222, 128, 0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center',
              border: '1px solid rgba(74, 222, 128, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '5px' }}>
                {myProducts}
              </div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>My Products</div>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '5px' }}>
                {totalProducts}
              </div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Total Products</div>
            </div>

            <div style={{
              background: 'rgba(34, 197, 94, 0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '5px' }}>
                {approvedProducts}
              </div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Quality Approved</div>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '5px' }}>
                {totalTransfers}
              </div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Total Transfers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;