import React, { createContext, useCallback, useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "../components/shared/Toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = Date.now();
    const { duration = 3000 } = toast;
    setToasts((prev) => [...prev, { id, ...toast }]);

    if (duration !== Infinity && duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);
  

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.wrapper}>
        {toasts.map((t) => (
          <Toast key={t.id} {...t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
