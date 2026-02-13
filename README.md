<<<<<<< HEAD
# RMS System with Two-Factor Authentication (2FA)

## Overview

This is a comprehensive RMS (Resource Management System) with a secure authentication system featuring two-factor authentication (2FA) support.

## Features

- User registration and login
- Two-factor authentication (TOTP)
- Recovery codes for 2FA fallback
- Account lockout after failed login attempts
- Token-based authentication (JWT)
- User profile management
- Secure password hashing
- Account security features

## Tech Stack

- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token generation
- **speakeasy** - TOTP 2FA implementation
- **qrcode** - QR code generation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/rms_system
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

3. Ensure MongoDB is running locally or update the `MONGODB_URI` to point to your MongoDB instance.

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will run on `http://localhost:3000` with hot reload support.

### Production Mode

```bash
npm start
```

## API Endpoints

### Authentication

#### Register
- **POST** `/api/auth/register`
- Body: `{ "username": "string", "email": "string", "password": "string" }`
- Response: User data and JWT token

#### Login
- **POST** `/api/auth/login`
- Body: `{ "email": "string", "password": "string" }`
- Response: 
  - If 2FA disabled: JWT token and user data
  - If 2FA enabled: Temporary token for 2FA verification

#### Verify 2FA Code
- **POST** `/api/auth/verify-2fa`
- Body: `{ "tempToken": "string", "code": "string" }`
- Response: JWT token and user data

#### Verify Recovery Code
- **POST** `/api/auth/verify-recovery-code`
- Body: `{ "tempToken": "string", "recoveryCode": "string" }`
- Response: JWT token and user data

### 2FA Management

#### Enable 2FA
- **POST** `/api/auth/enable-2fa`
- Headers: `Authorization: Bearer <token>`
- Response: QR code and recovery codes

#### Confirm 2FA
- **POST** `/api/auth/confirm-2fa`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "code": "string" }`
- Response: Confirmation message

#### Disable 2FA
- **POST** `/api/auth/disable-2fa`
- Headers: `Authorization: Bearer <token>`
- Response: Confirmation message

### User Management

#### Get User Profile
- **GET** `/api/auth/profile`
- Headers: `Authorization: Bearer <token>` (must be 2FA verified)
- Response: User profile data

#### Logout
- **POST** `/api/auth/logout`
- Headers: `Authorization: Bearer <token>`
- Response: Logout confirmation

#### Logout All Devices
- **POST** `/api/auth/logout-all`
- Headers: `Authorization: Bearer <token>`
- Response: Logout confirmation

## Usage Guide

### Registration

1. Send a POST request to `/api/auth/register` with username, email, and password
2. Receive user data and JWT token in response

### Login with 2FA

1. Send a POST request to `/api/auth/login` with email and password
2. If 2FA is disabled, receive JWT token directly
3. If 2FA is enabled, receive a temporary token
4. Send a POST request to `/api/auth/verify-2fa` with temporary token and 2FA code
5. Receive JWT token upon successful verification

### Setting Up 2FA

1. Login to your account (without 2FA initially)
2. Send a POST request to `/api/auth/enable-2fa` with your token
3. Scan the QR code with an authenticator app (Google Authenticator, Authy)
4. Send a POST request to `/api/auth/confirm-2fa` with the verification code
5. 2FA is now enabled for your account

### Using Recovery Codes

1. If you lose access to your authenticator app, use a recovery code
2. During login, after receiving the temporary token, send a POST request to `/api/auth/verify-recovery-code`
3. Use one of your recovery codes
4. Receive a new JWT token

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Account Lockout**: Locked after 5 failed login attempts for 30 minutes
- **Token Expiration**: JWT tokens expire after 7 days
- **Secure Token Storage**: Tokens stored in database with user records
- **Recovery Codes**: 10 unique recovery codes generated during 2FA setup
- **CORS Protection**: Enabled for security
- **Environment Variables**: All sensitive data stored in .env file

## Database Schema

### User Model

```javascript
{
  username: String (unique),
  email: String (unique),
  password: String,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  twoFactorRecoveryCodes: [String],
  isVerified: Boolean,
  verificationToken: String,
  lastLoginAt: Date,
  loginAttempts: Number,
  lockUntil: Date,
  tokens: [{ token: String }],
  createdAt: Date,
  updatedAt: Date
}
```

## Project Structure

```
RMS_SYSTEM/
├── middleware/          # Authentication middleware
├── models/              # Database models
├── routes/              # API routes
├── package.json         # Project dependencies
├── server.js            # Express server
└── .env                # Environment variables
```

## Best Practices

1. Keep your JWT secret key secure
2. Never share recovery codes
3. Use HTTPS in production
4. Implement rate limiting
5. Keep dependencies up to date
6. Regular security audits

## License

ISC
=======
<!-- Vercel build test comment -->

# Firebase Studio

## Firebase Console

The Firebase Console is the primary interface for managing your Firebase project, including setting up and configuring Firebase App Hosting. You'll use the console to connect your project to your GitHub repository, configure deployment settings, and monitor your deployments.


This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
>>>>>>> e377d1830b96c36d7c30ff7d37656f0ef8408fb9
