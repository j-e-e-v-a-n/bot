import data from './models/data.js'; // MongoDB session handler
import { connectDB, getDB } from './models/db.js'; // Import MongoDB connection

class MongoAuth {
  constructor() {
    this.name = 'MongoAuth';
    this.session = null;
    this.client = null;
  }

  /**
   * Setup strategy with the client
   * @param {object} client - WhatsApp client instance
   */
  setup(client) {
    this.client = client;
    // Add event listener for session update
    this.client.on('auth_credentials_updated', (credentials) => {
      this.save(credentials);
    });
    console.log('✅ MongoAuth strategy setup complete!');
  }

  /**
   * Before launching browser
   */
  async beforeBrowserInitialized() {
    console.log('🔧 beforeBrowserInitialized called');
  }

  /**
   * After launching browser
   */
  async afterBrowserInitialized() {
    console.log('🚀 afterBrowserInitialized called');
  }

  /**
   * Called when authentication is needed
   */
  async onAuthenticationNeeded() {
    console.log('🔐 Authentication needed...');
    
    const session = await this.load();
    
    if (session) {
      console.log('✅ Session provided to WhatsApp');
      return {
        session,
        restart: false,
        failed: false,
        failureEventPayload: null,
      };
    }
    
    console.log('⚠️ No session found, starting fresh authentication...');
    return {
      session: null,
      restart: false,
      failed: false,
      failureEventPayload: null,
    };
  }

  /**
   * Load session from MongoDB
   * @returns {object|null} session
   */
  async load() {
    try {
      await connectDB(); // Ensure the database is connected
      const session = await data.getAuth();
      
      if (session) {
        console.log('✅ Session loaded from MongoDB');
        this.session = session;
        return session;
      }
      
      console.log('⚠️ No session found in MongoDB');
      return null;
    } catch (error) {
      console.error('❌ Error loading session:', error);
      return null;
    }
  }

  /**
   * Save session to MongoDB
   * @param {object} session - Session object to save
   */
  async save(session) {
    try {
      if (!session) {
        console.warn('⚠️ No session provided to save');
        return false;
      }

      this.session = JSON.parse(JSON.stringify(session)); // Deep copy to avoid reference issues

      await connectDB(); // Ensure DB is connected before saving
      const result = await data.saveAuth(this.session);
      
      if (result) {
        console.log('✅ Session saved to MongoDB successfully');
        return true;
      } else {
        console.warn('⚠️ Session may not have been saved properly');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving session:', error.message);
      return false;
    }
  }

  /**
   * Destroy session in MongoDB
   */
  async destroy() {
    try {
      this.session = null;

      await connectDB(); // Ensure DB is connected before clearing
      const result = await data.clearAuth();
      
      if (result) {
        console.log('🗑️ Session cleared from MongoDB successfully');
        return true;
      } else {
        console.warn('⚠️ Session may not have been cleared properly');
        return false;
      }
    } catch (error) {
      console.error('❌ Error clearing session:', error.message);
      return false;
    }
  }
}

export default MongoAuth;
