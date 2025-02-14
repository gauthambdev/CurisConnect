export const numberValidator = (number) => {
    if (!/^\d{10}$/.test(number)) {
      return "Contact number must be exactly 10 digits";
    }
    return "";
  };
  