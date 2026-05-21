// context/UiContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface UiContextProps {
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const UiContext = createContext<UiContextProps | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const setModalVisible = (visible: boolean) => {
    setIsModalVisible(visible);
  };

  return (
    <UiContext.Provider value={{ isModalVisible, setModalVisible }}>
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (context === undefined) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
}