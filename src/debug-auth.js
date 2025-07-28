// Debug script to test authentication
console.log('Debug: Environment Variables');
console.log('API_URL:', process.env.REACT_APP_DOCUMENTS_API_URL);
console.log('Expected:', 'https://luminari-be.onrender.com');

async function testAuth() {
  const API_URL = process.env.REACT_APP_DOCUMENTS_API_URL || 'https://luminari-be.onrender.com';
  
  try {
    console.log('Testing authentication with:', API_URL);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'luminari!login'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Authentication successful!');
      return data;
    } else {
      console.log('❌ Authentication failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

// Run test if in browser console
if (typeof window !== 'undefined') {
  window.testAuth = testAuth;
  console.log('Run testAuth() in console to test authentication');
}