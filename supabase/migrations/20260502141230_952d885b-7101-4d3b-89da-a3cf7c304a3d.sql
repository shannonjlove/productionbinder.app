
-- Lock down SECURITY DEFINER functions: revoke direct EXECUTE.
-- They remain usable from RLS policies (which run as the table owner) and triggers.
REVOKE EXECUTE ON FUNCTION public.is_production_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
