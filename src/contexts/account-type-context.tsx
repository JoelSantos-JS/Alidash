"use client"

import React, { createContext, useContext, useState } from "react";

export type AccountType = "personal" | "business";

type AccountTypeContextValue = {
  accountType: AccountType;
  setAccountType: (type: AccountType) => void;
  toggleAccountType: () => void;
  isPersonal: boolean;
  isBusiness: boolean;
};

const AccountTypeContext = createContext<AccountTypeContextValue | null>(null);

export function AccountTypeProvider({
  children,
  initialType = "business",
}: {
  children: React.ReactNode;
  initialType?: AccountType;
}) {
  const [accountType, setAccountTypeState] = useState<AccountType>(initialType);

  const setAccountType = (type: AccountType) => {
    setAccountTypeState(type);
  };

  const toggleAccountType = () => {
    setAccountTypeState((prev) => (prev === "personal" ? "business" : "personal"));
  };

  const value: AccountTypeContextValue = {
    accountType,
    setAccountType,
    toggleAccountType,
    isPersonal: accountType === "personal",
    isBusiness: accountType === "business",
  };

  return <AccountTypeContext.Provider value={value}>{children}</AccountTypeContext.Provider>;
}

export function useAccountTypeContext() {
  const ctx = useContext(AccountTypeContext);
  return ctx;
}