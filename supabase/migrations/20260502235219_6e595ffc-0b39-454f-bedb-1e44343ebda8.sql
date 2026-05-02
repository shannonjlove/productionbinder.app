
-- Remove inconsistent 'producer' global role access on productions.
-- Previously, users with the 'producer' role could SELECT/UPDATE every production
-- row, but is_production_member() (which guards all child tables) does not grant
-- producer access, leading to inconsistent and overly-broad access on productions.

DROP POLICY IF EXISTS "Members can view productions" ON public.productions;
DROP POLICY IF EXISTS "Producers and admins can update productions" ON public.productions;

CREATE POLICY "Members can view productions"
ON public.productions
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can update productions"
ON public.productions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
