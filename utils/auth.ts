import { User } from '../types';

const USERS_KEY = 'habit_stack_users_db';

export const getStoredUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const registerUser = (name: string, email: string, password: string): User | string => {
  const users = getStoredUsers();
  
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return "Account with this email already exists.";
  }

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    email: email.toLowerCase(),
    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
    createdAt: new Date().toISOString()
  };

  // We store the password in a separate key for basic local "security"
  localStorage.setItem(`pwd_${newUser.id}`, password);
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return newUser;
};

export const authenticateUser = (email: string, password: string): User | string => {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return "No account found with this email.";
  }

  const storedPwd = localStorage.getItem(`pwd_${user.id}`);
  if (storedPwd !== password) {
    return "Incorrect password.";
  }

  return user;
};
