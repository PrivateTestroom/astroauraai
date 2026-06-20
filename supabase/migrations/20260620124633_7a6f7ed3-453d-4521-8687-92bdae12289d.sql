ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS free_started_at timestamptz;

CREATE OR REPLACE FUNCTION public.wallet_debit_for_chat(_user_id uuid, _thread_id uuid, _astrologer_id uuid, _rate_paise integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _bal bigint;
  _started timestamptz;
  _free_window interval := interval '2 minutes';
BEGIN
  SELECT free_started_at INTO _started FROM public.chat_threads WHERE id = _thread_id AND user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread not found';
  END IF;

  -- First message ever in this thread: start the 2-min free window, no debit
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

  -- Still inside the free window: no debit
  IF now() - _started < _free_window THEN
    UPDATE public.chat_threads
       SET message_count = message_count + 1,
           last_message_at = now()
     WHERE id = _thread_id;
    SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
    RETURN COALESCE(_bal, 0);
  END IF;

  -- Past free window: require balance and debit
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