REVOKE ALL ON public.repayments FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

CREATE POLICY "Deny anon access to repayments" ON public.repayments FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon access to user_roles" ON public.user_roles FOR SELECT TO anon USING (false);