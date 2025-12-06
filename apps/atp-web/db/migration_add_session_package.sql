-- Migration: Add session_package column to agents table
-- This allows storing the sessionPackage JSON in the database

ALTER TABLE agents ADD COLUMN session_package TEXT;

