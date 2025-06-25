const authController = require('../controllers/authController');
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock external modules
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Mock process.env.JWT_SECRET for JWT signing
process.env.JWT_SECRET = 'testsecret';

describe('authController', () => {
  // Clear mocks before each test to ensure isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case for successful user registration
  describe('registerUser', () => {
    it('should register a new user and return a token', async () => {
      // Mock req, res objects
      const req = {
        body: {
          email: 'newuser@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(), // Allow chaining .status().json()
        json: jest.fn()
      };

      // Mock User.findOne to return null (user does not exist)
      User.findOne.mockResolvedValue(null);

      // Mock bcrypt functions
      bcrypt.genSalt.mockResolvedValue('mockSalt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock User model instance methods
      const mockUserInstance = {
        id: 'mockUserId123',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        save: jest.fn().mockResolvedValue(true)
      };
      // When `new User` is called, return our mock instance
      User.mockImplementation(() => mockUserInstance);


      // Mock jwt.sign to return a token
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, 'mockToken');
      });

      await authController.registerUser(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'newuser@example.com' }); // Check if user existence was checked
      expect(User).toHaveBeenCalledWith({ // Check if a new User instance was created
        email: 'newuser@example.com',
        password: 'password123'
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10); // Check if salt was generated
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'mockSalt'); // Check if password was hashed
      expect(mockUserInstance.save).toHaveBeenCalled(); // Check if user was saved
      expect(jwt.sign).toHaveBeenCalledTimes(1); // Check if JWT was signed
      expect(res.json).toHaveBeenCalledWith({ token: 'mockToken' }); // Check if token was returned
      expect(res.status).not.toHaveBeenCalled(); // Should not have called status (implies 200 OK)
    });

    it('should return 400 if user already exists', async () => {
      const req = {
        body: {
          email: 'existing@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({
        email: 'existing@example.com'
      });

      await authController.registerUser(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(res.status).toHaveBeenCalledWith(400); // Expect 400 status
      expect(res.json).toHaveBeenCalledWith({ msg: 'User already exists' }); // Expect error message
      expect(User).not.toHaveBeenCalledWith(); // Ensure new User instance was NOT created
      expect(bcrypt.genSalt).not.toHaveBeenCalled(); // Ensure hashing was skipped
      expect(jwt.sign).not.toHaveBeenCalled(); // Ensure JWT signing was skipped
    });

    it('should return 500 on server error', async () => {
      const req = {
        body: {
          email: 'error@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn() // Use send for generic 500 error
      };

      // Mock User.findOne to throw an error
      const errorMessage = 'Database error';
      User.findOne.mockRejectedValue(new Error(errorMessage));

      // Suppress console.error during this specific test to keep output clean
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await authController.registerUser(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'error@example.com' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage);

      // Restore original console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
