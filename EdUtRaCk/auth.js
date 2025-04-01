class AuthManager {
    constructor() {
      this.currentUser = null;
      this.initGoogleAuth();
    }
  
    async initGoogleAuth() {
      await new Promise((resolve) => {
        gapi.load('auth2', () => {
          gapi.auth2.init({
            client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
            scope: 'profile email'
          }).then(resolve);
        });
      });
    }
  
    async onSignIn(googleUser) {
      try {
        // Validate the ID token on your backend in production
        const profile = googleUser.getBasicProfile();
        const authResponse = googleUser.getAuthResponse();
        
        this.currentUser = {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl(),
          idToken: authResponse.id_token,
          accessToken: authResponse.access_token
        };
  
        // Secure token handling (for backend API calls)
        this.storeToken(authResponse.id_token);
        
        this.updateUIAfterLogin(profile);
        this.logAuthActivity('login', profile);
        
        // Initialize user session
        await this.initializeUserSession();
        
      } catch (error) {
        console.error('Sign-in error:', error);
        this.showNotification('Sign-in failed. Please try again.', 'error');
        this.signOut(); // Force sign-out if error occurs
      }
    }
  
    async signOut() {
      try {
        const auth2 = gapi.auth2.getAuthInstance();
        await auth2.signOut();
        
        this.clearUserSession();
        this.updateUIAfterLogout();
        this.logAuthActivity('logout');
        
      } catch (error) {
        console.error('Sign-out error:', error);
        this.showNotification('Sign-out failed. Please try again.', 'error');
      }
    }
  
    storeToken(idToken) {
      // In a real app, you might:
      // 1. Send to your backend for verification
      // 2. Store in HttpOnly cookies (secure)
      // 3. Use for subsequent API calls
      sessionStorage.setItem('google_id_token', idToken);
    }
  
    clearUserSession() {
      this.currentUser = null;
      sessionStorage.removeItem('google_id_token');
      // Clear any other session data
    }
  
    updateUIAfterLogin(profile) {
      document.getElementById('authContainer').style.display = 'none';
      document.querySelector('.container').style.display = 'block';
      
      // Update user profile in UI
      const userProfileElement = document.getElementById('userProfile');
      if (userProfileElement) {
        userProfileElement.innerHTML = `
          <img src="${profile.getImageUrl()}" alt="Profile" class="user-avatar">
          <span class="user-name">${profile.getName()}</span>
        `;
      }
      
      this.showNotification(`Welcome, ${profile.getName()}!`, 'success');
    }
  
    updateUIAfterLogout() {
      document.getElementById('authContainer').style.display = 'block';
      document.querySelector('.container').style.display = 'none';
      
      // Clear profile from UI
      const userProfileElement = document.getElementById('userProfile');
      if (userProfileElement) {
        userProfileElement.innerHTML = '';
      }
      
      this.showNotification('You have been signed out.', 'info');
    }
  
    logAuthActivity(action, profile = null) {
      const details = action === 'login' 
        ? `Logged in as ${profile.getEmail()}`
        : 'Session ended';
      
      logActivity(`User ${action}`, details);
    }
  
    async initializeUserSession() {
      // Here you would typically:
      // 1. Verify the ID token with your backend
      // 2. Fetch user-specific data
      // 3. Initialize application state for the user
      console.log('Initializing user session...');
      
      // Example: Load user data
      try {
        // const userData = await fetchUserData(this.currentUser.idToken);
        // this.loadUserData(userData);
      } catch (error) {
        console.error('Session initialization failed:', error);
        this.showNotification('Failed to load user data', 'error');
      }
    }
  
    showNotification(message, type = 'success') {
      // Your existing notification implementation
      console.log(`[${type}] ${message}`);
    }
  }
  
  // Initialize auth manager
  const authManager = new AuthManager();
  
  // Global functions for Google Sign-In button
  function onSignIn(googleUser) {
    authManager.onSignIn(googleUser);
  }
  
  function signOut() {
    authManager.signOut();
  }