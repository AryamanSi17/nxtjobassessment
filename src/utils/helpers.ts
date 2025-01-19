
export const validateFields = (fields: Record<string, any>, required: string[]) => {
    const missingFields = required.filter((field) => !(field in fields));
    return {
      valid: missingFields.length === 0,
      missing: missingFields,
    };
  };
  