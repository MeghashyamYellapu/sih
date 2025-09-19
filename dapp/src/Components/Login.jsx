import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ onChange }) {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const [account, setAccount] = useState(null);
	const [role, setRole] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState('');
	const [rememberMe, setRememberMe] = useState(false);

	const roles = [
		{ value: '', label: 'Select Your Role' },
		{ value: 'producer', label: '🌾 Producer/Farmer' },
		{ value: 'quality_inspector', label: '🔍 Quality Inspector' },
		{ value: 'distributor', label: '🚚 Distributor' },
		{ value: 'retailer', label: '🏪 Retailer' },
		{ value: 'consumer', label: '👤 Consumer' },
		{ value: 'government_authority', label: '🏛️ Government Authority' }
	];

	useEffect(() => {
		// expose combined value via optional callback
		if (typeof onChange === 'function') {
			onChange({ userName, account, role });
		}
	}, [userName, account, role]);

	const connectWallet = async () => {
		if (typeof window === 'undefined' || !window.ethereum) {
			setStatus('MetaMask (or another injected wallet) is required to connect.');
			return;
		}

		setIsLoading(true);
		try {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			if (accounts && accounts.length > 0) {
				setAccount(accounts[0]);
				setStatus('Wallet connected successfully! ✅');
				setTimeout(() => setStatus(''), 3000);
			}
		} catch (err) {
			console.error('Wallet connect failed', err);
			setStatus('Wallet connection failed: ' + (err.message || err));
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		
		if (!userName.trim()) {
			setStatus('Please enter your username');
			return;
		}
		
		if (!password) {
			setStatus('Please enter your password');
			return;
		}
		
		if (!role) {
			setStatus('Please select your role');
			return;
		}
		
		if (!account) {
			setStatus('Please connect your wallet first');
			return;
		}

		setIsLoading(true);
		setStatus('Logging in...');

		try {
			// Simulate login process
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			const userInfo = {
				userName,
				account,
				role,
				password
			};

			// Call the onChange callback to pass data back to parent
			if (onChange) {
				onChange(userInfo);
			}

			setStatus('Login successful! Welcome back! 🎉');
			
			// Redirect based on role
			setTimeout(() => {
				if (role === 'producer') {
					// Navigate to farmer dashboard with user info
					navigate('/farmer-dashboard', { state: { userInfo } });
				} else {
					// For other roles, navigate to main dashboard
					navigate('/');
				}
			}, 1000);

		} catch (error) {
			console.error('Login error:', error);
			setStatus('Login failed: ' + (error.message || error));
		} finally {
			setIsLoading(false);
		}
	};

	const shortAddr = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : 'Not connected');

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
				maxWidth: '500px',
				boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
				backdropFilter: 'blur(10px)',
				position: 'relative'
			}}>
				{/* Decorative Elements */}
				<div style={{
					position: 'absolute',
					top: '-10px',
					right: '-10px',
					width: '80px',
					height: '80px',
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					borderRadius: '50%',
					opacity: '0.1'
				}}></div>
				<div style={{
					position: 'absolute',
					bottom: '-20px',
					left: '-20px',
					width: '120px',
					height: '120px',
					background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
					borderRadius: '50%',
					opacity: '0.08'
				}}></div>

				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '35px' }}>
					<h1 style={{
						color: '#333',
						fontSize: '2.8rem',
						fontWeight: '700',
						marginBottom: '10px',
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent'
					}}>
						Welcome Back
					</h1>
					<p style={{
						color: '#666',
						fontSize: '1.1rem',
						margin: '0 0 15px 0'
					}}>
						Sign in to your SupplyChain account
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
							to="/register" 
							style={{
								color: '#667eea',
								textDecoration: 'none',
								fontSize: '0.9rem'
							}}
						>
							Don't have an account? Register
						</Link>
					</div>
				</div>

				{/* Status Alert */}
				{status && (
					<div style={{
						padding: '15px',
						borderRadius: '12px',
						marginBottom: '25px',
						backgroundColor: status.includes('Error') || status.includes('Failed') || status.includes('Please') 
							? '#fee2e2' 
							: '#f0fdf4',
						border: `1px solid ${status.includes('Error') || status.includes('Failed') || status.includes('Please') 
							? '#fca5a5' 
							: '#bbf7d0'}`,
						color: status.includes('Error') || status.includes('Failed') || status.includes('Please') 
							? '#dc2626' 
							: '#166534',
						textAlign: 'center',
						fontWeight: '500'
					}}>
						{status}
					</div>
				)}

				{/* Login Form */}
				<form onSubmit={handleLogin}>
					{/* Username Input */}
					<div style={{ marginBottom: '20px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#374151',
							fontSize: '0.95rem'
						}}>
							👤 Username
						</label>
						<input
							type="text"
							placeholder="Enter your username"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							style={{
								width: '100%',
								padding: '15px 20px',
								border: '2px solid #e5e7eb',
								borderRadius: '12px',
								fontSize: '1rem',
								transition: 'all 0.3s ease',
								backgroundColor: '#fff',
								outline: 'none'
							}}
							onFocus={(e) => e.target.style.borderColor = '#667eea'}
							onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
						/>
					</div>

					{/* Password Input */}
					<div style={{ marginBottom: '20px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#374151',
							fontSize: '0.95rem'
						}}>
							🔒 Password
						</label>
						<input
							type="password"
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							style={{
								width: '100%',
								padding: '15px 20px',
								border: '2px solid #e5e7eb',
								borderRadius: '12px',
								fontSize: '1rem',
								transition: 'all 0.3s ease',
								backgroundColor: '#fff',
								outline: 'none'
							}}
							onFocus={(e) => e.target.style.borderColor = '#667eea'}
							onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
						/>
					</div>

					{/* Role Selection */}
					<div style={{ marginBottom: '25px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#374151',
							fontSize: '0.95rem'
						}}>
							🎭 Your Role
						</label>
						<select
							value={role}
							onChange={(e) => setRole(e.target.value)}
							style={{
								width: '100%',
								padding: '15px 20px',
								border: '2px solid #e5e7eb',
								borderRadius: '12px',
								fontSize: '1rem',
								backgroundColor: '#fff',
								cursor: 'pointer',
								outline: 'none'
							}}
							onFocus={(e) => e.target.style.borderColor = '#667eea'}
							onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
						>
							{roles.map(roleOption => (
								<option key={roleOption.value} value={roleOption.value}>
									{roleOption.label}
								</option>
							))}
						</select>
					</div>

					{/* Wallet Connection */}
					<div style={{ marginBottom: '25px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#374151',
							fontSize: '0.95rem'
						}}>
							💳 Wallet Connection
						</label>
						<div style={{
							background: '#f9fafb',
							padding: '20px',
							borderRadius: '12px',
							border: '2px solid #e5e7eb'
						}}>
							{account ? (
								<div style={{ textAlign: 'center' }}>
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '10px',
										marginBottom: '12px'
									}}>
										<span style={{ fontSize: '1.5rem' }}>✅</span>
										<span style={{ fontWeight: '600', color: '#059669' }}>Wallet Connected</span>
									</div>
									<div style={{
										background: '#fff',
										padding: '12px 16px',
										borderRadius: '8px',
										fontFamily: 'Monaco, Consolas, monospace',
										fontSize: '0.9rem',
										color: '#6b7280',
										border: '1px solid #d1d5db'
									}}>
										{shortAddr(account)}
									</div>
								</div>
							) : (
								<div style={{ textAlign: 'center' }}>
									<div style={{ marginBottom: '15px', color: '#6b7280' }}>
										Connect your wallet to proceed
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
						</div>
					</div>

					{/* Remember Me & Forgot Password */}
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '25px'
					}}>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							cursor: 'pointer',
							fontSize: '0.9rem',
							color: '#6b7280'
						}}>
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								style={{
									width: '16px',
									height: '16px',
									accentColor: '#667eea'
								}}
							/>
							Remember wallet connection
						</label>
						<a href="#" style={{
							color: '#667eea',
							textDecoration: 'none',
							fontSize: '0.9rem'
						}}>
							Forgot Password?
						</a>
					</div>

					{/* Login Button */}
					<button
						type="submit"
						disabled={isLoading}
						style={{
							width: '100%',
							background: isLoading 
								? '#d1d5db' 
								: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							border: 'none',
							padding: '16px',
							borderRadius: '12px',
							fontSize: '1.1rem',
							fontWeight: '700',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							transition: 'all 0.3s ease',
							textTransform: 'uppercase',
							letterSpacing: '1px',
							transform: isLoading ? 'none' : 'translateY(0)',
							boxShadow: isLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
						}}
						onMouseEnter={(e) => {
							if (!isLoading) {
								e.target.style.transform = 'translateY(-2px)';
								e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
							}
						}}
						onMouseLeave={(e) => {
							if (!isLoading) {
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
							}
						}}
					>
						{isLoading ? '🔄 Signing In...' : '🚀 Sign In'}
					</button>
				</form>

				{/* Additional Info */}
				<div style={{
					textAlign: 'center',
					marginTop: '25px',
					paddingTop: '20px',
					borderTop: '1px solid #e5e7eb',
					color: '#6b7280',
					fontSize: '0.9rem'
				}}>
					<p>Secure access to your supply chain dashboard</p>
				</div>
			</div>

			{/* Background Animation */}
			<div style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: -1
			}}>
				{/* Floating particles */}
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							width: `${Math.random() * 100 + 50}px`,
							height: `${Math.random() * 100 + 50}px`,
							background: 'rgba(255, 255, 255, 0.1)',
							borderRadius: '50%',
							top: `${Math.random() * 100}%`,
							left: `${Math.random() * 100}%`,
							animation: `float${i} ${Math.random() * 10 + 10}s ease-in-out infinite alternate`
						}}
					></div>
				))}
			</div>

			{/* CSS Animations */}
			<style jsx>{`
				@keyframes float0 {
					0% { transform: translateY(0px) rotate(0deg); }
					100% { transform: translateY(-20px) rotate(180deg); }
				}
				@keyframes float1 {
					0% { transform: translateY(0px) rotate(0deg); }
					100% { transform: translateY(-30px) rotate(-180deg); }
				}
				@keyframes float2 {
					0% { transform: translateY(0px) rotate(0deg); }
					100% { transform: translateY(-25px) rotate(360deg); }
				}
				@keyframes float3 {
					0% { transform: translateY(0px) rotate(0deg); }
					100% { transform: translateY(-15px) rotate(-360deg); }
				}
				@keyframes float4 {
					0% { transform: translateY(0px) rotate(0deg); }
					100% { transform: translateY(-35px) rotate(180deg); }
				}
				@keyframes float5 {
					0% { transform: translateY(0px) rotate(0deg); }
					100% { transform: translateY(-40px) rotate(-90deg); }
				}
			`}</style>
		</div>
	);
}