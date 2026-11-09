-- V1 workflow correction, phase 1.
-- PostgreSQL requires this enum value to commit before any statement can use it.
alter type public.submission_status add value if not exists 'COMPLETE';
