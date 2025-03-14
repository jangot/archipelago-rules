declare global {
  namespace Express {
    export interface User {
      id: string;
      email?: string;
      phoneNumber?: string;
      firstName?: string;
      lastName?: string;
      isAdmin: boolean;
      // Add any additional fields you require.
    }

    export interface Request {
      user?: User | undefined;
    }
  }
}

export {}; // This makes the file a module.
