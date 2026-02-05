import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const DemoContext = createContext();

// Demo data for different account types
const DEMO_DATA = {
  individual: {
    user: {
      id: 'demo_individual',
      name: 'Demo User',
      email: 'demo_user@kamioi.com',
      accountType: 'individual',
      createdAt: '2024-01-15'
    },
    portfolio: {
      totalValue: 12547.82,
      totalGain: 1847.32,
      gainPercent: 17.24,
      holdings: [
        { ticker: 'AAPL', name: 'Apple Inc.', shares: 5.234, value: 934.12, gain: 124.50, gainPercent: 15.4 },
        { ticker: 'GOOGL', name: 'Alphabet Inc.', shares: 2.156, value: 334.89, gain: 45.23, gainPercent: 15.6 },
        { ticker: 'AMZN', name: 'Amazon.com', shares: 1.892, value: 370.45, gain: 52.18, gainPercent: 16.4 },
        { ticker: 'MSFT', name: 'Microsoft', shares: 3.445, value: 1421.34, gain: 187.65, gainPercent: 15.2 },
        { ticker: 'NVDA', name: 'NVIDIA', shares: 0.987, value: 863.45, gain: 234.12, gainPercent: 37.2 }
      ]
    },
    transactions: [
      { id: 1, merchant: 'Starbucks', amount: 5.75, roundup: 0.25, ticker: 'SBUX', date: '2024-01-20', status: 'completed' },
      { id: 2, merchant: 'Amazon', amount: 47.32, roundup: 0.68, ticker: 'AMZN', date: '2024-01-19', status: 'completed' },
      { id: 3, merchant: 'Apple Store', amount: 129.00, roundup: 1.00, ticker: 'AAPL', date: '2024-01-18', status: 'completed' },
      { id: 4, merchant: 'Netflix', amount: 15.99, roundup: 0.01, ticker: 'NFLX', date: '2024-01-17', status: 'completed' },
      { id: 5, merchant: 'Uber', amount: 23.45, roundup: 0.55, ticker: 'UBER', date: '2024-01-16', status: 'completed' },
      { id: 6, merchant: 'Target', amount: 67.89, roundup: 0.11, ticker: 'TGT', date: '2024-01-15', status: 'completed' },
      { id: 7, merchant: 'Chipotle', amount: 12.34, roundup: 0.66, ticker: 'CMG', date: '2024-01-14', status: 'completed' },
      { id: 8, merchant: 'Nike', amount: 89.99, roundup: 0.01, ticker: 'NKE', date: '2024-01-13', status: 'completed' }
    ],
    goals: [
      { id: 1, name: 'Emergency Fund', target: 10000, current: 6500, progress: 65 },
      { id: 2, name: 'Vacation Fund', target: 5000, current: 2100, progress: 42 },
      { id: 3, name: 'New Car', target: 15000, current: 3200, progress: 21 }
    ],
    stats: {
      totalRoundups: 847.32,
      transactionsThisMonth: 47,
      averageRoundup: 0.43,
      topMerchant: 'Amazon'
    }
  },
  family: {
    user: {
      id: 'demo_family',
      name: 'Demo Family Admin',
      email: 'demo_family@kamioi.com',
      accountType: 'family',
      familyName: 'The Demo Family',
      createdAt: '2024-01-10'
    },
    members: [
      { id: 1, name: 'Demo Family Admin', email: 'demo_family@kamioi.com', role: 'admin', status: 'active', totalRoundups: 423.45 },
      { id: 2, name: 'Jane Demo', email: 'jane.demo@email.com', role: 'member', status: 'active', totalRoundups: 312.67 },
      { id: 3, name: 'Tommy Demo', email: 'tommy.demo@email.com', role: 'member', status: 'active', totalRoundups: 156.23 },
      { id: 4, name: 'Sara Demo', email: 'sara.demo@email.com', role: 'member', status: 'pending', totalRoundups: 0 }
    ],
    portfolio: {
      totalValue: 28934.56,
      totalGain: 4523.12,
      gainPercent: 18.52,
      holdings: [
        { ticker: 'AAPL', name: 'Apple Inc.', shares: 12.345, value: 2205.67, gain: 345.23, gainPercent: 18.6 },
        { ticker: 'GOOGL', name: 'Alphabet Inc.', shares: 5.678, value: 881.45, gain: 123.45, gainPercent: 16.3 },
        { ticker: 'VTI', name: 'Vanguard Total Stock', shares: 45.234, value: 10234.56, gain: 1567.89, gainPercent: 18.1 },
        { ticker: 'QQQ', name: 'Invesco QQQ', shares: 15.678, value: 6789.12, gain: 987.65, gainPercent: 17.0 }
      ]
    },
    goals: [
      { id: 1, name: 'Family Vacation', target: 8000, current: 4500, progress: 56 },
      { id: 2, name: 'College Fund', target: 50000, current: 12000, progress: 24 },
      { id: 3, name: 'Emergency Fund', target: 20000, current: 15000, progress: 75 }
    ],
    stats: {
      totalFamilyRoundups: 1892.35,
      membersActive: 3,
      membersPending: 1,
      topContributor: 'Demo Family Admin'
    }
  },
  business: {
    user: {
      id: 'demo_business',
      name: 'Demo Business',
      email: 'demo_business@kamioi.com',
      accountType: 'business',
      businessName: 'Demo Corp Inc.',
      businessType: 'llc',
      createdAt: '2024-01-05'
    },
    team: [
      { id: 1, name: 'Demo Business', email: 'demo_business@kamioi.com', role: 'admin', title: 'CEO', status: 'active' },
      { id: 2, name: 'John Manager', email: 'john@democorp.com', role: 'manager', title: 'CFO', status: 'active' },
      { id: 3, name: 'Alice Accountant', email: 'alice@democorp.com', role: 'accountant', title: 'Controller', status: 'active' },
      { id: 4, name: 'Bob Developer', email: 'bob@democorp.com', role: 'member', title: 'Engineer', status: 'active' },
      { id: 5, name: 'Carol Designer', email: 'carol@democorp.com', role: 'member', title: 'Designer', status: 'pending' }
    ],
    portfolio: {
      totalValue: 156789.34,
      totalGain: 23456.78,
      gainPercent: 17.58,
      holdings: [
        { ticker: 'SPY', name: 'S&P 500 ETF', shares: 234.567, value: 112345.67, gain: 15678.90, gainPercent: 16.2 },
        { ticker: 'VTI', name: 'Vanguard Total Stock', shares: 89.123, value: 20123.45, gain: 3456.78, gainPercent: 20.7 },
        { ticker: 'BND', name: 'Vanguard Bond ETF', shares: 123.456, value: 9876.54, gain: 543.21, gainPercent: 5.8 },
        { ticker: 'AAPL', name: 'Apple Inc.', shares: 45.678, value: 8156.78, gain: 1234.56, gainPercent: 17.8 }
      ]
    },
    transactions: [
      { id: 1, merchant: 'AWS', amount: 2345.67, category: 'Cloud Services', date: '2024-01-20', employee: 'John Manager' },
      { id: 2, merchant: 'Adobe', amount: 599.88, category: 'Software', date: '2024-01-19', employee: 'Carol Designer' },
      { id: 3, merchant: 'Office Depot', amount: 234.56, category: 'Office Supplies', date: '2024-01-18', employee: 'Alice Accountant' },
      { id: 4, merchant: 'Delta Airlines', amount: 567.89, category: 'Travel', date: '2024-01-17', employee: 'Demo Business' },
      { id: 5, merchant: 'WeWork', amount: 1500.00, category: 'Office Space', date: '2024-01-15', employee: 'Demo Business' }
    ],
    goals: [
      { id: 1, name: 'Q1 Investment Target', target: 50000, current: 35000, progress: 70 },
      { id: 2, name: 'Annual Growth Fund', target: 200000, current: 78000, progress: 39 },
      { id: 3, name: 'Emergency Reserve', target: 100000, current: 85000, progress: 85 }
    ],
    stats: {
      totalBusinessRoundups: 12345.67,
      teamMembers: 5,
      expensesThisMonth: 8234.56,
      topCategory: 'Cloud Services'
    }
  }
};

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('kamioi_demo_mode') === 'true';
  });

  const [demoAccountType, setDemoAccountType] = useState(() => {
    return localStorage.getItem('kamioi_demo_account_type') || 'individual';
  });

  // Track previous values to only dispatch event when they actually change
  const prevDemoModeRef = useRef(isDemoMode);
  const prevAccountTypeRef = useRef(demoAccountType);
  const isInitialMount = useRef(true);

  useEffect(() => {
    localStorage.setItem('kamioi_demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  useEffect(() => {
    localStorage.setItem('kamioi_demo_account_type', demoAccountType);

    // Skip dispatching on initial mount - DataContext handles initial load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevDemoModeRef.current = isDemoMode;
      prevAccountTypeRef.current = demoAccountType;
      return;
    }

    // Only dispatch if values actually changed (not just effect re-running)
    const demoModeChanged = prevDemoModeRef.current !== isDemoMode;
    const accountTypeChanged = prevAccountTypeRef.current !== demoAccountType;

    if (isDemoMode && (demoModeChanged || accountTypeChanged)) {
      console.log('DemoContext - Dispatching demoModeChanged (actual change detected)');
      window.dispatchEvent(new CustomEvent('demoModeChanged'));
    }

    prevDemoModeRef.current = isDemoMode;
    prevAccountTypeRef.current = demoAccountType;
  }, [demoAccountType, isDemoMode]);

  const enableDemoMode = (accountType = 'individual') => {
    // CRITICAL: Clear any real auth tokens first to prevent DataContext
    // from thinking there's a real user logged in and disabling demo mode
    localStorage.removeItem('kamioi_user_token');
    localStorage.removeItem('kamioi_business_token');
    localStorage.removeItem('kamioi_family_token');
    localStorage.removeItem('kamioi_admin_token');
    localStorage.removeItem('kamioi_user');
    localStorage.removeItem('kamioi_business_user');
    localStorage.removeItem('kamioi_family_user');

    setDemoAccountType(accountType);
    setIsDemoMode(true);
    // Dispatch event so DataContext can reload with demo data
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('demoModeChanged'));
    }, 0);
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    // CRITICAL: Also persist to localStorage to prevent demo data leaking into real user dashboards
    localStorage.setItem('kamioi_demo_mode', 'false');
    localStorage.removeItem('kamioi_demo_account_type');
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
  };

  const getDemoData = (dataType) => {
    const accountData = DEMO_DATA[demoAccountType];
    if (!accountData) return null;
    return dataType ? accountData[dataType] : accountData;
  };

  const getDemoUser = () => {
    return DEMO_DATA[demoAccountType]?.user || null;
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoAccountType,
      setDemoAccountType,
      enableDemoMode,
      disableDemoMode,
      toggleDemoMode,
      getDemoData,
      getDemoUser,
      DEMO_DATA
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export default DemoContext;
