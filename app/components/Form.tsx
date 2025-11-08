import React, { useState, FormEvent, ReactNode } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';

// Form Context
interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
}

const FormContext = React.createContext<FormContextType | null>(null);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within a Form');
  }
  return context;
};

// Validation helpers
export const validators = {
  required: (message = 'This field is required') => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return undefined;
  },
  email: (message = 'Invalid email address') => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return message;
    }
    return undefined;
  },
  minLength: (length: number, message?: string) => (value: string) => {
    if (value && value.length < length) {
      return message || `Must be at least ${length} characters`;
    }
    return undefined;
  },
  maxLength: (length: number, message?: string) => (value: string) => {
    if (value && value.length > length) {
      return message || `Must be no more than ${length} characters`;
    }
    return undefined;
  },
  pattern: (regex: RegExp, message = 'Invalid format') => (value: string) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return undefined;
  },
  min: (min: number, message?: string) => (value: number) => {
    if (value !== undefined && value < min) {
      return message || `Must be at least ${min}`;
    }
    return undefined;
  },
  max: (max: number, message?: string) => (value: number) => {
    if (value !== undefined && value > max) {
      return message || `Must be no more than ${max}`;
    }
    return undefined;
  },
  matches: (field: string, message = 'Fields must match') => (value: any, values: Record<string, any>) => {
    if (value !== values[field]) {
      return message;
    }
    return undefined;
  },
  custom: (fn: (value: any, values: Record<string, any>) => string | undefined) => fn,
};

// Compose validators
export const composeValidators = (...validators: Array<(value: any, values?: Record<string, any>) => string | undefined>) => {
  return (value: any, values?: Record<string, any>) => {
    for (const validator of validators) {
      const error = validator(value, values);
      if (error) return error;
    }
    return undefined;
  };
};

interface FormProps {
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  validate?: (values: Record<string, any>) => Record<string, string>;
  children: ReactNode;
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  initialValues = {},
  onSubmit,
  validate,
  children,
  className = '',
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const setFieldError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const setFieldTouched = (name: string, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);

    // If no errors, submit
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <FormContext.Provider
      value={{
        values,
        errors,
        touched,
        setFieldValue,
        setFieldError,
        setFieldTouched,
      }}
    >
      <View className={className}>
        {children}
      </View>
    </FormContext.Provider>
  );
};

interface FieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  validate?: (value: any, values: Record<string, any>) => string | undefined;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

export const Field: React.FC<FieldProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  validate,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
}) => {
  const { values, errors, touched, setFieldValue, setFieldError, setFieldTouched } = useFormContext();

  const value = values[name] || '';
  const error = errors[name];
  const isTouched = touched[name];
  const showError = isTouched && error;

  const handleChange = (text: string) => {
    setFieldValue(name, text);
    
    // Validate on change if field has been touched
    if (isTouched && validate) {
      const validationError = validate(text, values);
      if (validationError) {
        setFieldError(name, validationError);
      } else {
        setFieldError(name, '');
      }
    }
  };

  const handleBlur = () => {
    setFieldTouched(name, true);
    
    // Validate on blur
    if (validate) {
      const validationError = validate(value, values);
      if (validationError) {
        setFieldError(name, validationError);
      } else {
        setFieldError(name, '');
      }
    }
  };

  const keyboardType = type === 'email' 
    ? 'email-address' 
    : type === 'number' 
    ? 'numeric' 
    : type === 'tel' 
    ? 'phone-pad' 
    : type === 'url'
    ? 'url'
    : 'default';

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        editable={!disabled}
        keyboardType={keyboardType}
        secureTextEntry={type === 'password'}
        className={`border rounded-lg px-4 py-3 text-base ${
          showError 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
        } ${disabled ? 'opacity-50' : ''} text-gray-900 dark:text-white ${inputClassName}`}
        placeholderTextColor="#9CA3AF"
      />
      {showError && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
};

interface TextAreaFieldProps extends Omit<FieldProps, 'type'> {
  rows?: number;
  maxLength?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  name,
  label,
  placeholder,
  validate,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  inputClassName = '',
}) => {
  const { values, errors, touched, setFieldValue, setFieldError, setFieldTouched } = useFormContext();

  const value = values[name] || '';
  const error = errors[name];
  const isTouched = touched[name];
  const showError = isTouched && error;

  const handleChange = (text: string) => {
    setFieldValue(name, text);
    
    if (isTouched && validate) {
      const validationError = validate(text, values);
      if (validationError) {
        setFieldError(name, validationError);
      } else {
        setFieldError(name, '');
      }
    }
  };

  const handleBlur = () => {
    setFieldTouched(name, true);
    
    if (validate) {
      const validationError = validate(value, values);
      if (validationError) {
        setFieldError(name, validationError);
      } else {
        setFieldError(name, '');
      }
    }
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        editable={!disabled}
        multiline
        numberOfLines={rows}
        maxLength={maxLength}
        className={`border rounded-lg px-4 py-3 text-base ${
          showError 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
        } ${disabled ? 'opacity-50' : ''} text-gray-900 dark:text-white ${inputClassName}`}
        placeholderTextColor="#9CA3AF"
        style={{ minHeight: rows * 24, textAlignVertical: 'top' }}
      />
      {maxLength && (
        <Text className="text-xs text-gray-500 mt-1 text-right">
          {value.length}/{maxLength}
        </Text>
      )}
      {showError && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
};

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onPress?: () => void;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  className = '',
  disabled = false,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`bg-blue-600 rounded-lg py-3 px-6 items-center ${
        disabled ? 'opacity-50' : 'active:bg-blue-700'
      } ${className}`}
    >
      <Text className="text-white font-semibold text-base">{children}</Text>
    </Pressable>
  );
};

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <View className={`mb-6 ${className}`}>
      {title && (
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </Text>
      )}
      {description && (
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </Text>
      )}
      {children}
    </View>
  );
};

// Example usage:
export const ExampleForm = () => {
  const handleSubmit = async (values: Record<string, any>) => {
    console.log('Form submitted:', values);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const validateForm = (values: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords must match';
    }
    
    return errors;
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Form
        initialValues={{ email: '', password: '', confirmPassword: '', bio: '' }}
        onSubmit={handleSubmit}
        validate={validateForm}
      >
        <FormSection
          title="Account Information"
          description="Enter your account details below"
        >
          <Field
            name="email"
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            required
            validate={composeValidators(
              validators.required(),
              validators.email()
            )}
          />
          
          <Field
            name="password"
            label="Password"
            placeholder="Enter password"
            type="password"
            required
            validate={composeValidators(
              validators.required(),
              validators.minLength(8)
            )}
          />
          
          <Field
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm password"
            type="password"
            required
          />
        </FormSection>

        <FormSection
          title="Profile"
          description="Tell us about yourself"
        >
          <TextAreaField
            name="bio"
            label="Bio"
            placeholder="Write a short bio..."
            rows={4}
            maxLength={500}
            validate={validators.maxLength(500)}
          />
        </FormSection>

        <SubmitButton>Create Account</SubmitButton>
      </Form>
    </ScrollView>
  );
};

