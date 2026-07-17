const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../config/supabase');

const usersFilePath = path.join(__dirname, '../data/users.json');

const getLocalUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
    return [];
  }
  const jsonData = fs.readFileSync(usersFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

const saveLocalUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isConfigured) {
      // Fallback
      const users = getLocalUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ message: 'User already exists with this email address' });
      }

      const newUser = {
        id: Date.now(),
        name,
        email: email.toLowerCase(),
        password,
        registeredAt: new Date().toISOString()
      };

      users.push(newUser);
      saveLocalUsers(users);

      return res.status(201).json({
        success: true,
        message: 'Signup successful!',
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
      });
    }

    // Connect to Supabase
    // 1. Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email address' });
    }

    // 2. Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password // Plain text for demo simplicity, matches previous implementation
      })
      .select('id, name, email')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'Signup successful!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error processing signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isConfigured) {
      // Fallback
      const user = getLocalUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password credentials' });
      }
      return res.json({
        success: true,
        message: 'Login successful!',
        user: { id: user.id, name: user.name, email: user.email }
      });
    }

    // Connect to Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password credentials' });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error processing login' });
  }
};
