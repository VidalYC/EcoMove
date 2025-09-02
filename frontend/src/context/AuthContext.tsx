import React, { createContext, useContext, useState, ReactNode } from "react";

type AuthCtx = { user?: any; login(u:any):void; logout():void };

const Ctx = createContext<AuthCtx>({ login:()=>{}, logout:()=>{} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>();
  return (
    <Ctx.Provider value={{ user, login:setUser, logout:()=>setUser(undefined) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
