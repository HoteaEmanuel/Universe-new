import type { ResourceCategory } from "../generated/prisma/client.js";
import { uploadImage, deleteImages } from "../lib/storage.js";
import {
  createGroupResource,
  deleteGroupResource,
  findGroupResourceById,
  findGroupResourcesPage,
  findUserHelpfulVoteResourceIds,
  incrementResourceDownloadCount,
  setGroupResourcePinned,
  toggleResourceHelpfulVote,
  updateGroupResource,
} from "../repository/groupResource.repository.js";

export type UploadedResourceFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

interface AddGroupResourceInput {
  groupId: string;
  uploaderId: string;
  title: string;
  description?: string;
  category: ResourceCategory;
  week?: string;
  linkUrl?: string;
  file?: UploadedResourceFile;
}

export const addGroupResource = async (data: AddGroupResourceInput) => {
  const { groupId, uploaderId, title, description, category, week, linkUrl, file } =
    data;

  if (!file && !linkUrl) {
    throw new Error("Provide either a file or a link");
  }
  if (file && linkUrl) {
    throw new Error("Provide either a file or a link, not both");
  }

  if (file) {
    const { url, key } = await uploadImage({
      buffer: file.buffer,
      mimeType: file.mimetype,
      folder: "course_resources",
    });
    return createGroupResource({
      groupId,
      uploaderId,
      title,
      description,
      category,
      week,
      fileUrl: url,
      fileKey: key,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  return createGroupResource({
    groupId,
    uploaderId,
    title,
    description,
    category,
    week,
    linkUrl,
  });
};

export const getGroupResourcesPage = async (data: {
  groupId: string;
  requesterId: string;
  cursor?: string;
  limit: number;
  category?: ResourceCategory;
  search?: string;
  week?: string;
}) => {
  const { requesterId, ...pageInput } = data;
  const page = await findGroupResourcesPage(pageInput);
  const helpfulResourceIds = await findUserHelpfulVoteResourceIds(
    page.items.map((item) => item.id),
    requesterId,
  );
  return {
    ...page,
    items: page.items.map((item) => ({
      ...item,
      helpfulCount: item._count.helpfulVotes,
      votedHelpful: helpfulResourceIds.has(item.id),
    })),
  };
};

interface UpdateGroupResourceServiceInput {
  resourceId: string;
  groupId: string;
  requesterId: string;
  isAdmin: boolean;
  title?: string;
  description?: string;
  category?: ResourceCategory;
  week?: string;
}

const assertCanModify = (
  resource: { uploaderId: string },
  requesterId: string,
  isAdmin: boolean,
) => {
  if (resource.uploaderId !== requesterId && !isAdmin) {
    throw new Error("You can only modify your own resources");
  }
};

// The route middleware only confirms the requester belongs to (or admins)
// the group named in the URL, not that :resourceId actually belongs to that
// group - without this, a resource id from a different (possibly private)
// group could be edited/deleted/pinned by anyone who admins their own
// unrelated group.
const assertBelongsToGroup = (
  resource: { groupId: string },
  groupId: string,
) => {
  if (resource.groupId !== groupId) {
    throw new Error("Resource not found");
  }
};

export const editGroupResource = async (
  data: UpdateGroupResourceServiceInput,
) => {
  const { resourceId, groupId, requesterId, isAdmin, ...fields } = data;
  const resource = await findGroupResourceById(resourceId);
  if (!resource) throw new Error("Resource not found");
  assertBelongsToGroup(resource, groupId);
  assertCanModify(resource, requesterId, isAdmin);
  return updateGroupResource(resourceId, fields);
};

export const removeGroupResource = async (data: {
  resourceId: string;
  groupId: string;
  requesterId: string;
  isAdmin: boolean;
}) => {
  const { resourceId, groupId, requesterId, isAdmin } = data;
  const resource = await findGroupResourceById(resourceId);
  if (!resource) throw new Error("Resource not found");
  assertBelongsToGroup(resource, groupId);
  assertCanModify(resource, requesterId, isAdmin);
  await deleteGroupResource(resourceId);
  if (resource.fileKey) await deleteImages([resource.fileKey]);
};

export const toggleGroupResourcePin = async (
  resourceId: string,
  groupId: string,
) => {
  const resource = await findGroupResourceById(resourceId);
  if (!resource) throw new Error("Resource not found");
  assertBelongsToGroup(resource, groupId);
  return setGroupResourcePinned(resourceId, !resource.pinned);
};

export const registerResourceDownload = async (
  resourceId: string,
  groupId: string,
) => {
  const resource = await findGroupResourceById(resourceId);
  if (!resource) throw new Error("Resource not found");
  assertBelongsToGroup(resource, groupId);
  await incrementResourceDownloadCount(resourceId);
  return resource.fileUrl ?? resource.linkUrl;
};

export const toggleGroupResourceHelpful = async (
  resourceId: string,
  groupId: string,
  userId: string,
) => {
  const resource = await findGroupResourceById(resourceId);
  if (!resource) throw new Error("Resource not found");
  assertBelongsToGroup(resource, groupId);
  return toggleResourceHelpfulVote(resourceId, userId);
};
