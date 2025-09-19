// src/Components/Register.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

const Register = ({ onChange }) => {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    role: '',
    walletAddress: '',
    companyName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState({});

  const roles = [
    { value: '', label: 'Select Role' },
    { value: 'producer', label: 'Producer' },
    { value: 'quality_inspector', label: 'Quality Inspector' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'consumer', label: 'Consumer' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus('Please install MetaMask or a compatible wallet.');
        return;
      }

      setIsLoading(true);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setFormData(prev => ({
        ...prev,
        walletAddress: address
      }));
      
      setStatus('Wallet connected successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setStatus('Failed to connect wallet: ' + (error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.role) {
      newErrors.role = 'Role selection is required';
    }

    if (!formData.walletAddress) {
      newErrors.walletAddress = 'Wallet connection is required';
    } else if (!ethers.isAddress(formData.walletAddress)) {
      newErrors.walletAddress = 'Invalid wallet address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setStatus('Please fix the errors below');
      return;
    }

    setIsLoading(true);
    setStatus('Creating account...');

    try {
      // Simulate registration process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the onChange callback to pass data back to parent
      if (onChange) {
        onChange({
          userName: formData.userName,
          account: formData.walletAddress,
          role: formData.role,
          email: formData.email,
          companyName: formData.companyName,
          phone: formData.phone
        });
      }

      setStatus('Registration successful! Welcome to SupplyChain DApp!');
      
      // Reset form after successful registration
      setTimeout(() => {
        setFormData({
          userName: '',
          email: '',
          role: '',
          walletAddress: '',
          companyName: '',
          phone: '',
          password: '',
          confirmPassword: ''
        });
        setStatus('');
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setStatus('Registration failed: ' + (error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '600px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: '#333',
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Join SupplyChain
          </h1>
          <p style={{
            color: '#666',
            fontSize: '1.1rem',
            margin: '0 0 10px 0'
          }}>
            Create your account to participate in the decentralized supply chain
          </p>
          <div style={{ marginTop: '15px' }}>
            <Link 
              to="/" 
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.9rem',
                marginRight: '20px'
              }}
            >
              ← Back to Home
            </Link>
            <Link 
              to="/login" 
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              Already have an account? Login
            </Link>
          </div>
        </div>

        {/* Status Alert */}
        {status && (
          <div style={{
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            backgroundColor: status.includes('Error') || status.includes('Failed') || status.includes('fix') 
              ? '#fee' 
              : '#efe',
            border: `1px solid ${status.includes('Error') || status.includes('Failed') || status.includes('fix') 
              ? '#fcc' 
              : '#cfc'}`,
            color: status.includes('Error') || status.includes('Failed') || status.includes('fix') 
              ? '#c33' 
              : '#363'
          }}>
            {status}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>
              📝 Basic Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  Username *
                </label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: errors.userName ? '2px solid #ff6b6b' : '2px solid #e1e8ed',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#fff'
                  }}
                />
                {errors.userName && (
                  <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                    {errors.userName}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: errors.email ? '2px solid #ff6b6b' : '2px solid #e1e8ed',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#fff'
                  }}
                />
                {errors.email && (
                  <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: errors.phone ? '2px solid #ff6b6b' : '2px solid #e1e8ed',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s ease',
                  backgroundColor: '#fff'
                }}
              />
              {errors.phone && (
                <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                  {errors.phone}
                </span>
              )}
            </div>
          </div>

          {/* Role & Organization */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>
              🏢 Role & Organization
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  Your Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: errors.role ? '2px solid #ff6b6b' : '2px solid #e1e8ed',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                    {errors.role}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  Company/Organization
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name (optional)"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>
              💳 Wallet Connection
            </h3>
            
            <div style={{
              background: '#f8f9ff',
              padding: '20px',
              borderRadius: '12px',
              border: errors.walletAddress ? '2px solid #ff6b6b' : '2px solid #e1e8ed'
            }}>
              {formData.walletAddress ? (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <span style={{ fontWeight: '600', color: '#4CAF50' }}>Wallet Connected</span>
                  </div>
                  <div style={{
                    background: '#fff',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    color: '#666',
                    border: '1px solid #ddd'
                  }}>
                    {formData.walletAddress}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '15px', color: '#666' }}>
                    Connect your wallet to register on the blockchain
                  </div>
                  <button
                    type="button"
                    onClick={connectWallet}
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 25px',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isLoading ? '🔄 Connecting...' : '🔗 Connect Wallet'}
                  </button>
                </div>
              )}
              
              {errors.walletAddress && (
                <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '10px', display: 'block' }}>
                  {errors.walletAddress}
                </span>
              )}
            </div>
          </div>

          {/* Security */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>
              🔒 Security
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: errors.password ? '2px solid #ff6b6b' : '2px solid #e1e8ed',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: '#fff'
                  }}
                />
                {errors.password && (
                  <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                    {errors.password}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: errors.confirmPassword ? '2px solid #ff6b6b' : '2px solid #e1e8ed',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: '#fff'
                  }}
                />
                {errors.confirmPassword && (
                  <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading 
                ? '#ccc' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {isLoading ? '🔄 Creating Account...' : '🚀 Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          By registering, you agree to participate in our decentralized supply chain network
        </div>
      </div>
    </div>
  );
};

export default Register;