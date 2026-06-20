
-- Ensure 2 free minutes for every astrologer
UPDATE public.astrologers SET free_minutes = 2 WHERE free_minutes IS DISTINCT FROM 2;
ALTER TABLE public.astrologers ALTER COLUMN free_minutes SET DEFAULT 2;

-- Track when the last per-minute charge was applied for accurate metered billing
ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS last_charge_at timestamptz;

-- Real metered billing: 2 free minutes per thread, then debit per elapsed minute
CREATE OR REPLACE FUNCTION public.wallet_debit_for_chat(
  _user_id uuid, _thread_id uuid, _astrologer_id uuid, _rate_paise integer
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _bal bigint;
  _free_min int;
  _started timestamptz;
  _free_end timestamptz;
  _last_charge timestamptz;
  _minutes int;
  _charge bigint;
  _now timestamptz := now();
BEGIN
  SELECT COALESCE(free_minutes, 2) INTO _free_min FROM public.astrologers WHERE id = _astrologer_id;
  IF _free_min IS NULL THEN _free_min := 2; END IF;

  UPDATE public.chat_threads
     SET message_count = message_count + 1,
         last_message_at = _now,
         free_started_at = COALESCE(free_started_at, _now)
   WHERE id = _thread_id AND user_id = _user_id
   RETURNING free_started_at, last_charge_at INTO _started, _last_charge;
  IF NOT FOUND THEN RAISE EXCEPTION 'thread not found'; END IF;

  _free_end := _started + make_interval(mins => _free_min);

  -- Still inside the free window — no debit
  IF _now <= _free_end THEN
    SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
    RETURN COALESCE(_bal, 0);
  END IF;

  -- Compute how many whole minutes have elapsed since the last metered point
  _minutes := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (_now - COALESCE(_last_charge, _free_end))) / 60.0)::int);
  _charge := _minutes::bigint * _rate_paise::bigint;

  SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
  _bal := COALESCE(_bal, 0);
  IF _bal < _charge THEN
    RETURN NULL; -- insufficient funds
  END IF;

  UPDATE public.wallet_balances
     SET balance_paise = balance_paise - _charge
   WHERE user_id = _user_id
   RETURNING balance_paise INTO _bal;

  UPDATE public.chat_threads SET last_charge_at = _now, free_consumed = true WHERE id = _thread_id;

  INSERT INTO public.wallet_transactions(user_id, kind, amount_paise, balance_after_paise, meta)
  VALUES (_user_id, 'chat_debit', -_charge, _bal,
          jsonb_build_object('thread_id', _thread_id, 'astrologer_id', _astrologer_id,
                             'minutes', _minutes, 'rate_paise', _rate_paise));

  RETURN _bal;
END;
$$;
