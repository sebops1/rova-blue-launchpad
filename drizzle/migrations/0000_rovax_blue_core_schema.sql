-- ============ ROLES ============
create type public.app_role as enum ('founder_admin','operations','finance','viewer');

create table public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.can_edit(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('founder_admin','operations','finance')
  )
$$;

create policy "roles readable by authenticated" on public.user_roles for select to authenticated using (true);
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'founder_admin')) with check (public.has_role(auth.uid(),'founder_admin'));

-- bootstrap profile + role on first login
create or replace function public.ensure_profile(_full_name text default null)
returns public.app_role language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text;
  _role public.app_role;
  _any boolean;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  select email into _email from auth.users where id = _uid;
  insert into public.profiles (id, email, full_name)
  values (_uid, _email, coalesce(_full_name, split_part(coalesce(_email,''),'@',1)))
  on conflict (id) do update set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  select role into _role from public.user_roles where user_id = _uid limit 1;
  if _role is null then
    select exists(select 1 from public.user_roles) into _any;
    _role := case when _any then 'viewer'::public.app_role else 'founder_admin'::public.app_role end;
    insert into public.user_roles (user_id, role) values (_uid, _role) on conflict do nothing;
  end if;
  return _role;
end;
$$;
grant execute on function public.ensure_profile(text) to authenticated;

-- shared updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ SITES ============
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  gps_notes text,
  scores jsonb not null default '{}'::jsonb,
  weekday_observations text,
  weekend_observations text,
  tide_weather_notes text,
  access_notes text,
  notes text,
  decision text not null default 'Shortlist',
  data_status text not null default 'Planning / Unvalidated',
  visited_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sites to authenticated;
grant all on public.sites to service_role;
alter table public.sites enable row level security;
create trigger sites_touch before update on public.sites for each row execute function public.touch_updated_at();

create table public.site_photos (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.site_photos to authenticated;
grant all on public.site_photos to service_role;
alter table public.site_photos enable row level security;

-- ============ CRM / MEETINGS ============
create table public.stakeholders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  stakeholder_role text,
  phone text,
  email text,
  site_id uuid references public.sites(id) on delete set null,
  meeting_date date,
  follow_up_date date,
  status text not null default 'To Contact',
  questions jsonb not null default '{}'::jsonb,
  models jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.stakeholders to authenticated;
grant all on public.stakeholders to service_role;
alter table public.stakeholders enable row level security;
create trigger stakeholders_touch before update on public.stakeholders for each row execute function public.touch_updated_at();

-- ============ COMPLIANCE ============
create table public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  status text not null default 'Not Started',
  owner text,
  due_date date,
  reference text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.compliance_items to authenticated;
grant all on public.compliance_items to service_role;
alter table public.compliance_items enable row level security;
create trigger compliance_touch before update on public.compliance_items for each row execute function public.touch_updated_at();

-- ============ PROCUREMENT ============
create table public.procurement_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Equipment',
  phase int not null default 1,
  supplier text,
  url text,
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  freight numeric not null default 0,
  duty numeric not null default 0,
  local_delivery numeric not null default 0,
  price_basis text not null default 'Reference',
  status text not null default 'Planned',
  priority text not null default 'Medium',
  quote_date date,
  quote_expiry date,
  quote_path text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.procurement_items to authenticated;
grant all on public.procurement_items to service_role;
alter table public.procurement_items enable row level security;
create trigger procurement_touch before update on public.procurement_items for each row execute function public.touch_updated_at();

-- ============ EXPERIENCES ============
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes int,
  capacity int,
  inclusions text,
  direct_cost numeric not null default 0,
  price numeric not null default 0,
  active boolean not null default true,
  is_addon boolean not null default false,
  sort_order int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.experiences to authenticated;
grant select on public.experiences to anon;
grant all on public.experiences to service_role;
alter table public.experiences enable row level security;
create trigger experiences_touch before update on public.experiences for each row execute function public.touch_updated_at();
create policy "public can read active experiences" on public.experiences for select to anon using (active = true);

-- ============ LEADS ============
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  source text not null default 'Other',
  experience_id uuid references public.experiences(id) on delete set null,
  desired_package text,
  desired_date date,
  party_size int,
  quoted_price numeric default 0,
  deposit numeric default 0,
  status text not null default 'New Lead',
  notes text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.leads to authenticated;
grant insert on public.leads to anon;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
create policy "public can join waitlist" on public.leads for insert to anon with check (status = 'New Lead');

-- ============ PARTNERS ============
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_type text not null default 'Hotel / Resort',
  contact_name text,
  phone text,
  email text,
  commission_pct numeric default 0,
  status text not null default 'Prospect',
  next_follow_up date,
  notes text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.partners to authenticated;
grant insert on public.partners to anon;
grant all on public.partners to service_role;
alter table public.partners enable row level security;
create trigger partners_touch before update on public.partners for each row execute function public.touch_updated_at();
create policy "public can submit partner interest" on public.partners for insert to anon with check (status = 'Inbound Enquiry');

-- ============ TASKS ============
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Backlog',
  owner text,
  due_date date,
  priority text not null default 'Medium',
  category text not null default 'General',
  week int,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- ============ DOCUMENTS ============
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  section text not null default 'General',
  link_url text,
  storage_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create trigger documents_touch before update on public.documents for each row execute function public.touch_updated_at();

-- ============ CASHFLOW ============
create table public.cashflow_months (
  id uuid primary key default gen_random_uuid(),
  month_index int not null unique,
  label text not null,
  revenue numeric not null default 0,
  variable_cost_pct numeric not null default 20,
  operating_expense numeric not null default 4400,
  capex numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.cashflow_months to authenticated;
grant all on public.cashflow_months to service_role;
alter table public.cashflow_months enable row level security;
create trigger cashflow_touch before update on public.cashflow_months for each row execute function public.touch_updated_at();

-- ============ SETTINGS ============
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create trigger settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();

-- ============ POLICIES: read for all authenticated, write for editors ============
do $$
declare t text;
begin
  foreach t in array array['sites','site_photos','stakeholders','compliance_items','procurement_items',
                           'experiences','leads','partners','tasks','documents','cashflow_months','app_settings']
  loop
    execute format('create policy "auth read %1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "editor insert %1$s" on public.%1$I for insert to authenticated with check (public.can_edit(auth.uid()))', t);
    execute format('create policy "editor update %1$s" on public.%1$I for update to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()))', t);
    execute format('create policy "editor delete %1$s" on public.%1$I for delete to authenticated using (public.can_edit(auth.uid()))', t);
  end loop;
end $$;

-- ============ SEED ============
insert into public.sites (name, area, decision, notes) values
  ('River No. 2 Beach','Western Area Peninsula','Shortlist','Planning / Unvalidated - awaiting site visit.'),
  ('Tokeh Beach','Western Area Peninsula','Shortlist','Planning / Unvalidated - awaiting site visit.'),
  ('Bureh Beach','Western Area Peninsula','Shortlist','Planning / Unvalidated - awaiting site visit.'),
  ('Lakka Beach','Western Area Peninsula','Shortlist','Planning / Unvalidated - awaiting site visit.'),
  ('Black Johnson Beach','Western Area Peninsula','Shortlist','Planning / Unvalidated - awaiting site visit.'),
  ('Kent Beach','Western Area Peninsula','Shortlist','Planning / Unvalidated - awaiting site visit.');

insert into public.experiences (name, duration_minutes, capacity, price, direct_cost, inclusions, is_addon, sort_order) values
  ('Crystal Mini', 30, 1, 40, 8, 'Transparent kayak session, PFD, safety brief, photo moment', false, 1),
  ('Crystal Premium', 60, 1, 70, 14, 'Extended kayak session, PFD, guide, drone/action photo set', false, 2),
  ('Couples Experience', 90, 2, 110, 24, 'Double kayak, guide, photo set, refreshment', false, 3),
  ('Sunset VIP', 90, 2, 150, 32, 'Golden hour session, reserved cabana, premium photo/video set', false, 4),
  ('Proposal / Celebration', 150, 2, 275, 70, 'Private setup, decor, dedicated photographer, floating props (starting price)', false, 5),
  ('Floating Breakfast Add-On', 45, 2, 60, 18, 'Floating tray breakfast styling and photos', true, 6),
  ('VIP Cabana Add-On', 120, 4, 40, 8, 'Reserved shaded cabana with seating', true, 7),
  ('SUP / Snorkel Add-On', 30, 1, 15, 3, 'Paddleboard or snorkel set hire with safety brief', true, 8);

insert into public.procurement_items (name, category, phase, qty, unit_price, price_basis, priority, sort_order, notes) values
  ('Transparent crystal kayak','Watercraft',1,2,1299,'Reference','High',1,'Core hero product for the Crystal experiences.'),
  ('DJI Mini 4 Pro Fly More Combo','Content',1,1,1099,'Reference','High',2,'Drone use subject to SLCAA verification.'),
  ('DJI Osmo Action 5 Pro','Content',1,1,319,'Reference','High',3,'Action/underwater capture.'),
  ('Premium inflatable SUP','Watercraft',1,2,579,'Reference','Medium',4,'Add-on revenue and content.'),
  ('PFD / life jacket','Safety',1,10,45,'Planning allowance','High',5,'Mandatory for every guest on water.'),
  ('Snorkeling set','Watercraft',1,6,75,'Planning allowance','Medium',6,'Add-on hire.'),
  ('Floating water mat','Experience',1,1,450,'Planning allowance','Medium',7,'Photo and lounging feature.'),
  ('EcoFlow River 2 Max power station','Power',1,1,289,'Reference','High',8,'Charging for drones, cameras, POS.'),
  ('Premium cabana / canopy setup','Experience',1,2,250,'Planning allowance','High',9,'VIP shade and brand presence.'),
  ('Dry bags + waterproof storage','Equipment',1,1,350,'Planning allowance','Medium',10,'Guest belongings and kit protection.'),
  ('Marine safety / rescue bundle','Safety',1,1,600,'Planning allowance','High',11,'Throw rope, rescue board, first aid, whistles.'),
  ('Floating breakfast / picnic props','Experience',1,1,500,'Planning allowance','Medium',12,'Styling props for premium packages.'),
  ('Reception / signage / QR guest setup','Brand',1,1,400,'Planning allowance','Medium',13,'On-beach brand presence and digital waivers.'),
  ('Hydrobike Explorer','Watercraft',2,1,2499,'Reference','Low',14,'Phase 2 only - excluded from Phase 1 capital.');

insert into public.compliance_items (title, category, sort_order, notes) values
  ('Company / business documentation','Legal',1,'Confirm registration and operating documents are current.'),
  ('Site authorization / operating permission','Site',2,'Written permission from the party that controls the site.'),
  ('Tourism / local council approvals as applicable','Regulatory',3,'Confirm what is actually required for this activity and location.'),
  ('Commercial drone / UAS requirements verification with SLCAA','Regulatory',4,'Verify requirements directly with SLCAA before any commercial flight.'),
  ('Insurance (public liability / equipment)','Insurance',5,'Obtain quotations and confirm water-activity coverage.'),
  ('Customer waiver / terms of participation','Safety',6,'Draft and review before first paid session.'),
  ('PFD policy (mandatory buoyancy aid)','Safety',7,'Written policy: no PFD, no launch.'),
  ('First aid capability and kit','Safety',8,'Certified first aider on site during operating hours.'),
  ('Rescue equipment on site','Safety',9,'Throw rope, rescue board, signalling equipment.'),
  ('Weather / no-go standard operating procedure','Safety',10,'Defined wind, swell and visibility cut-offs.'),
  ('Incident log and reporting process','Safety',11,'Record every incident and near miss.'),
  ('Staff training and competency records','Operations',12,'Water safety, guest handling, equipment care.'),
  ('Daily equipment inspection checklist','Operations',13,'Pre-open and post-close inspection.'),
  ('Emergency contacts and evacuation plan','Safety',14,'Nearest clinic, marine rescue, community contacts.');

insert into public.tasks (title, status, priority, category, week, sort_order) values
  ('Confirm site visit schedule for all six candidate beaches','This Week','High','Site Validation',1,1),
  ('Visit and score River No. 2, Tokeh and Bureh','This Week','High','Site Validation',1,2),
  ('Visit and score Lakka, Black Johnson and Kent','This Week','High','Site Validation',1,3),
  ('Record weekday vs weekend traffic observations','Backlog','High','Site Validation',1,4),
  ('Capture site photos and GPS notes','Backlog','Medium','Site Validation',1,5),
  ('Complete weighted site comparison and select preferred site','Backlog','High','Site Validation',1,6),
  ('Identify who controls permission at the preferred site','Backlog','High','Negotiation',2,7),
  ('Book stakeholder meetings at top two sites','Backlog','High','Negotiation',2,8),
  ('Present 90-day pilot proposal and agree commercial terms','Backlog','High','Negotiation',2,9),
  ('Confirm storage, security, utilities and operating hours','Backlog','Medium','Negotiation',2,10),
  ('Request supplier quotations for kayaks and safety kit','Backlog','High','Procurement',2,11),
  ('Obtain freight, duty and local delivery estimates','Backlog','High','Procurement',3,12),
  ('Verify commercial drone requirements with SLCAA','Backlog','High','Compliance',3,13),
  ('Obtain public liability insurance quotations','Backlog','High','Compliance',3,14),
  ('Finalise waiver, PFD policy and weather no-go SOP','Backlog','High','Compliance',3,15),
  ('Build hotel and tour operator partner list','Backlog','Medium','Partnerships',3,16),
  ('Launch pre-sales campaign and waitlist capture','Backlog','High','Pre-Sales',3,17),
  ('Secure first launch-weekend bookings and deposits','Backlog','High','Pre-Sales',4,18),
  ('Run dry-run safety and operations rehearsal','Backlog','High','Operations',4,19),
  ('Go / No-Go review against launch readiness criteria','Backlog','High','Launch',4,20);

insert into public.documents (title, section, notes) values
  ('RovaX Blue concept presentation','Concept','Placeholder - upload the current deck.'),
  ('Equipment catalog','Procurement','Placeholder - upload catalog or supplier links.'),
  ('Financial model workbook','Finance','Placeholder - upload the working model.'),
  ('Site photos','Sites','Placeholder - upload site visit photography.'),
  ('Supplier quotations','Procurement','Placeholder - upload quotations as received.'),
  ('Permissions and authorizations','Compliance','Placeholder - upload only once actually issued.'),
  ('Insurance documentation','Compliance','Placeholder - upload policy or quotations.'),
  ('Standard operating procedures','Operations','Placeholder - upload SOP set.'),
  ('Customer waivers','Operations','Placeholder - upload approved waiver template.'),
  ('Partnership agreements','Partnerships','Placeholder - upload executed agreements only.');

insert into public.cashflow_months (month_index, label, revenue, capex, operating_expense)
select g, 'Month ' || g,
  case when g = 1 then 4000 when g = 2 then 6000 when g = 3 then 8000 else 8000 end,
  case when g = 1 then 20863 else 0 end,
  4400
from generate_series(1,12) g;

insert into public.app_settings (key, value) values
  ('company', '{"name":"RovaX Blue","tagline":"More Than a Beach. A Memory for Life.","subtitle":"Experience Sierra Leone Differently.","email":"","phone":"","location":"Western Area Peninsula, Sierra Leone","launch_date":null}'::jsonb),
  ('currency', '{"base":"USD","sle_rate":23000,"show_sle":true}'::jsonb),
  ('finance', '{"capital":20863,"monthly_opex":4400,"variable_pct":20,"operating_days":20,"scenarios":[4000,6000,8000,10000,12000,14000],"opening_cash":20863}'::jsonb),
  ('scoring_weights', '{"water_calmness":10,"water_clarity":9,"visitor_traffic":8,"premium_potential":9,"road_access":7,"parking":5,"security":8,"facilities":6,"power":5,"connectivity":5,"storage":6,"operating_space":7,"hotel_partnerships":8,"community_support":9,"cost_terms":8,"expansion":6}'::jsonb),
  ('investor_share', '{"enabled":true,"show_financials":true,"show_sites":true,"show_pipeline":true}'::jsonb);
