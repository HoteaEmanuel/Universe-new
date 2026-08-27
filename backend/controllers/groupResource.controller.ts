import type { Request, Response } from "express";
import type {} from "multer";
import { findGroupMember } from "../repository/group-members.repository.js";
import {
  addGroupResource,
  editGroupResource,
  getGroupResourcesPage,
  registerResourceDownload,
  removeGroupResource,
  toggleGroupResourceHelpful,
  toggleGroupResourcePin,
} from "../services/groupResource.service.js";
import type {
  CreateGroupResourceInput,
  GroupResourcesQueryInput,
  UpdateGroupResourceInput,
} from "../schemas/groupResource.schema.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const getGroupResourcesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const groupId = req.params.id as string;
    const { cursor, limit, category, search, week } =
      req.query as unknown as GroupResourcesQueryInput;
    const page = await getGroupResourcesPage({
      groupId,
      requesterId: req.userId as string,
      cursor,
      limit,
      category,
      search,
      week,
    });
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const createGroupResourceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const groupId = req.params.id as string;
    const { title, description, category, week, linkUrl } =
      req.body as CreateGroupResourceInput;
    const file = req.file as Express.Multer.File | undefined;
    const resource = await addGroupResource({
      groupId,
      uploaderId: req.userId as string,
      title,
      description,
      category,
      week,
      linkUrl,
      file,
    });
    return res.status(201).json(resource);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const updateGroupResourceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { resourceId } = req.params as { resourceId: string };
    const groupId = req.params.id as string;
    const member = await findGroupMember(groupId, req.userId as string);
    const resource = await editGroupResource({
      resourceId,
      requesterId: req.userId as string,
      isAdmin: member?.role === "admin",
      ...(req.body as UpdateGroupResourceInput),
    });
    return res.status(200).json(resource);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const deleteGroupResourceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { resourceId } = req.params as { resourceId: string };
    const groupId = req.params.id as string;
    const member = await findGroupMember(groupId, req.userId as string);
    await removeGroupResource({
      resourceId,
      requesterId: req.userId as string,
      isAdmin: member?.role === "admin",
    });
    return res.status(200).json({ message: "Resource deleted" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const pinGroupResourceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { resourceId } = req.params as { resourceId: string };
    const resource = await toggleGroupResourcePin(resourceId);
    return res.status(200).json(resource);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const downloadGroupResourceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { resourceId } = req.params as { resourceId: string };
    const url = await registerResourceDownload(resourceId);
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const toggleGroupResourceHelpfulController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { resourceId } = req.params as { resourceId: string };
    const result = await toggleGroupResourceHelpful(
      resourceId,
      req.userId as string,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};
