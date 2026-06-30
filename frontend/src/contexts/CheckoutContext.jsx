import { createContext, useContext, useState } from 'react';

const CheckoutContext = createContext();

export function CheckoutProvider({ children }) {
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [billingAddressId, setBillingAddressId] = useState(null);

  return (
    <CheckoutContext.Provider value={{
      shippingAddressId,
      setShippingAddressId,
      billingAddressId,
      setBillingAddressId,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout doit être utilisé à l'intérieur d'un CheckoutProvider");
  }
  return context;
};