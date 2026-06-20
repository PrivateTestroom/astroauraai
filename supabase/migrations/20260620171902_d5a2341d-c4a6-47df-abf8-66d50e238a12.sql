CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _phone text;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULLIF(split_part(NEW.email, '@', 1), ''))
  );

  INSERT INTO public.wallet_balances (user_id, balance_paise) VALUES (NEW.id, 0);

  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', split_part(NEW.email,'@',1));

  IF _phone IN ('8767598378', '8010920477') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Temporary: make all chats free by always returning current balance without debiting
CREATE OR REPLACE FUNCTION public.wallet_debit_for_chat(_user_id uuid, _thread_id uuid, _astrologer_id uuid, _rate_paise integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _bal bigint;
BEGIN
  UPDATE public.chat_threads
     SET message_count = message_count + 1,
         last_message_at = now(),
         free_started_at = COALESCE(free_started_at, now())
   WHERE id = _thread_id AND user_id = _user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread not found';
  END IF;
  SELECT balance_paise INTO _bal FROM public.wallet_balances WHERE user_id = _user_id;
  RETURN COALESCE(_bal, 0);
END;
$function$;