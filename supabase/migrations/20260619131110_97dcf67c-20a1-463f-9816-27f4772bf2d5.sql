
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  gender text CHECK (gender IN ('male','female','other')),
  state text,
  city text,
  birth_year int,
  birth_month int,
  birth_day int,
  birth_time time,
  birth_time_known boolean NOT NULL DEFAULT false,
  onboarded boolean NOT NULL DEFAULT false,
  free_minute_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + grant admin to seeded super admin phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULLIF(split_part(NEW.email, '@', 1), ''))
  );

  INSERT INTO public.wallet_balances (user_id, balance_paise) VALUES (NEW.id, 0);

  -- Super admin: phone 8767598378
  IF COALESCE(NEW.raw_user_meta_data->>'phone', split_part(NEW.email,'@',1)) = '8767598378' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Wallet (paise = 1/100 rupee, integer arithmetic)
CREATE TABLE public.wallet_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_paise bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_balances TO authenticated;
GRANT ALL ON public.wallet_balances TO service_role;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.wallet_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin wallet read" ON public.wallet_balances FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('topup','bonus','chat_debit','admin_credit','refund')),
  amount_paise bigint NOT NULL,
  balance_after_paise bigint NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own txns" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin all txns" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Astrologers catalog
CREATE TABLE public.astrologers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  tagline text,
  bio text,
  specialties text[] NOT NULL DEFAULT '{}',
  primary_system text NOT NULL CHECK (primary_system IN ('vedic','kp','hellenistic','tarot','numerology','combined')),
  skill_level int NOT NULL DEFAULT 5 CHECK (skill_level BETWEEN 1 AND 10),
  rate_paise_per_min int NOT NULL DEFAULT 500,
  priority int NOT NULL DEFAULT 0,
  is_recommended boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  avatar_gradient text NOT NULL DEFAULT 'from-violet-500 to-fuchsia-500',
  avatar_emoji text NOT NULL DEFAULT '🔮',
  system_prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.astrologers TO authenticated;
GRANT ALL ON public.astrologers TO service_role;
ALTER TABLE public.astrologers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all signed-in can browse astrologers" ON public.astrologers FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage astrologers" ON public.astrologers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Chat threads & messages
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  astrologer_id uuid REFERENCES public.astrologers(id) ON DELETE CASCADE NOT NULL,
  title text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, astrologer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads"   ON public.chat_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "create own thread" ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own thread" ON public.chat_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin all threads" ON public.chat_threads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  parts jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages read" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own messages insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin messages read" ON public.chat_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);

-- Horoscope cache
CREATE TABLE public.horoscope_cache (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  for_date date NOT NULL,
  body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, for_date)
);
GRANT SELECT, INSERT ON public.horoscope_cache TO authenticated;
GRANT ALL ON public.horoscope_cache TO service_role;
ALTER TABLE public.horoscope_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own horoscope" ON public.horoscope_cache FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own horoscope insert" ON public.horoscope_cache FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER wallet_touch BEFORE UPDATE ON public.wallet_balances FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
