// api/leads/searches/index.js
// Saved searches API - Feature 3: Save searches
// Handles GET, POST, PUT, DELETE, and RUN actions for saved searches

import { withOrganization } from "../../_middleware/with-organization.js";
import logger from "../../_lib/logger.js";

const isValidUUID = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function listSearches(req, res, orgId) {
  try {
    const { data: searches, error } = await req.supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error listing saved searches", {
        error: error.message,
        orgId,
      });
      return res.status(500).json({ error: "Failed to fetch saved searches" });
    }

    return res.status(200).json({ searches });
  } catch (error) {
    logger.error("Error in listSearches", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createSearch(req, res, orgId) {
  try {
    const {
      name,
      query,
      location,
      headcount,
      ownership,
      intent_to_sell,
      filters,
    } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (name.length > 255) {
      return res
        .status(400)
        .json({ error: "Name must be 255 characters or less" });
    }

    const { data: search, error } = await req.supabase
      .from("saved_searches")
      .insert({
        user_id: orgId,
        name: name.trim(),
        query: query.trim(),
        location: location || null,
        headcount: headcount || null,
        ownership: ownership || null,
        intent_to_sell: intent_to_sell || false,
        filters: filters || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating saved search", {
        error: error.message,
        orgId,
      });
      return res.status(500).json({ error: "Failed to create saved search" });
    }

    return res.status(201).json({ search });
  } catch (error) {
    logger.error("Error in createSearch", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateSearch(req, res, orgId) {
  try {
    const { id } = req.query;
    const {
      name,
      query,
      location,
      headcount,
      ownership,
      intent_to_sell,
      filters,
    } = req.body;

    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ error: "Valid search ID is required" });
    }

    // Validate at least one field to update
    if (
      !name &&
      !query &&
      !location &&
      headcount === undefined &&
      !ownership &&
      intent_to_sell === undefined &&
      !filters
    ) {
      return res
        .status(400)
        .json({ error: "At least one field to update is required" });
    }

    // Build update object
    const updates = {};
    if (name) {
      if (name.length > 255) {
        return res
          .status(400)
          .json({ error: "Name must be 255 characters or less" });
      }
      updates.name = name.trim();
    }
    if (query) updates.query = query.trim();
    if (location !== undefined) updates.location = location;
    if (headcount !== undefined) updates.headcount = headcount;
    if (ownership !== undefined) updates.ownership = ownership;
    if (intent_to_sell !== undefined) updates.intent_to_sell = intent_to_sell;
    if (filters !== undefined) updates.filters = filters;
    updates.updated_at = new Date().toISOString();

    const { data: search, error } = await req.supabase
      .from("saved_searches")
      .update(updates)
      .eq("id", id)
      .eq("user_id", orgId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res
          .status(404)
          .json({ error: "Search not found or not authorized" });
      }
      logger.error("Error updating saved search", {
        error: error.message,
        orgId,
        id,
      });
      return res.status(500).json({ error: "Failed to update saved search" });
    }

    return res.status(200).json({ search });
  } catch (error) {
    logger.error("Error in updateSearch", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteSearch(req, res, orgId) {
  try {
    const { id } = req.query;

    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ error: "Valid search ID is required" });
    }

    const { error } = await req.supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", orgId);

    if (error) {
      logger.error("Error deleting saved search", {
        error: error.message,
        orgId,
        id,
      });
      return res.status(500).json({ error: "Failed to delete saved search" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error in deleteSearch", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function runSearch(req, res, orgId) {
  try {
    const { id } = req.query;

    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ error: "Valid search ID is required" });
    }

    // Fetch the saved search
    const { data: search, error } = await req.supabase
      .from("saved_searches")
      .select("*")
      .eq("id", id)
      .eq("user_id", orgId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res
          .status(404)
          .json({ error: "Search not found or not authorized" });
      }
      logger.error("Error fetching saved search", {
        error: error.message,
        orgId,
        id,
      });
      return res.status(500).json({ error: "Failed to fetch saved search" });
    }

    // Return the search parameters so the client can execute the search
    return res.status(200).json({ search });
  } catch (error) {
    logger.error("Error in runSearch", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handler(req, res) {
  const orgId = req.organization.id;

  switch (req.method) {
    case "GET":
      return await listSearches(req, res, orgId);
    case "POST":
      const action = req.query.action;
      if (action === "run") {
        return await runSearch(req, res, orgId);
      }
      return await createSearch(req, res, orgId);
    case "PUT":
      return await updateSearch(req, res, orgId);
    case "DELETE":
      return await deleteSearch(req, res, orgId);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

export default withOrganization(handler);
