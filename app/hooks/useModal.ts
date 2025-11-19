import { useState, useCallback } from "react";

interface UseModalResult {
  isOpen: boolean;
  data: any;
  openModal: (data?: any) => void;
  closeModal: () => void;
  toggleModal: () => void;
  setData: (data: any) => void;
}

export function useModal(initialState: boolean = false): UseModalResult {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<any>(null);

  const openModal = useCallback((modalData?: any) => {
    setIsOpen(true);
    if (modalData !== undefined) {
      setData(modalData);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    toggleModal,
    setData,
  };
}

