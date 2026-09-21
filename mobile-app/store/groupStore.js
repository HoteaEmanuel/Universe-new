import axios from "axios";
import { create } from "zustand";
const API_URL =
  import.meta.env.API_URL || "http://localhost:5000/api";
export const useGroupStore = create((set) => ({
  isLoading: false,
  createGroup: async ({ name, description }) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/groups`, {
        name: name,
        description: description,
      });
      return response.data.group;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteGroup: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.delete(`${API_URL}/groups/${id}`);
      console.log(response);
      return response.data.message;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserGroups: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/groups/user/${userId}`);
      return response.data.groups;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getGroupById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/groups/${id}`);
      return response.data.group;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getGroupMessages: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/groups/${id}/messages`);
      console.log(response);
      return response.data.groupMessages;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  sendMessageToGroup: async (id, message) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/groups/${id}/send-message`,
        message,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      console.log(response);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  editMessageInGroup: async (messageId, content) => {
    set({ isLoading: true });
    try {
      const response = await axios.patch(
        `${API_URL}/groups/edit-message/${messageId}`,
        { content },
      );
      const message = response.data.message;
      console.log("Message edited in group store");
      console.log(message);
      return message;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteMessageInGroup: async (messageId) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/groups/delete-message/${messageId}`,
      );
      return response.data.message;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  checkUserIsAdmin: async (groupId, userId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/check-admin/${userId}`,
      );
      console.log(response);
      return response.data.isAdmin;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  addMemberToGroup: async (groupId, userId) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/add-member`,
        { userId },
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getGroupMembers: async (groupId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/members`);
      return response.data.members;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getGroupMemberById: async (groupId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/auth-user`,
      );
      return response.data.member;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUsersFromSameUniversityNotInGroup: (groupId) => async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/users-from-same-university-not-in-group`,
      );
      return response.data.users;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  leaveGroup: async (groupId) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/leave-group`,
      );
      return response.data.message;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  makeUserAdmin: async (groupId, userId) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/make-admin/${userId}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  updateGroupImage: async (groupId, image) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      formData.append("image", image);
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/change-group-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
