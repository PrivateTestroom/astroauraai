-- Extend astrologers with editable fields and metadata
ALTER TABLE public.astrologers
  ADD COLUMN IF NOT EXISTS free_minutes int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS systems text[] NOT NULL DEFAULT ARRAY['parashara']::text[],
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT ARRAY['English','Hindi']::text[],
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT ARRAY['Love','Career']::text[],
  ADD COLUMN IF NOT EXISTS experience_years int NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) NOT NULL DEFAULT 4.7,
  ADD COLUMN IF NOT EXISTS reviews_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;

-- Admin can update / insert / delete astrologers
DROP POLICY IF EXISTS "admins update astrologers" ON public.astrologers;
CREATE POLICY "admins update astrologers" ON public.astrologers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "admins insert astrologers" ON public.astrologers;
CREATE POLICY "admins insert astrologers" ON public.astrologers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "admins delete astrologers" ON public.astrologers;
CREATE POLICY "admins delete astrologers" ON public.astrologers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Wallet debit now reads free_minutes from the astrologer row
CREATE OR REPLACE FUNCTION public.wallet_debit_for_chat(_user_id uuid, _thread_id uuid, _astrologer_id uuid, _rate_paise integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _bal bigint;
  _started timestamptz;
  _free_minutes int;
  _free_window interval;
BEGIN
  SELECT COALESCE(free_minutes, 2) INTO _free_minutes
    FROM public.astrologers WHERE id = _astrologer_id;
  IF _free_minutes IS NULL THEN _free_minutes := 2; END IF;
  _free_window := make_interval(mins => _free_minutes);

  SELECT free_started_at INTO _started
    FROM public.chat_threads WHERE id = _thread_id AND user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread not found';
  END IF;

  IF _started IS NULL THEN
    UPDATE public.chat_threads
       SET free_started_at = now(),
           free_consumed = false,
           message_count = message_count + 1,
           last_message_at = now()
     WHERE id = _thread_id;
    SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
    RETURN COALESCE(_bal, 0);
  END IF;

  IF now() - _started < _free_window THEN
    UPDATE public.chat_threads
       SET message_count = message_count + 1,
           last_message_at = now()
     WHERE id = _thread_id;
    SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
    RETURN COALESCE(_bal, 0);
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
     SET free_consumed = true,
         message_count = message_count + 1,
         last_message_at = now()
   WHERE id = _thread_id;

  RETURN _bal;
END $function$;