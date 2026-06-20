
ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS free_consumed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_count integer NOT NULL DEFAULT 0;

-- Atomic debit: returns new balance or NULL if insufficient
CREATE OR REPLACE FUNCTION public.wallet_debit_for_chat(
  _user_id uuid,
  _thread_id uuid,
  _astrologer_id uuid,
  _rate_paise integer
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bal bigint;
  _free boolean;
BEGIN
  SELECT free_consumed INTO _free FROM public.chat_threads WHERE id = _thread_id AND user_id = _user_id FOR UPDATE;
  IF _free IS NULL THEN
    RAISE EXCEPTION 'thread not found';
  END IF;

  IF _free = false THEN
    UPDATE public.chat_threads
       SET free_consumed = true,
           message_count = message_count + 1,
           last_message_at = now()
     WHERE id = _thread_id;
    SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
    RETURN _bal;
  END IF;

  SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id FOR UPDATE;
  IF _bal IS NULL OR _bal < _rate_paise THEN
    RETURN NULL;
  END IF;

  UPDATE public.wallet_balances
     SET balance_paise = balance_paise - _rate_paise
   WHERE user_id = _user_id
   RETURNING balance_paise INTO _bal;

  INSERT INTO public.wallet_transactions(user_id, kind, amount_paise, balance_after_paise, meta)
  VALUES (_user_id, 'chat_debit', -_rate_paise, _bal,
          jsonb_build_object('thread_id', _thread_id, 'astrologer_id', _astrologer_id));

  UPDATE public.chat_threads
     SET message_count = message_count + 1,
         last_message_at = now()
   WHERE id = _thread_id;

  RETURN _bal;
END $$;

-- Admin credit
CREATE OR REPLACE FUNCTION public.wallet_admin_credit(
  _target_user uuid,
  _amount_paise integer,
  _note text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _bal bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _amount_paise <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  INSERT INTO public.wallet_balances(user_id, balance_paise)
  VALUES (_target_user, _amount_paise)
  ON CONFLICT (user_id) DO UPDATE SET balance_paise = public.wallet_balances.balance_paise + EXCLUDED.balance_paise
  RETURNING balance_paise INTO _bal;

  INSERT INTO public.wallet_transactions(user_id, kind, amount_paise, balance_after_paise, meta)
  VALUES (_target_user, 'admin_credit', _amount_paise, _bal,
          jsonb_build_object('admin_id', auth.uid(), 'note', COALESCE(_note,'')));

  RETURN _bal;
END $$;

-- Thread upsert
CREATE OR REPLACE FUNCTION public.get_or_create_thread(_astrologer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _u uuid := auth.uid(); _tid uuid;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT id INTO _tid FROM public.chat_threads WHERE user_id = _u AND astrologer_id = _astrologer_id;
  IF _tid IS NULL THEN
    INSERT INTO public.chat_threads(user_id, astrologer_id) VALUES (_u, _astrologer_id) RETURNING id INTO _tid;
  END IF;
  RETURN _tid;
END $$;

-- Allow admins to update astrologers (existing policy is "manage" via ALL? verify)
DROP POLICY IF EXISTS "admins manage astrologers" ON public.astrologers;
CREATE POLICY "admins manage astrologers" ON public.astrologers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT EXECUTE ON FUNCTION public.wallet_debit_for_chat(uuid,uuid,uuid,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wallet_admin_credit(uuid,integer,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_thread(uuid) TO authenticated, service_role;
