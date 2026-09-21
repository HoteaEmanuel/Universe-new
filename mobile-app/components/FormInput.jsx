import { View, Text } from "react-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import ThemedText from "./ThemedText";
import ThemedTextInput from "./ThemeTextInput";

const FormInput = ({
  control,
  name,
  rules,
  placeholder,
  secureTextEntry,
  errors,
  ...props
}) => {
  return (
    <View>
      <Controller
        name={name}
        rules={rules}
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <ThemedTextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            className={`
              border p-3 rounded-lg
              ${errors[name] ? "border-red-500" : "border-gray-300"}
            `}
            {...props}
          />
        )}
      />
    </View>
  );
};

export default FormInput;
