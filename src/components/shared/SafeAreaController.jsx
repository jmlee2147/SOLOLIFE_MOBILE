import React, { createContext, useContext, useState } from "react";

const Ctx = createContext();

export function SafeAreaController({ children }) {
  const [opts, setOpts] = useState({
    backgroundColor: "#FFFFFF",
    disableTop: false,
    disableBottom: false,
  });
  return <Ctx.Provider value={{ opts, setOpts }}>{children}</Ctx.Provider>;
}

export function useSafeAreaController() {
  return useContext(Ctx);
}