import { View, Text } from 'react-native'
import React from 'react'

export const getUserFullName=(user)=>{
  if(!user) return "";
  return user?.name || `${user?.firstName} ${user?.lastName}`;
}